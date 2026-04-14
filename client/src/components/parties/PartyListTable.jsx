import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";

const PartyListTable = ({ parties, onEdit, onDelete, isLoading }) => {
  if (isLoading && parties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500">
        <svg className="h-8 w-8 animate-spin text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Loading parties...</p>
      </div>
    );
  }

  if (!parties || parties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <p>No parties found.</p>
        <p className="text-sm">Click "Add Party" to create your first party.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="p-4 font-medium text-sm text-slate-600">Party Name</th>
            <th className="p-4 font-medium text-sm text-slate-600">Type</th>
            <th className="p-4 font-medium text-sm text-slate-600">Phone</th>
            <th className="p-4 font-medium text-sm text-slate-600 text-right">Balance</th>
            <th className="p-4 font-medium text-sm text-slate-600 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {parties.map((party) => (
            <tr key={party.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="p-4 text-sm font-medium text-slate-900">{party.name}</td>
              <td className="p-4 text-sm">
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                  party.partyType === "customer" ? "bg-green-100 text-green-700" :
                  party.partyType === "supplier" ? "bg-blue-100 text-blue-700" :
                  "bg-purple-100 text-purple-700"
                )}>
                  {party.partyType}
                </span>
              </td>
              <td className="p-4 text-sm text-slate-600">{party.phone || "-"}</td>
              <td className="p-4 text-sm text-right font-medium">
                <span className={party.openingBalanceType === "Dr" ? "text-green-600" : "text-red-600"}>
                  ₹ {parseFloat(party.openingBalance || 0).toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 ml-1 block">
                  ({party.openingBalanceType})
                </span>
              </td>
              <td className="p-4 text-sm flex justify-center items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(party)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded-md hover:bg-indigo-50"
                  aria-label="Edit Party"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this party?")) {
                      onDelete(party.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
                  aria-label="Delete Party"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PartyListTable;
