import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useSupportChat } from "../features/support-chat/context";

// Keep bookmarked inbox URLs working after moving customer messages into support chat.
export default function Messages({ user }) {
  const { openChat } = useSupportChat();
  const staff = ["admin", "manager"].includes(user.role);
  useEffect(() => { if (!staff) openChat(); }, [staff, openChat]);
  return <Navigate to={staff ? "/admin?view=support" : "/dashboard"} replace />;
}
