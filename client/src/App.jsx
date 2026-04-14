import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import { AUTH_ROUTES } from "./lib/constants";
import { Toaster } from "react-hot-toast";

import AuthLayout from "./layouts/AuthLayout";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import OtpVerification from "./pages/auth/VerifyOtp";
import PasswordReset from "./pages/auth/PasswordReset";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import PartyListPage from "./pages/parties/PartyListPage";
import ProductsPage from "./pages/inventory/ProductsPage";
import InventoryMastersPage from "./pages/inventory/InventoryMastersPage";
import PurchaseListPage from "./pages/purchases/PurchaseListPage";
import PurchaseFormPage from "./pages/purchases/PurchaseFormPage";
import useAuthStore from "./store/authStore";

export default function AppRoutes() {
  const token = useAuthStore((state) => state.token);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Only check auth if token exists (user is logged in)
    if (token) {
      checkAuth();
    }
  }, [token]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to={AUTH_ROUTES.DASHBOARD} replace />} />

          <Route element={<PublicRoute />}>
            <Route path="/auth" element={<AuthLayout />}>
              <Route index element={<Navigate to="signin" replace />} />

              <Route path="signin" element={<SignIn />} />
              <Route path="signup" element={<SignUp />} />
              <Route path="forgot-password" element={<ForgotPassword />} />

              <Route path="verify" element={<OtpVerification />} />

              <Route path="reset-password" element={<PasswordReset />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/parties" element={<PartyListPage />} />
              <Route path="/inventory" element={<ProductsPage />} />
              <Route path="/inventory/masters" element={<InventoryMastersPage />} />
              <Route path="/purchases" element={<PurchaseListPage />} />
              <Route path="/purchases/new" element={<PurchaseFormPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </>
  );
}