import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { homeForRole, useAuth } from "./authContext";
import { useToast } from "../../context/toastContext";
import AdminSkeleton from "../../components/AdminSkeleton";

function ProtectedRoute({ roles, loginNotice }) {
  const location = useLocation();
  const { user, isLoading, sessionError } = useAuth();
  const showToast = useToast();

  useEffect(() => {
    if (!isLoading && !user && loginNotice) showToast(loginNotice);
  }, [isLoading, user, loginNotice, showToast]);

  if (isLoading) return location.pathname === "/admin"
    ? <AdminSkeleton fullPage view={new URLSearchParams(location.search).get("view") === "users" ? "users" : "overview"} />
    : <p role="status" className="p-8 text-center">Loading your account...</p>;
  if (sessionError) return <div className="p-8 text-center"><p role="alert">{sessionError}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 cursor-pointer underline">Try again</button></div>;

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }
  if (roles && !roles.includes(user.role)) return <Navigate to={homeForRole(user.role)} replace />;

  return <Outlet />;
}

export default ProtectedRoute;
