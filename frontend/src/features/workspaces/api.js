import { sessionRequest } from "../../lib/api";
export const workspaceRequest = (path, options = {}) =>
  sessionRequest(`/auth${path}`, options);
export const workspacePath = (id, suffix = "") =>
  `/workspaces/${encodeURIComponent(id)}${suffix}`;
