import { create } from "zustand";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

const useCategoryStore = create((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.get("/categories", { params });
      set({ categories: res.data.data.categories });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
      toast.error("Failed to fetch categories");
    } finally {
      set({ isLoading: false });
    }
  },

  createCategory: async (categoryData) => {
    try {
      set({ isLoading: true });
      const res = await apiClient.post("/categories", categoryData);
      toast.success(res.data.message || "Category created");
      await get().fetchCategories();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create category");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateCategory: async (id, categoryData) => {
    try {
      set({ isLoading: true });
      const res = await apiClient.patch(`/categories/${id}`, categoryData);
      toast.success(res.data.message || "Category updated");
      await get().fetchCategories();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update category");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCategory: async (id) => {
    try {
      set({ isLoading: true });
      const res = await apiClient.delete(`/categories/${id}`);
      toast.success(res.data.message || "Category deleted");
      await get().fetchCategories();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete category");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useCategoryStore;
