import { effectiveUser } from "./subscriptions.js";
export const canAddWorkspace = (user) =>
  ["plus", "pro", "enterprise"].includes(effectiveUser(user)?.plan);
