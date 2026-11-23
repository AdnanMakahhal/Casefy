export const planLabels = {
  free: "Free",
  plus: "Plus",
  pro: "Pro",
  ultra: "Ultra",
};

export const canAddWorkspace = (user) =>
  ["plus", "pro", "ultra"].includes(user?.plan);

export const planRank = { free: 0, plus: 1, pro: 2, ultra: 3 };

export function planAction(user, target) {
  if (user?.plan === target) return "current";
  if (user && planRank[target] < (planRank[user.plan] || 0)) return "included";
  return user && user.plan !== "free" ? "upgrade" : "start";
}
