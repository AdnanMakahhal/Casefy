export const planLabels = { free: "Free", plus: "Plus", pro: "Pro", enterprise: "Enterprise" };
export const canAddWorkspace = (user) => ["plus", "pro", "enterprise"].includes(user?.plan);
export const planRank = { free: 0, plus: 1, pro: 2, enterprise: 3 };
export function planAction(user, target) {
  if (user?.plan === target) return "current";
  if (user && planRank[target] < (planRank[user.plan] || 0)) return "included";
  if (target === "enterprise") return "contact";
  return user && user.plan !== "free" ? "upgrade" : "start";
}
