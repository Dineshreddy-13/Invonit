import React from "react";
import { Package, MoreVertical, Edit2, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

const InventoryGrid = ({ products, onEdit, onAdjustStock, isLoading }) => {
  if (isLoading && products.length === 0) {
    return (
      <div className="product-gallery-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div key={n} className="stat-card h-80 skeleton opacity-50"></div>
        ))}
      </div>
    );
  }

  const getStockStatus = (product) => {
    if (!product.trackInventory) return { label: "Standard", class: "badge-info" };
    const stock = parseFloat(product.currentStock);
    const threshold = parseFloat(product.lowStockThreshold);
    if (stock <= 0) return { label: "Out of Stock", class: "badge-danger" };
    if (stock <= threshold) return { label: "Low Stock", class: "badge-warning" };
    return { label: `In Stock: ${stock}`, class: "badge-success" };
  };

  return (
    <div className="product-gallery-grid">
      {products.map((product) => {
        const status = getStockStatus(product);
        return (
          <div key={product.id} className="stat-card group relative">
            <div className="product-image-container flex-center">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <Package size={40} className="text-slate-200" />
              )}
              
              <div className="absolute top-2 right-2 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                <Button variant="white" size="sm" className="rounded-full w-8 h-8 p-0 border border-slate-200 shadow-sm" onClick={() => onEdit(product)}>
                  <Edit2 size={12} />
                </Button>
                <Button variant="white" size="sm" className="rounded-full w-8 h-8 p-0 border border-slate-200 shadow-sm text-indigo-600" onClick={() => onAdjustStock(product)}>
                  <RefreshCw size={12} />
                </Button>
              </div>

              <div className="absolute bottom-2 left-2">
                <span className={`badge ${status.class} bg-white/90 backdrop-blur-sm`}>
                  {status.label}
                </span>
              </div>
            </div>

            <div className="flex flex-col flex-1">
              <div className="text-xs text-slate-400 font-medium mb-1 line-clamp-1 uppercase tracking-tight">
                {product.categoryName || "General"}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                {product.name}
              </h3>
              
              <div className="mt-auto flex items-end justify-between">
                <div>
                  <div className="text-lg font-black text-indigo-600">₹{parseFloat(product.sellingPrice).toLocaleString()}</div>
                  {product.mrp && <div className="text-[10px] text-slate-400 line-through">MRP: ₹{product.mrp}</div>}
                </div>
                {product.barcode && (
                  <div className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1 border rounded">
                    {product.barcode}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InventoryGrid;
