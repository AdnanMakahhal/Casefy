import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../authentication/authContext";
import { useSupportChat } from "./context";

export default function SupportRedirect() {
  const { user, isLoading } = useAuth();
  const { openChat } = useSupportChat();
  const [params] = useSearchParams();
  const category = params.get("category");
  const staff = ["admin", "manager"].includes(user?.role);
  useEffect(() => {
    if (!isLoading && !staff) openChat(category);
  }, [category, isLoading, staff, openChat]);
  if (isLoading) return null;
  return <Navigate to={staff ? "/admin/support" : "/"} replace />;
}
