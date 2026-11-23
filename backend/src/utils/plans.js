import { effectiveUser } from "./subscriptions.js";
export const canAddWorkspace = (user) =>
  ["plus", "pro", "ultra"].includes(effectiveUser(user)?.plan);
