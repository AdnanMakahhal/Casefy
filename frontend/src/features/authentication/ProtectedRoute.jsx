import P from "../../ui/P";
import Button from "../../ui/Button";
import { Suspense, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { homeForRole, useAuth } from "./authContext";
import { useToast } from "../../Context/toastContext";
import AdminSkeleton from "../../ui/AdminSkeleton";
import ProfileSkeleton from "../../ui/ProfileSkeleton";
import DashboardSkeleton from "../../ui/DashboardSkeleton";
import CheckoutSkeleton from "../../ui/CheckoutSkeleton";
import { adminViewFromPath } from "../admin/navigation";

function ProtectedRoute({ roles, loginNotice }) {
  const location = useLocation();
  const { user, isLoading, sessionError } = useAuth();
  const showToast = useToast();

  useEffect(() => {
    if (!isLoading && !user && loginNotice) showToast(loginNotice);
  }, [isLoading, user, loginNotice, showToast]);

  const loadingScreen = location.pathname.startsWith("/admin") ? (
    <AdminSkeleton
      fullPage
      view={adminViewFromPath(location.pathname) || "overview"}
    />
  ) : location.pathname === "/settings/profile" ||
    location.pathname === "/profile" ? (
    <ProfileSkeleton />
  ) : location.pathname.startsWith("/checkout") ? (
    <CheckoutSkeleton />
  ) : (
    <DashboardSkeleton />
  );
  if (isLoading) return loadingScreen;
  if (sessionError)
    return (
      <div className="p-8 text-center">
        <P variant="unstyled" role="alert">{sessionError}</P>
        <Button variant="unstyled"
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 cursor-pointer underline"
        >
          Try again
        </Button>
      </div>
    );

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }
  if (roles && !roles.includes(user.role))
    return <Navigate to={homeForRole(user.role)} replace />;

  return (
    <Suspense fallback={loadingScreen}>
      <Outlet />
    </Suspense>
  );
}

export default ProtectedRoute;
