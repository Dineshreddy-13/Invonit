import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

export default function PartyTable({
  parties,
  onEdit,
  onDelete,
}) {
  const getPartyTypeLabel = (type) => {
    const labels = {
      customer: "Customer",
      supplier: "Supplier",
      both: "Both",
    };
    return labels[type] || type;
  };

  const getPartyTypeColor = (type) => {
    const colors = {
      customer: "bg-blue-100 text-blue-800",
      supplier: "bg-purple-100 text-purple-800",
      both: "bg-indigo-100 text-indigo-800",
    };
    return colors[type] || "bg-slate-100 text-slate-800";
  };

  if (parties.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Type
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                GSTIN
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {parties.map((party) => (
              <tr
                key={party.id}
                className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-900">{party.name}</p>
                    {party.city && (
                      <p className="text-xs text-slate-500">
                        {party.city}
                        {party.state && `, ${party.state}`}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "inline-block px-3 py-1 rounded-full text-xs font-semibold",
                      getPartyTypeColor(party.partyType)
                    )}
                  >
                    {getPartyTypeLabel(party.partyType)}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {party.phone || "-"}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {party.email || "-"}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {party.gstin || "-"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={() => onEdit(party)}
                      variant="ghost"
                      size="sm"
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </Button>
                    <Button
                      onClick={() => onDelete(party.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination info */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-600">
          Showing {parties.length} parties
        </p>
      </div>
    </div>
  );
}
