import React, { useEffect, useState } from "react";
import { Plus, Search, Filter, ShoppingCart, Eye, FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import usePurchaseStore from "../../store/purchaseStore";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

const PurchaseListPage = () => {
  const navigate = useNavigate();
  const { purchases, isLoading, filters, setFilters, fetchPurchases } = usePurchaseStore();

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "received": return "badge-success";
      case "partial":  return "badge-warning";
      case "draft":    return "badge-info";
      case "cancelled":return "badge-danger";
      default:         return "badge-info";
    }
  };

  return (
    <div className="page-container">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <Input
              placeholder="Search by Invoice #..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>
          <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
            <Filter size={14} />
            Filter
          </Button>
        </div>

        <Button onClick={() => navigate("/purchases/new")} className="flex items-center gap-2">
          <Plus size={18} />
          <span>New Purchase</span>
        </Button>
      </div>

      {/* List Table */}
      <div className="card-container">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Purchase Date</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Invoice #</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Supplier</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Total Amount</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Balance</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading purchases...</td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <ShoppingCart size={40} className="mx-auto text-slate-200 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No purchases found</h3>
                    <p className="text-slate-500">Record your first stock-in entry by clicking 'New Purchase'.</p>
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-sm text-slate-900">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(p.purchaseDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-bold text-slate-900">{p.invoiceNumber || "N/A"}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-tight">Source: {p.source}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">
                      {p.supplierName || "Walk-in Supplier"}
                    </td>
                    <td className="p-4">
                      <span className={`badge ${getStatusBadge(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right text-sm font-bold text-slate-900">
                      ₹{parseFloat(p.totalAmount).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      {parseFloat(p.balanceAmount) > 0 ? (
                        <div className="text-sm font-bold text-rose-600">₹{parseFloat(p.balanceAmount).toLocaleString()}</div>
                      ) : (
                        <div className="text-xs text-emerald-600 font-medium">Fully Paid</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/purchases/${p.id}`)}>
                          <Eye size={16} className="text-slate-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <FileText size={16} className="text-slate-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseListPage;
