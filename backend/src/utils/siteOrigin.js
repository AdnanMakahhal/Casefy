export function siteOrigin(env = process.env) {
  const url = new URL(env.FRONTEND_URL || "http://localhost:5173");

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("Invalid FRONTEND_URL");

  if (
    env.NODE_ENV === "production" &&
    (url.protocol !== "https:" ||
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
  )
    throw new Error("Production requires a public HTTPS FRONTEND_URL");

  return url.origin;
}
