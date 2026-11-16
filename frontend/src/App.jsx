import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import Dashboard from "./pages/Dashboard";
import TestGenerator from "./pages/TestGenerator";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import AppLayout from "./layouts/AppLayout";
import Home from "./pages/Home";
import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";
import UseCases from "./pages/UseCases";
import Pricing from "./pages/Pricing";
import Support from "./pages/Support";
import Docs from "./pages/Docs";
import Policy from "./pages/Policy";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import PageNotFound from "./pages/PageNotFound";
import ProtectedRoute from "./features/authentication/ProtectedRoute";
import SelectRole from "./pages/SelectRole";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Workspaces from "./pages/Workspaces";
import WorkspaceProjects from "./pages/WorkspaceProjects";
import WorkspaceInvite from "./pages/WorkspaceInvite";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import GuestRoute from "./features/authentication/GuestRoute";
import Messages from "./pages/Messages";
import Reports from "./pages/Reports";
import { useAuth } from "./features/authentication/authContext";
import { SupportChatContext } from "./features/support-chat/context";
import SupportChat from "./components/SupportChat";

function App() {
  const { user } = useAuth();
  const [supportOpen, setSupportOpen] = useState(false);
  const openChat = useCallback(() => setSupportOpen(true), []);
  const closeChat = useCallback(() => setSupportOpen(false), []);
  const supportChat = useMemo(
    () => ({ open: supportOpen, openChat, closeChat }),
    [supportOpen, openChat, closeChat],
  );
  return (
    <BrowserRouter>
      <SupportChatContext.Provider value={supportChat}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="features" element={<Features />} />
            <Route path="how-it-works" element={<HowItWorks />} />
            <Route path="use-cases" element={<UseCases />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="support" element={<Support />} />
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
                <ProtectedRoute loginNotice="Please sign in to continue to checkout." />
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
            <Route path="test-generator" element={<TestGenerator user={user} />} />
            <Route path="reports" element={<Reports user={user} />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "manager"]} />}>
            <Route path="admin" element={<Admin />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="profile" element={<Profile user={user} />} />
            <Route path="messages" element={<Messages user={user} />} />
            <Route path="workspaces" element={<Workspaces user={user} />} />
            <Route path="workspace-invite" element={<WorkspaceInvite />} />
            <Route
              path="workspaces/:workspaceKey"
              element={<WorkspaceProjects user={user} />}
            />
          </Route>
        </Routes>
        <SupportChat />
      </SupportChatContext.Provider>
    </BrowserRouter>
  );
}

export default App;
