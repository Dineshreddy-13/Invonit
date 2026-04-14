import React from "react";
import { Edit2, Plus, Minus, MoreVertical, Package } from "lucide-react";
import { Button } from "../ui/button";

const InventoryList = ({ products, onEdit, onAdjustStock, isLoading }) => {
  if (isLoading && products.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading inventory...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-12 text-center">
        <Package size={48} className="mx-auto text-slate-200 mb-4" />
        <h3 className="text-lg font-medium text-slate-900">No products found</h3>
        <p className="text-slate-500">Your inventory is empty or no products match your filters.</p>
      </div>
    );
  }

  const getStockStatus = (product) => {
    if (!product.trackInventory) return { label: "Service", class: "badge-info" };
    
    const stock = parseFloat(product.currentStock);
    const threshold = parseFloat(product.lowStockThreshold);
    
    if (stock <= 0) return { label: "Out of Stock", class: "badge-danger" };
    if (stock <= threshold) return { label: "Low Stock", class: "badge-warning" };
    return { label: `In Stock (${stock})`, class: "badge-success" };
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Product</th>
            <th className="p-4 text-xs font-semibold text-slate-500 uppercase">SKU / HSN</th>
            <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
            <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Selling Price</th>
            <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Stock Status</th>
            <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => {
            const status = getStockStatus(product);
            return (
              <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex-center border border-slate-200 overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={18} className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{product.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase">{product.barcode || "No Barcode"}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-xs font-medium text-slate-600">{product.sku || "—"}</div>
                  <div className="text-[10px] text-slate-400">{product.hsnCode ? `HSN: ${product.hsnCode}` : ""}</div>
                </td>
                <td className="p-4">
                  <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                    {product.categoryName || "Uncategorized"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="text-sm font-bold text-slate-900">₹{parseFloat(product.sellingPrice).toFixed(2)}</div>
                  {product.mrp && <div className="text-[10px] text-slate-400 line-through">MRP: ₹{product.mrp}</div>}
                </td>
                <td className="p-4">
                  <span className={`badge ${status.class}`}>
                    {status.label}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => onAdjustStock(product)} title="Adjust Stock">
                      <RefreshCw size={14} className="text-indigo-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(product)} title="Edit">
                      <Edit2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Simple RefreshCw mock since I can't check lucide exports
const RefreshCw = ({ size, className }) => (
  <svg 
    width={size} height={size} viewBox="0 0 24 24" fill="none" 
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
    strokeLinejoin="round" className={className}
  >
    <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
  </svg>
);

export default InventoryList;
