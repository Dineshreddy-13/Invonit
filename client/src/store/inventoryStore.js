import { create } from "zustand";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

const useInventoryStore = create((set, get) => ({
  products: [],
  stockSummary: null,
  isLoading: false,
  error: null,
  viewType: "list", // 'list' | 'grid'
  
  pagination: {
    page: 1,
    limit: 12, // Using 12 as it's divisible by 2, 3, 4 for grid
    totalPages: 1,
    totalRecords: 0,
  },
  
  filters: {
    search: "",
    categoryId: "",
    lowStock: false,
    sortBy: "createdAt",
    order: "desc",
  },

  setViewType: (type) => set({ viewType: type }),
  
  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    get().fetchProducts();
  },

  setPage: (page) => {
    set((state) => ({ pagination: { ...state.pagination, page } }));
    get().fetchProducts();
  },

  fetchProducts: async () => {
    try {
      set({ isLoading: true, error: null });
      const { filters, pagination } = get();
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        order: filters.order,
        ...(filters.search && { search: filters.search }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.lowStock && { lowStock: true }),
      };

      const res = await apiClient.get("/products", { params });
      
      set({
        products: res.data.data.products,
        pagination: {
          ...pagination,
          totalPages: res.data.data.pagination.totalPages,
          totalRecords: res.data.data.pagination.totalRecords,
        },
      });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
      toast.error("Failed to fetch products");
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStockSummary: async () => {
    try {
      const res = await apiClient.get("/products/stock-summary");
      set({ stockSummary: res.data.data.summary });
    } catch (err) {
      console.error("Failed to fetch stock summary", err);
    }
  },

  createProduct: async (productData) => {
    try {
      set({ isLoading: true });
      const res = await apiClient.post("/products", productData);
      toast.success(res.data.message || "Product created");
      await get().fetchProducts();
      await get().fetchStockSummary();
      return true;
    } catch (err) {
      if (err.response?.data?.errors?.length) {
        err.response.data.errors.forEach(e => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || "Failed to create product");
      }
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProduct: async (id, productData) => {
    try {
      set({ isLoading: true });
      const res = await apiClient.patch(`/products/${id}`, productData);
      toast.success(res.data.message || "Product updated");
      await get().fetchProducts();
      await get().fetchStockSummary();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update product");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProduct: async (id) => {
    try {
      set({ isLoading: true });
      const res = await apiClient.delete(`/products/${id}`);
      toast.success(res.data.message || "Product deleted");
      await get().fetchProducts();
      await get().fetchStockSummary();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  adjustStock: async (id, adjustmentData) => {
    try {
      set({ isLoading: true });
      const res = await apiClient.post(`/products/${id}/adjust-stock`, adjustmentData);
      toast.success(res.data.message || "Stock adjusted");
      await get().fetchProducts();
      await get().fetchStockSummary();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to adjust stock");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useInventoryStore;
