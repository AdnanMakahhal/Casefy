import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./authContext";
import { authRequest, billingRequest, tokenKey } from "../../lib/api";
import { getSessionValue, setSessionValue, removeSessionValue } from "../../lib/storage";
import UndoDeletionProvider from "../../context/UndoDeletionProvider";

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getSessionValue(tokenKey));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [sessionError, setSessionError] = useState("");
  const [signupDraft, setSignupDraft] = useState(null);
  const [workspaceRevision, setWorkspaceRevision] = useState(0);
  const refreshWorkspaces = useCallback(() => setWorkspaceRevision((value) => value + 1), []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    authRequest("/me", { token })
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
          setSessionError("");
        }
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) {
          removeSessionValue(tokenKey);
          setToken(null);
          setUser(null);
        } else {
          setSessionError(error.message);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  function saveSession(session) {
    setSessionValue(tokenKey, session.token);
    setUser(session.user);
    setToken(session.token);
    setSessionError("");
    setIsLoading(false);
    setSignupDraft(null);
    return session;
  }

  async function signin(credentials) {
    return saveSession(
      await authRequest("/signin", { method: "POST", body: JSON.stringify(credentials) }),
    );
  }
  async function signup(details) {
    return saveSession(
      await authRequest("/signup", { method: "POST", body: JSON.stringify(details) }),
    );
  }
  async function updateProfile(details) {
    const updatedUser = await authRequest("/me", {
      method: "PATCH",
      token,
      body: JSON.stringify(details),
    });
    setUser(updatedUser);
    return updatedUser;
  }
  const getWorkspaceProjects = useCallback(
    (workspaceKey) =>
      authRequest(`/workspaces/${encodeURIComponent(workspaceKey)}/projects`, { token }),
    [token],
  );

  const createCheckout = useCallback(
    (plan, billing) =>
      billingRequest("/checkout", {
        token,
        method: "POST",
        body: JSON.stringify({ plan, billing }),
      }),
    [token],
  );
  const createUpgrade = useCallback(
    (plan, billing) =>
      billingRequest("/upgrade", {
        token,
        method: "POST",
        body: JSON.stringify({ plan, billing }),
      }),
    [token],
  );
  const openBillingPortal = useCallback(
    () => billingRequest("/portal", { token, method: "POST" }),
    [token],
  );
  const getCheckoutStatus = useCallback(
    async (sessionId) => {
      const result = await billingRequest(`/checkout/${encodeURIComponent(sessionId)}`, { token });
      if (result.user) setUser(result.user);
      return result;
    },
    [token],
  );
  const refreshUser = useCallback(async () => {
    const currentUser = await authRequest("/me", { token });
    setUser(currentUser);
    return currentUser;
  }, [token]);
  useEffect(() => {
    if (!user?.complimentaryPlan && !user?.paypalSubscriptionId) return;
    const now = Date.now();
    const boundary = [user.complimentaryStartsAt, user.complimentaryEndsAt, user.paypalPeriodEnd]
      .map((value) => new Date(value).getTime())
      .filter((value) => value > now)
      .sort((a, b) => a - b)[0];
    if (!boundary) return;
    const timer = setTimeout(
      () => {
        refreshUser().catch(() => {});
      },
      Math.min(boundary - now + 100, 2147483647),
    );
    return () => clearTimeout(timer);
  }, [user, refreshUser]);
  const getBillingStatus = useCallback(async () => {
    const result = await billingRequest("/status", { token });
    if (result.user) setUser(result.user);
    return result;
  }, [token]);

  async function addWorkspace(name) {
    const result = await authRequest("/workspaces", {
      method: "POST",
      token,
      body: JSON.stringify({ name }),
    });
    refreshWorkspaces();
    await refreshUser();
    return result;
  }
  async function deleteAccount(currentPassword) {
    await authRequest("/me", {
      method: "DELETE",
      token,
      body: JSON.stringify({ currentPassword }),
    });
    logout();
  }
  async function deleteWorkspace(workspace) {
    const result = await authRequest(`/workspaces/${encodeURIComponent(workspace.key)}`, {
      method: "DELETE",
      token,
      body: JSON.stringify({ name: workspace.name }),
    });
    refreshWorkspaces();
    await refreshUser();
    return result;
  }
  async function deleteProject(projectId) {
    return authRequest(`/projects/${projectId}`, { method: "DELETE", token });
  }
  function logout() {
    removeSessionValue(tokenKey);
    setToken(null);
    setUser(null);
    setSignupDraft(null);
    setSessionError("");
    setIsLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{
        workspaceRevision,
        refreshWorkspaces,
        user,
        isLoading,
        sessionError,
        signupDraft,
        setSignupDraft,
        signin,
        signup,
        updateProfile,
        deleteAccount,
        deleteWorkspace,
        deleteProject,
        addWorkspace,
        getWorkspaceProjects,
        createCheckout,
        createUpgrade,
        openBillingPortal,
        getCheckoutStatus,
        getBillingStatus,
        refreshUser,
        logout,
      }}
    >
      <UndoDeletionProvider key={user?.id || "guest"}>{children}</UndoDeletionProvider>
    </AuthContext.Provider>
  );
}
