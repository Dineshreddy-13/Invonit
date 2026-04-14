import React from "react";

export default function PartyEmptyState({
  isLoading,
  searchTerm,
  partyTypeFilter,
}) {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 flex items-center justify-center" style={{ minHeight: "400px" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading parties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center" style={{ minHeight: "400px" }}>
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900">
        {searchTerm || partyTypeFilter !== "all"
          ? "No parties found"
          : "No parties yet"}
      </h3>
      <p className="text-slate-500 max-w-xs mx-auto mt-2">
        {searchTerm || partyTypeFilter !== "all"
          ? "Try adjusting your search or filters."
          : "Start by adding your first customer or supplier."}
      </p>
    </div>
  );
}
