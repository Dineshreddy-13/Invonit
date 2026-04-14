import { create } from "zustand";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

const usePartyStore = create((set, get) => ({
  parties: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    totalPages: 1,
    totalRecords: 0,
  },
  filters: {
    type: "", // '', 'Customer', 'Supplier', 'Both'
    search: "",
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().fetchParties();
  },

  setPage: (page) => {
    set((state) => ({ pagination: { ...state.pagination, page } }));
    get().fetchParties();
  },

  fetchParties: async () => {
    try {
      set({ isLoading: true, error: null });
      const { filters, pagination } = get();

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.type && filters.type !== "All" && { type: filters.type }),
      };

      const res = await apiClient.get("/parties", { params });
      
      set({
        parties: res.data.data.parties,
        pagination: {
          ...pagination,
          totalPages: res.data.data.pagination.totalPages,
          totalRecords: res.data.data.pagination.totalRecords,
        },
      });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
      toast.error(err.response?.data?.message || "Failed to fetch parties");
    } finally {
      set({ isLoading: false });
    }
  },

  createParty: async (partyData) => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.post("/parties", partyData);
      
      toast.success(res.data.message || "Party created successfully");
      await get().fetchParties(); // Refresh list
      return true; // Indicate success
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
      if (err.response?.data?.errors?.length) {
        err.response.data.errors.forEach(e => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || "Failed to create party");
      }
      return false; // Indicate failure
    } finally {
      set({ isLoading: false });
    }
  },

  updateParty: async (partyId, partyData) => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.patch(`/parties/${partyId}`, partyData);
      
      toast.success(res.data.message || "Party updated successfully");
      await get().fetchParties(); // Refresh list
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
      if (err.response?.data?.errors?.length) {
        err.response.data.errors.forEach(e => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || "Failed to update party");
      }
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteParty: async (partyId) => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiClient.delete(`/parties/${partyId}`);
      
      toast.success(res.data.message || "Party deleted successfully");
      await get().fetchParties();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
      toast.error(err.response?.data?.message || "Failed to delete party");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default usePartyStore;
