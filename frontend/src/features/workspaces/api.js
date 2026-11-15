import { authRequest, tokenKey } from "../authentication/api";
export const workspaceRequest = (path, options = {}) => authRequest(path, { token: sessionStorage.getItem(tokenKey), ...options });
export const workspacePath = (id, suffix = "") => `/workspaces/${encodeURIComponent(id)}${suffix}`;
