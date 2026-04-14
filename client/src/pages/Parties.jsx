import React, { useState, useEffect } from "react";
import usePartiesStore from "../store/partiesStore";
import useBusinessStore from "../store/businessStore";
import {
  CreatePartyModal,
  EditPartyModal,
  PartyTable,
  PartyFilters,
  PartyEmptyState,
  PartyDeleteConfirmation,
} from "../components/parties";

export default function Parties() {
  const { business } = useBusinessStore();
  const {
    parties,
    loading,
    fetchParties,
  } = usePartiesStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [partyTypeFilter, setPartyTypeFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch parties on component mount and when business changes
  useEffect(() => {
    if (business?.id) {
      fetchParties(business.id);
    }
  }, [business?.id, fetchParties]);

  // Filter parties based on search and type
  const filteredParties = parties.filter((party) => {
    const matchesSearch =
      party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.phone?.includes(searchTerm) ||
      party.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      partyTypeFilter === "all" || party.partyType === partyTypeFilter;

    return matchesSearch && matchesType;
  });

  const handleEditParty = (party) => {
    setSelectedParty(party);
    setShowEditModal(true);
  };

  const handleDeleteSuccess = () => {
    setSearchTerm("");
    setPartyTypeFilter("all");
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedParty(null);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <PartyFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        partyTypeFilter={partyTypeFilter}
        onTypeChange={setPartyTypeFilter}
        onAddParty={() => setShowCreateModal(true)}
      />

      {/* Content */}
      {loading || filteredParties.length === 0 ? (
        <PartyEmptyState
          isLoading={loading}
          searchTerm={searchTerm}
          partyTypeFilter={partyTypeFilter}
        />
      ) : (
        <>
          <PartyTable
            parties={filteredParties}
            onEdit={handleEditParty}
            onDelete={setDeleteConfirm}
          />

          {/* Pagination info */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-600">
              Showing {filteredParties.length} of {parties.length} parties
            </p>
          </div>
        </>
      )}

      {/* Create Party Modal */}
      <CreatePartyModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
      />

      {/* Edit Party Modal */}
      {selectedParty && (
        <EditPartyModal
          isOpen={showEditModal}
          party={selectedParty}
          onClose={handleModalClose}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <PartyDeleteConfirmation
          isOpen={!!deleteConfirm}
          party={parties.find((p) => p.id === deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
