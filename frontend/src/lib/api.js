import { getSessionValue } from "./storage";

const apiUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const baseUrl = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;
export const tokenKey = "casefy.auth-token";

export async function apiRequest(path, { token, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error("Unable to reach the server. Please try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      data.message || "Request failed. Please try again.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}

export const authRequest = (path, options) =>
  apiRequest(`/auth${path}`, options);
export const billingRequest = (path, options) =>
  apiRequest(`/billing${path}`, options);

export const sessionRequest = (path, options) =>
  apiRequest(path, { token: getSessionValue(tokenKey), ...options });
