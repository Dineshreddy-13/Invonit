import React, { useEffect, useState } from "react";
import {
  Plus, Search, LayoutGrid, List, Filter,
  ArrowUpRight, Package, AlertTriangle, XCircle
} from "lucide-react";
import useInventoryStore from "../../store/inventoryStore";
import useCategoryStore from "../../store/categoryStore";
import useTaxRateStore from "../../store/taxRateStore";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Modal } from "../../components/ui/Modal";
import ProductForm from "../../components/inventory/ProductForm";
import InventoryList from "../../components/inventory/InventoryList";
import InventoryGrid from "../../components/inventory/InventoryGrid";
import StockAdjustmentModal from "../../components/inventory/StockAdjustmentModal";

const ProductsPage = () => {
  const {
    products,
    stockSummary,
    isLoading,
    viewType,
    setViewType,
    filters,
    setFilters,
    fetchProducts,
    fetchStockSummary,
    createProduct,
    updateProduct,
    adjustStock
  } = useInventoryStore();

  const { fetchCategories } = useCategoryStore();
  const { fetchTaxRates } = useTaxRateStore();

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchStockSummary();
    fetchCategories();
    fetchTaxRates();
  }, [fetchProducts, fetchStockSummary, fetchCategories, fetchTaxRates]);

  const handleCreateNew = () => {
    setActiveProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEdit = (product) => {
    setActiveProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAdjustStock = (product) => {
    setActiveProduct(product);
    setIsStockModalOpen(true);
  };

  const onProductSubmit = async (data) => {
    // Clean data: convert empty strings to null for UUID fields
    const payload = {
      ...data,
      categoryId: data.categoryId === "" ? null : data.categoryId,
      taxRateId: data.taxRateId === "" ? null : data.taxRateId,
    };

    let success;
    if (activeProduct) {
      success = await updateProduct(activeProduct.id, payload);
    } else {
      success = await createProduct(payload);
    }
    if (success) setIsProductModalOpen(false);
  };

  const onStockSubmit = async (data) => {
    const success = await adjustStock(activeProduct.id, data);
    if (success) setIsStockModalOpen(false);
  };

  return (
    <div className="page-container h-full max-h-full">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="stat-card-icon bg-indigo-50 text-indigo-600">
              <Package size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400">Total Items</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stockSummary?.totalProducts || 0}</div>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Active Catalog</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="stat-card-icon bg-emerald-50 text-emerald-600">
              <ArrowUpRight size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400">Value (Buy)</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">₹{stockSummary?.totalStockValue || 0}</div>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Inventory Asset</p>
        </div>

        <div className="stat-card border-amber-200 bg-amber-50/30">
          <div className="flex items-center justify-between">
            <div className="stat-card-icon bg-amber-50 text-amber-600">
              <AlertTriangle size={20} />
            </div>
            <span className="text-xs font-bold text-amber-500">Low Stock</span>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{stockSummary?.lowStockCount || 0}</div>
          <p className="text-[10px] text-amber-500 mt-1 uppercase tracking-wider">Needs Attention</p>
        </div>

        <div className="stat-card border-rose-200 bg-rose-50/30">
          <div className="flex items-center justify-between">
            <div className="stat-card-icon bg-rose-50 text-rose-600">
              <XCircle size={20} />
            </div>
            <span className="text-xs font-bold text-rose-500">Out of Stock</span>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{stockSummary?.outOfStockCount || 0}</div>
          <p className="text-[10px] text-rose-500 mt-1 uppercase tracking-wider">Critical Stop</p>
        </div>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <Input
              placeholder="Search by name, SKU or barcode..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>
          <Button
            variant={filters.lowStock ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilters({ lowStock: !filters.lowStock })}
            className="flex items-center gap-1.5"
          >
            <AlertTriangle size={14} />
            <span className="hidden sm:inline">Alerts</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
            <button
              onClick={() => setViewType("grid")}
              className={`p-1.5 rounded-md transition-all ${viewType === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewType("list")}
              className={`p-1.5 rounded-md transition-all ${viewType === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
            >
              <List size={18} />
            </button>
          </div>

          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus size={18} />
            <span>Add Item</span>
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto min-h-0">
        {viewType === "list" ? (
          <div className="card-container">
            <InventoryList
              products={products}
              isLoading={isLoading}
              onEdit={handleEdit}
              onAdjustStock={handleAdjustStock}
            />
          </div>
        ) : (
          <InventoryGrid
            products={products}
            isLoading={isLoading}
            onEdit={handleEdit}
            onAdjustStock={handleAdjustStock}
          />
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={activeProduct ? "Edit Product" : "Add New Item"}
        description="Enter the details for the inventory item."
        size="lg"
      >
        <ProductForm
          initialData={activeProduct}
          onSubmit={onProductSubmit}
          onCancel={() => setIsProductModalOpen(false)}
          isLoading={isLoading}
        />
      </Modal>

      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title="Stock Adjustment"
        description="Manually correct stock levels for inventory tracking."
      >
        <StockAdjustmentModal
          product={activeProduct}
          onSubmit={onStockSubmit}
          onCancel={() => setIsStockModalOpen(false)}
          isLoading={isLoading}
        />
      </Modal>
    </div>
  );
};

export default ProductsPage;
