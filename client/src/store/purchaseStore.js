import { create } from "zustand";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

const usePurchaseStore = create((set, get) => ({
  purchases: [],
  currentPurchase: null,
  isLoading: false,
  error: null,
  
  pagination: {
    page: 1,
    limit: 15,
    totalPages: 1,
    totalRecords: 0,
  },
  
  filters: {
    search: "",
    supplierId: "",
    status: "",
    from: "",
    to: "",
  },

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    get().fetchPurchases();
  },

  fetchPurchases: async () => {
    try {
      set({ isLoading: true, error: null });
      const { filters, pagination } = get();
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      const res = await apiClient.get("/purchases", { params });
      set({
        purchases: res.data.data.purchases,
        pagination: {
          ...pagination,
          totalPages: res.data.data.pagination.totalPages,
          totalRecords: res.data.data.pagination.totalRecords,
        },
      });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
      toast.error("Failed to fetch purchases");
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPurchaseById: async (id) => {
    try {
      set({ isLoading: true });
      const res = await apiClient.get(`/purchases/${id}`);
      set({ currentPurchase: res.data.data });
      return res.data.data;
    } catch (err) {
      toast.error("Failed to load purchase details");
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  createPurchase: async (purchaseData) => {
    try {
      set({ isLoading: true });
      const res = await apiClient.post("/purchases", purchaseData);
      toast.success(res.data.message || "Purchase recorded successfully");
      return res.data.data;
    } catch (err) {
      if (err.response?.data?.isDuplicate) {
        // Special case for duplicate invoice number
        throw err; 
      }
      toast.error(err.response?.data?.message || "Failed to save purchase");
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // Mock OCR logic for now
  processOCR: async (file) => {
    try {
      set({ isLoading: true });
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data based on typical invoice
      const mockData = {
        invoiceNumber: "INV-" + Math.floor(Math.random() * 10000),
        purchaseDate: new Date().toISOString().split('T')[0],
        items: [
          { productName: "Sample Product A", quantity: 10, purchasePrice: 150, discountPercent: 5 },
          { productName: "Sample Product B", quantity: 5, purchasePrice: 420.50, discountPercent: 0 }
        ]
      };
      
      toast.success("Bill scanned successfully (Mock Mode)");
      return mockData;
    } catch (err) {
      toast.error("Failed to process bill image");
      return null;
    } finally {
      set({ isLoading: false });
    }
  }
}));

export default usePurchaseStore;
