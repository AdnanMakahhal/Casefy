import { Navigate, useLocation } from "react-router-dom";

export default function SupportFilterRedirect({ category }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.delete("view");
  params.set("category", category);
  return <Navigate to={`/admin/support?${params}`} replace />;
}
