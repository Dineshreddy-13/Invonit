import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiClient from "../api/apiClient";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      requestId: null,
      resetToken: null,


      sendOTP: async (data) => {
        set({ loading: true, error: null });
        try {
          const res = await apiClient.post("/auth/register", data);

          const { requestId } = res.data.data;

          set({
            loading: false,
            requestId,
          });

          return { success: true, requestId };
        } catch (err) {
          const msg =
            err.response?.data?.message || "Something went wrong.";
          set({ loading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      verifyOTP: async (otp) => {
        set({ loading: true, error: null });

        try {
          const { requestId } = get();

          const res = await apiClient.post("/auth/register/verify", {
            requestId,
            otp,
          });

          const { user, token } = res.data.data;

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            requestId: null, // clear after success
          });

          return { success: true };
        } catch (err) {
          const msg =
            err.response?.data?.message || "Invalid OTP.";
          set({ loading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      resendOTP: async (requestId) => {
        try {
          // Use provided requestId or get from store
          const id = requestId || get().requestId;
          
          if (!id) {
            return { success: false, message: "Request ID not found. Please start over." };
          }

          const res = await apiClient.post("/auth/register/resend-otp", {
            requestId: id,
          });

          const { requestId: updatedRequestId } = res.data.data;

          set({
            requestId: updatedRequestId,
          });

          return { success: true };
        } catch (err) {
          const msg =
            err.response?.data?.message || "Failed to resend OTP.";
          return { success: false, message: msg };
        }
      },

      login: async (data) => {
        set({ loading: true, error: null });

        try {
          const res = await apiClient.post("/auth/login", data);

          const { user, token } = res.data.data;

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
          });

          return { success: true };
        } catch (err) {
          const msg =
            err.response?.data?.message || "Login failed.";
          set({ loading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      forgotPassword: async (email) => {
        set({ loading: true, error: null });

        try {
          const res = await apiClient.post("/auth/forgot-password", {
            email,
          });

          const { requestId } = res.data.data;

          set({
            loading: false,
            requestId,
          });

          return { success: true, requestId };
        } catch (err) {
          const msg =
            err.response?.data?.message || "Failed.";
          set({ loading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      verifyResetOTP: async (otp) => {
        set({ loading: true, error: null });

        try {
          const { requestId } = get();

          const res = await apiClient.post(
            "/auth/forgot-password/verify",
            {
              requestId,
              otp,
            }
          );

          const { resetToken } = res.data.data;

          set({
            loading: false,
            resetToken,
            requestId, // Keep requestId for resend/reset operations
          });

          return { success: true };
        } catch (err) {
          const msg =
            err.response?.data?.message || "Invalid OTP.";
          set({ loading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      resendResetOTP: async (requestId) => {
        try {
          // Use provided requestId or get from store
          const id = requestId || get().requestId;
          
          if (!id) {
            return { success: false, message: "Request ID not found. Please start over." };
          }

          const res = await apiClient.post(
            "/auth/forgot-password/resend-otp",
            { requestId: id }
          );

          const { requestId: updatedRequestId } = res.data.data;

          set({
            requestId: updatedRequestId,
          });

          return { success: true };
        } catch (err) {
          const msg =
            err.response?.data?.message || "Failed to resend OTP.";
          return { success: false, message: msg };
        }
      },

      resetPassword: async (newPassword) => {
        set({ loading: true, error: null });

        try {
          const { requestId, resetToken } = get();

          await apiClient.post("/auth/reset-password", {
            requestId,
            resetToken,
            newPassword,
          });

          set({
            loading: false,
            requestId: null,
            resetToken: null,
          });

          return { success: true };
        } catch (err) {
          const msg =
            err.response?.data?.message || "Reset failed.";
          set({ loading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        try {
          const res = await apiClient.get("/auth/me");
          set({
            user: res.data.data.user,
            isAuthenticated: true,
          });
        } catch (error) {
          // Silently clear auth on error (expected for unauthenticated users)
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",

      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;