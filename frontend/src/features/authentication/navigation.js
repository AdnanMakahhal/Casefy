export function destinationAfterAuth(role, from) {
  const staff = ["admin", "manager"].includes(role);
  const home = staff ? "/admin" : "/dashboard";
  if (!from || typeof from.pathname !== "string") return home;
  const shared = ["/profile", "/messages"];
  const customers = ["/dashboard", "/test-generator", "/reports", "/executions", "/workspaces", "/workspace-invite", "/checkout", "/checkout/success"];
  const allowed = shared.includes(from.pathname) || (staff
    ? from.pathname === "/admin"
    : customers.includes(from.pathname) || /^\/workspaces\/[a-zA-Z0-9-]+$/.test(from.pathname));
  if (!allowed) return home;
  const search = typeof from.search === "string" && from.search.startsWith("?") ? from.search : "";
  const hash = typeof from.hash === "string" && from.hash.startsWith("#") ? from.hash : "";
  return `${from.pathname}${search}${hash}`;
}
