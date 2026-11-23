import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, useCallback, useMemo, useState } from "react";
import TestGenerator from "./pages/TestGenerator";
import AppLayout from "./ui/AppLayout";
import ScrollToTop from "./ui/ScrollToTop";
import Home from "./pages/Home";
import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";
import UseCases from "./pages/UseCases";
import Pricing from "./pages/Pricing";
import SupportRedirect from "./features/support-chat/SupportRedirect";
import Docs from "./pages/Docs";
import Policy from "./pages/Policy";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import PageNotFound from "./pages/PageNotFound";
import ProtectedRoute from "./features/authentication/ProtectedRoute";
import SelectRole from "./pages/SelectRole";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import StaffSupport from "./pages/StaffSupport";
import SubscriptionHistoryPage from "./pages/SubscriptionHistoryPage";
import Admin from "./features/admin/AdminPage";
import SupportFilterRedirect from "./features/admin/SupportFilterRedirect";
import Workspaces from "./pages/Workspaces";
import WorkspaceProjects from "./pages/WorkspaceProjects";
import Project from "./pages/Project";
import WorkspaceInvite from "./pages/WorkspaceInvite";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import GuestRoute from "./features/authentication/GuestRoute";
import Messages from "./pages/Messages";
import Reports from "./pages/Reports";
import Executions from "./pages/Executions";
import { useAuth } from "./features/authentication/authContext";
import { signupRoles } from "./features/authentication/roles";
import { SupportChatContext } from "./features/support-chat/context";
import SupportChat from "./components/SupportChat";

const Signin = lazy(() => import("./pages/Signin"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

function App() {
  const { user } = useAuth();
  const [supportOpen, setSupportOpen] = useState(false);
  const [requestedTopic, setRequestedTopic] = useState(null);
  const openChat = useCallback((category) => {
    setSupportOpen(true);
    if (["support", "payment", "refund", "contact", "live_chat"].includes(category)) {
      setRequestedTopic((current) => ({ category, id: (current?.id || 0) + 1 }));
    }
  }, []);
  const closeChat = useCallback(() => setSupportOpen(false), []);
  const supportChat = useMemo(
    () => ({ open: supportOpen, openChat, closeChat, requestedTopic }),
    [supportOpen, openChat, closeChat, requestedTopic],
  );
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SupportChatContext.Provider value={supportChat}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="features" element={<Features />} />
            <Route path="how-it-works" element={<HowItWorks />} />
            <Route path="use-cases" element={<UseCases />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="support" element={<SupportRedirect />} />
            <Route path="docs" element={<Docs />} />
            <Route path="policy" element={<Policy />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
            <Route element={<GuestRoute />}>
              <Route path="signup" element={<Signup />} />
              <Route path="signin" element={<Signin />} />
            </Route>
            <Route
              element={
                <ProtectedRoute
                  roles={signupRoles.map(({ value }) => value)}
                  loginNotice="Please sign in to continue to checkout."
                />
              }
            >
              <Route path="checkout" element={<Checkout />} />
              <Route path="checkout/success" element={<CheckoutSuccess />} />
            </Route>
            <Route
              path="select-role"
              element={<SelectRole key={user?.id || "signup"} />}
            />
            <Route path="*" element={<PageNotFound />} />
          </Route>
          <Route
            element={
              <ProtectedRoute
                roles={["qa_engineer", "student", "employee", "developer"]}
              />
            }
          >
            <Route path="dashboard" element={<Dashboard user={user} />} />
            <Route path="settings" element={<Settings user={user} />} />
            <Route
              path="staff-support"
              element={<StaffSupport user={user} />}
            />
            <Route
              path="settings/subscription-history"
              element={<SubscriptionHistoryPage user={user} />}
            />
            <Route
              path="test-generator"
              element={<TestGenerator user={user} />}
            />
            <Route path="reports" element={<Reports user={user} />} />
            <Route path="executions" element={<Executions user={user} />} />
            <Route
              path="settings/workspaces"
              element={<Workspaces user={user} />}
            />
            <Route
              path="workspaces"
              element={<Navigate to="/settings/workspaces" replace />}
            />
            <Route path="workspace-invite" element={<WorkspaceInvite />} />
            <Route
              path="workspaces/:workspaceKey"
              element={<WorkspaceProjects user={user} />}
            />
            <Route
              path="workspaces/:workspaceKey/projects/:projectId"
              element={<Project user={user} />}
            />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "manager"]} />}>
            <Route path="admin/refunds" element={<SupportFilterRedirect category="refund" />} />
            <Route path="admin/payments" element={<SupportFilterRedirect category="payment" />} />
            <Route path="admin/*" element={<Admin />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="settings/profile" element={<Profile user={user} />} />
            <Route
              path="profile"
              element={<Navigate to="/settings/profile" replace />}
            />
            <Route path="messages" element={<Messages user={user} />} />
          </Route>
        </Routes>
        <SupportChat />
      </SupportChatContext.Provider>
    </BrowserRouter>
  );
}

export default App;
