import React from "react";
import { Plus } from "lucide-react";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";

export default function PartyFilters({
  searchTerm,
  onSearchChange,
  partyTypeFilter,
  onTypeChange,
  onAddParty,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <Input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Select
          value={partyTypeFilter}
          onValueChange={onTypeChange}
          options={[
            { value: "all", label: "All Types" },
            { value: "customer", label: "Customer" },
            { value: "supplier", label: "Supplier" },
            { value: "both", label: "Both" },
          ]}
          placeholder="Filter by type"
        />
        <Button onClick={onAddParty} className="gap-2 w-full md:w-auto">
          <Plus size={18} />
          Add Party
        </Button>
      </div>
    </div>
  );
}
