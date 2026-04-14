import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Search, Filter } from "lucide-react";
import usePartyStore from "../../store/partyStore";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Modal } from "../../components/ui/Modal";
import PartyForm from "../../components/parties/PartyForm";
import PartyListTable from "../../components/parties/PartyListTable";

const PartyListPage = () => {
  const {
    parties,
    isLoading,
    filters,
    setFilters,
    fetchParties,
    createParty,
    updateParty,
    deleteParty
  } = usePartyStore();

  const location = useLocation();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  // Handle ?new=true from Navbar
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("new") === "true") {
      setEditingParty(null);
      setIsModalOpen(true);
      // Clean up the URL
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate, location.pathname]);

  const handleSearch = (e) => {
    setFilters({ search: e.target.value });
  };

  const handleTypeChange = (type) => {
    setFilters({ type });
  };

  const handleCreateNew = () => {
    setEditingParty(null);
    setIsModalOpen(true);
  };

  const handleEdit = (party) => {
    setEditingParty(party);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    await deleteParty(id);
  };

  const onSubmitForm = async (data) => {
    let success = false;
    if (editingParty) {
      success = await updateParty(editingParty.id, data);
    } else {
      success = await createParty(data);
    }

    if (success) {
      setIsModalOpen(false);
    }
  };

  const tabs = [
    { value: "all", label: "All" },
    { value: "customer", label: "Customer" },
    { value: "supplier", label: "Supplier" },
  ];

  return (
    <div className="page-container h-full max-h-full">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mt-2">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTypeChange(tab.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                (filters.type || "all") === tab.value
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <Input
              type="text"
              placeholder="Search parties..."
              value={filters.search}
              onChange={handleSearch}
              className="pl-9"
            />
          </div>
          <Button onClick={handleCreateNew} className="flex items-center gap-2 whitespace-nowrap">
            <Plus size={16} />
            <span className="hidden sm:inline">Add Party</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <div className="card-container flex-1">
        <PartyListTable
          parties={parties}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Modal for Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingParty ? "Edit Party" : "Add New Party"}
        description="Fill in the details for the customer or supplier."
        size="lg"
      >
        <PartyForm
          initialData={editingParty}
          onSubmit={onSubmitForm}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isLoading}
        />
      </Modal>
    </div>
  );
};

export default PartyListPage;
