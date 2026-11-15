import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

export const integrationProviders = {
  openai: {
    name: "OpenAI",
    env: "OPENAI_API_KEY",
    modelEnv: "OPENAI_MODEL",
    model: "gpt-4.1-mini",
  },
  deepseek: {
    name: "DeepSeek",
    env: "DEEPSEEK_API_KEY",
    modelEnv: "DEEPSEEK_MODEL",
    model: "deepseek-flash",
  },
  gemini: {
    name: "Google Gemini",
    env: "GEMINI_API_KEY",
    modelEnv: "GEMINI_MODEL",
    model: "gemini-4-hydrogen",
  },
  resend: { name: "Resend email", env: "RESEND_API_KEY" },
};

function key() {
  const secret =
    process.env.INTEGRATION_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) throw new Error("Integration encryption key is not configured");
  return createHash("sha256").update(secret).digest();
}
export function encryptSecret(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data]
    .map((part) => part.toString("base64"))
    .join(".");
}
export function decryptSecret(value) {
  const [iv, tag, data] = value
    .split(".")
    .map((part) => Buffer.from(part, "base64"));
  const cipher = createDecipheriv("aes-256-gcm", key(), iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString("utf8");
}
export async function getIntegration(db, provider) {
  const definition = integrationProviders[provider];
  if (!definition)
    throw Object.assign(new Error("Unknown integration."), { status: 400 });
  const setting = await db.integrationSetting.findUnique({
    where: { provider },
  });
  return {
    provider,
    enabled: setting?.enabled !== false,
    secret: setting?.secretCiphertext
      ? decryptSecret(setting.secretCiphertext)
      : process.env[definition.env],
    model:
      setting?.model || process.env[definition.modelEnv] || definition.model,
    senderEmail: setting?.senderEmail || process.env.EMAIL_FROM,
  };
}
export async function providerRequest(url, options, timeout = 90000) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeout),
    });
  } catch {
    throw Object.assign(
      new Error("The provider could not be reached. Please retry."),
      {
        status: 502,
      },
    );
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw Object.assign(
      new Error(
        `Provider request failed (${response.status}). Check the API key, model access, and provider quota.`,
      ),
      { status: 502 },
    );
  return body;
}

export async function deliverEmail(db, message) {
  const integration = await getIntegration(db, "resend");
  if (!integration.enabled || !integration.secret || !integration.senderEmail)
    throw Object.assign(
      new Error(
        "Configure Resend and a verified sender address in API integrations before sending email.",
      ),
      { status: 503 },
    );
  const result = await providerRequest(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${integration.secret}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `casefy-message-${message.id}`,
      },
      body: JSON.stringify({
        from: integration.senderEmail,
        to: [message.toEmail],
        subject: message.subject,
        text: message.body,
      }),
    },
    15000,
  );
  return result.id;
}
