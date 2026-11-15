import { Navigate, Outlet } from "react-router-dom";
import { homeForRole, useAuth } from "./authContext";

function GuestRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <p role="status" className="p-8 text-center">Loading your account...</p>;
  if (user) return <Navigate to={homeForRole(user.role)} replace />;

  return <Outlet />;
}

export default GuestRoute;
