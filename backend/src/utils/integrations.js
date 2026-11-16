import { createDecipheriv, createHash } from "node:crypto";

export const integrationProviders = {
  resend: { name: "Resend email", env: "RESEND_API_KEY" },
};

function key() {
  const secret =
    process.env.INTEGRATION_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) throw new Error("Integration encryption key is not configured");
  return createHash("sha256").update(secret).digest();
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
        `Email provider request failed (${response.status}). Check the API key, sender verification, and provider quota.`,
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
        "Resend and a verified sender address must be configured before sending email.",
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
