import { effectiveUser } from "./subscriptions.js";
export const canAddWorkspace = (user) =>
  ["plus", "pro", "custom"].includes(effectiveUser(user)?.plan);
