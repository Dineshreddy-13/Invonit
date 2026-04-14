import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function PublicRoute() {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) return <div>Loading...</div>;

  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Outlet />
  );
}