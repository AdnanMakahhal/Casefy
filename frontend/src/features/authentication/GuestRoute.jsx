import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./authContext";
import { destinationAfterAuth } from "./navigation";
import AuthSkeleton from "../../ui/AuthSkeleton";

function GuestRoute() {
  const { user, isLoading } = useAuth();
  const { pathname, state } = useLocation();

  if (isLoading)
    return <AuthSkeleton signup={pathname === "/signup"} />;
  if (user) return <Navigate to={destinationAfterAuth(user.role, state?.from)} replace />;

  return (
    <Suspense fallback={<AuthSkeleton signup={pathname === "/signup"} />}>
      <Outlet />
    </Suspense>
  );
}

export default GuestRoute;
