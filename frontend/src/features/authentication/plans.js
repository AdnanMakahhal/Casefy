export const planLabels = {
  free: "Free",
  plus: "Plus",
  pro: "Pro",
  custom: "Custom",
};

export const canAddWorkspace = (user) =>
  ["plus", "pro", "custom"].includes(user?.plan);

export const planRank = { free: 0, plus: 1, pro: 2, custom: 3 };

export function planAction(user, target) {
  if (user?.plan === target) return "current";
  if (user && planRank[target] < (planRank[user.plan] || 0)) return "included";
  if (target === "custom") return "contact";
  return user && user.plan !== "free" ? "upgrade" : "start";
}
