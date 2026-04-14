import { create } from "zustand";
import apiClient from "../api/apiClient";

const usePartiesStore = create((set, get) => ({
  parties: [],
  selectedParty: null,
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,

  // Fetch all parties for the current business
  fetchParties: async (businessId, filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.search) params.append("search", filters.search);
      if (filters.includeInactive) params.append("includeInactive", filters.includeInactive);

      const res = await apiClient.get(`/business/${businessId}/parties?${params}`);
      const parties = res.data.data.parties;
      set({ parties, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to fetch parties.";
      set({ loading: false, error: msg });
      return { success: false, message: msg };
    }
  },

  // Get a single party by ID
  getPartyById: async (businessId, partyId) => {
    try {
      const res = await apiClient.get(`/business/${businessId}/parties/${partyId}`);
      const party = res.data.data.party;
      set({ selectedParty: party });
      return { success: true, party };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to fetch party.";
      set({ error: msg });
      return { success: false, message: msg };
    }
  },

  // Create a new party
  createParty: async (businessId, data) => {
    set({ creating: true, error: null });
    try {
      const res = await apiClient.post(`/business/${businessId}/parties`, data);
      const party = res.data.data.party;
      set((state) => ({
        parties: [party, ...state.parties],
        creating: false,
      }));
      return { success: true, party };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create party.";
      const errors = err.response?.data?.errors || [];
      set({ creating: false, error: msg });
      return { success: false, message: msg, errors };
    }
  },

  // Update an existing party
  updateParty: async (businessId, partyId, data) => {
    set({ updating: true, error: null });
    try {
      const res = await apiClient.patch(`/business/${businessId}/parties/${partyId}`, data);
      const party = res.data.data.party;
      set((state) => ({
        parties: state.parties.map((p) => (p.id === partyId ? party : p)),
        selectedParty: party,
        updating: false,
      }));
      return { success: true, party };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update party.";
      const errors = err.response?.data?.errors || [];
      set({ updating: false, error: msg });
      return { success: false, message: msg, errors };
    }
  },

  // Delete a party
  deleteParty: async (businessId, partyId) => {
    set({ deleting: true, error: null });
    try {
      await apiClient.delete(`/business/${businessId}/parties/${partyId}`);
      set((state) => ({
        parties: state.parties.filter((p) => p.id !== partyId),
        selectedParty: null,
        deleting: false,
      }));
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete party.";
      set({ deleting: false, error: msg });
      return { success: false, message: msg };
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedParty: () => set({ selectedParty: null }),
}));

export default usePartiesStore;
