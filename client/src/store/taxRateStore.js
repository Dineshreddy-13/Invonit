import { create } from "zustand";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

const useTaxRateStore = create((set, get) => ({
  taxRates: [],
  isLoading: false,
  error: null,

  fetchTaxRates: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.get("/tax-rates");
      set({ taxRates: res.data.data.taxRates });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
      toast.error("Failed to fetch tax rates");
    } finally {
      set({ isLoading: false });
    }
  },

  seedTaxRates: async () => {
    try {
      set({ isLoading: true });
      const res = await apiClient.post("/tax-rates/seed");
      toast.success(res.data.message || "Default GST rates seeded");
      await get().fetchTaxRates();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to seed tax rates");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  createTaxRate: async (data) => {
    try {
      set({ isLoading: true });
      const res = await apiClient.post("/tax-rates", data);
      toast.success(res.data.message || "Tax rate created");
      await get().fetchTaxRates();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create tax rate");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTaxRate: async (id) => {
    try {
      set({ isLoading: true });
      const res = await apiClient.delete(`/tax-rates/${id}`);
      toast.success(res.data.message || "Tax rate deleted");
      await get().fetchTaxRates();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete tax rate");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useTaxRateStore;
