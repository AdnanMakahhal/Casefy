import "../src/config.js";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

if (!/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || ""))
  throw new Error("Local listening requires a sandbox key");
const secretOnly = process.argv.includes("--secret-only");
const events =
  "checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,customer.subscription.paused,customer.subscription.resumed,invoice.paid,invoice.payment_failed,invoice.payment_action_required,refund.created,refund.updated,refund.failed";
const args = secretOnly
  ? ["listen", "--print-secret"]
  : [
      "listen",
      "--latest",
      "--events",
      events,
      "--forward-to",
      "http://localhost:8000/api/billing/webhook",
    ];
const shim =
  process.platform === "win32"
    ? join(
        process.env.APPDATA || "",
        "npm",
        "node_modules",
        "@stripe",
        "cli",
        "bin",
        "shim.js",
      )
    : null;
const executable =
  process.env.STRIPE_CLI_PATH ||
  (shim && existsSync(shim) ? process.execPath : "stripe");
const child = spawn(
  executable,
  executable === process.execPath ? [shim, ...args] : args,
  {
    windowsHide: true,
    env: { ...process.env, STRIPE_API_KEY: process.env.STRIPE_SECRET_KEY },
  },
);
const envPath = fileURLToPath(new URL("../.env", import.meta.url));
let receivedSecret = false;

function line(text) {
  const secret = text.match(/whsec_[A-Za-z0-9]+/)?.[0];
  if (secret) {
    let env = readFileSync(envPath, "utf8");
    env = /^STRIPE_WEBHOOK_SECRET=.*$/m.test(env)
      ? env.replace(
          /^STRIPE_WEBHOOK_SECRET=.*$/m,
          `STRIPE_WEBHOOK_SECRET=${secret}`,
        )
      : `${env.trimEnd()}\nSTRIPE_WEBHOOK_SECRET=${secret}\n`;
    writeFileSync(envPath, env);
    receivedSecret = true;
    console.log(
      "Webhook signing secret saved to backend/.env (value hidden). Restart the API after first setup.",
    );
  } else if (text.trim()) console.log(text);
}
for (const stream of [child.stdout, child.stderr]) {
  let buffer = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();
    for (const value of lines) line(value);
  });
  stream.on("end", () => {
    if (buffer) line(buffer);
  });
}
child.on("error", () => {
  console.error(
    "Unable to launch Stripe CLI. Set STRIPE_CLI_PATH if it uses a custom installation path.",
  );
  process.exitCode = 1;
});
child.on("close", (code) => {
  process.exitCode = code || (secretOnly && !receivedSecret ? 1 : 0);
});
process.on("SIGINT", () => child.kill());
process.on("SIGTERM", () => child.kill());
