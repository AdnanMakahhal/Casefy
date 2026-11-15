// Payment return URLs come from trusted deployment configuration, never request headers.
export function siteOrigin(env = process.env) {
  const hostname = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL;
  const value = env.FRONTEND_URL || (hostname ? `https://${hostname}` : "http://localhost:5173");
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid FRONTEND_URL");
  if (env.VERCEL && (url.protocol !== "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) {
    throw new Error("Vercel requires a public HTTPS FRONTEND_URL or its assigned deployment domain");
  }
  return url.origin;
}
