import { create } from "zustand";
import apiClient from "../api/apiClient";

const useBusinessStore = create((set, get) => ({
  business: null,
  hasBusiness: null, // null = unknown (loading), false = no business, true = has business
  loading: false,
  creating: false,
  error: null,

  // Fetch the user's businesses — sets hasBusiness accordingly
  fetchBusiness: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.get("/business");
      const business = res.data.data.business;

      if (business) {
        set({ business, hasBusiness: true, loading: false });
      } else {
        set({ business: null, hasBusiness: false, loading: false });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to fetch business.";
      set({ loading: false, hasBusiness: false, error: msg });
    }
  },

  // Create a new business
  createBusiness: async (data) => {
    set({ creating: true, error: null });
    try {
      const res = await apiClient.post("/business", data);
      const business = res.data.data.business;
      set({ business, hasBusiness: true, creating: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create business.";
      const errors = err.response?.data?.errors || [];
      set({ creating: false, error: msg });
      return { success: false, message: msg, errors };
    }
  },

  clearError: () => set({ error: null }),
}));

export default useBusinessStore;
