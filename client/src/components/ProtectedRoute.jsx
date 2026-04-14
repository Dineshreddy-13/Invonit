import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";
import useBusinessStore from "../store/businessStore";
import CreateBusinessModal from "./CreateBusinessModal";

export default function ProtectedRoute() {
  const { isAuthenticated, loading: authLoading } = useAuthStore();
  const { hasBusiness, loading: bizLoading, fetchBusiness } = useBusinessStore();
  const location = useLocation();

  // Fetch business status once the user is authenticated
  useEffect(() => {
    if (isAuthenticated && hasBusiness === null) {
      fetchBusiness();
    }
  }, [isAuthenticated, hasBusiness, fetchBusiness]);

  // Still verifying auth token
  if (authLoading) return <div>Loading...</div>;

  // Not logged in → redirect to sign-in
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  // Waiting for business check
  if (bizLoading || hasBusiness === null) return <div>Loading...</div>;

  return (
    <>
      {/* Render the dashboard behind the modal so the background is visible */}
      <Outlet />

      {/* Show the forced business creation modal when no business exists */}
      <CreateBusinessModal open={!hasBusiness} />
    </>
  );
}