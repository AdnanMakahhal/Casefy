export const signupRoles = new Set(["qa_engineer", "student", "employee", "developer"]);
export const adminRoles = new Set(["admin", "manager"]);
export const homeForRole = (role) => (adminRoles.has(role) ? "/admin" : "/dashboard");

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  plan: true,
  blockedAt: true,
  seatLimit: true,
  projectLimit: true,
  monthlyCreditLimit: true,
  stripeCustomerId: true,
  paypalSubscriptionId: true,
  paypalPlan: true,
  paypalBilling: true,
  paypalStatus: true,
  paypalStartedAt: true,
  paypalPeriodEnd: true,
  subscriptionStatus: true,
  subscriptionStartedAt: true,
  subscriptionPeriodEnd: true,
  complimentaryPlan: true,
  complimentaryStartsAt: true,
  complimentaryEndsAt: true,
  cancelAtPeriodEnd: true,
  workspaceName: true,
  workspaceNames: true,
  avatarImage: true,
  createdAt: true,
};
