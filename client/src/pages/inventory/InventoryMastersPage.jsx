import React, { useEffect, useState } from "react";
import { Plus, Database, RefreshCw, Trash2, Tag, Percent } from "lucide-react";
import useCategoryStore from "../../store/categoryStore";
import useTaxRateStore from "../../store/taxRateStore";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/Modal";
import CategoryForm from "../../components/inventory/CategoryForm";

const InventoryMastersPage = () => {
  const [activeTab, setActiveTab] = useState("categories");
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const { 
    categories, 
    fetchCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory,
    isLoading: isCatLoading 
  } = useCategoryStore();

  const { 
    taxRates, 
    fetchTaxRates, 
    seedTaxRates, 
    deleteTaxRate,
    isLoading: isTaxLoading 
  } = useTaxRateStore();

  useEffect(() => {
    fetchCategories();
    fetchTaxRates();
  }, [fetchCategories, fetchTaxRates]);

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsCatModalOpen(true);
  };

  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    setIsCatModalOpen(true);
  };

  const onSubmitCategory = async (data) => {
    let success;
    if (editingCategory) {
      success = await updateCategory(editingCategory.id, data);
    } else {
      success = await createCategory(data);
    }
    if (success) setIsCatModalOpen(false);
  };

  return (
    <div className="page-container">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "categories"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Tag size={16} />
          Categories
        </button>
        <button
          onClick={() => setActiveTab("taxes")}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "taxes"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Percent size={16} />
          Tax Rates (GST)
        </button>
      </div>

      <div className="mt-2">
        {activeTab === "categories" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Product Categories</h2>
                <p className="text-sm text-slate-500">Organize your inventory into meaningful groups</p>
              </div>
              <Button onClick={handleCreateCategory} className="flex items-center gap-2">
                <Plus size={16} />
                Add Category
              </Button>
            </div>

            <div className="card-container">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-sm font-medium text-slate-600">Category Name</th>
                    <th className="p-4 text-sm font-medium text-slate-600">Parent</th>
                    <th className="p-4 text-sm font-medium text-slate-600">Description</th>
                    <th className="p-4 text-sm font-medium text-slate-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 text-sm">
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-sm font-medium text-slate-900">{cat.name}</td>
                        <td className="p-4 text-sm text-slate-500">
                          {cat.parentId ? (
                            <span className="badge badge-info whitespace-nowrap">
                              {categories.find(c => c.id === cat.parentId)?.name || "Sub-category"}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-slate-500 max-w-xs truncate">
                          {cat.description || "No description"}
                        </td>
                        <td className="p-4 text-sm flex justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditCategory(cat)}>
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => {
                              if (window.confirm("Are you sure? This will not delete products in this category.")) {
                                deleteCategory(cat.id);
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">GST Settings</h2>
                <p className="text-sm text-slate-500">Manage tax slabs for your business</p>
              </div>
              <Button 
                variant="ghost" 
                onClick={seedTaxRates}
                isLoading={isTaxLoading}
                className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50"
              >
                <RefreshCw size={16} className={isTaxLoading ? "animate-spin" : ""} />
                Restore Default GST Slabs
              </Button>
            </div>

            <div className="card-container">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-sm font-medium text-slate-600">Tax Name</th>
                    <th className="p-4 text-sm font-medium text-slate-600">Total GST (%)</th>
                    <th className="p-4 text-sm font-medium text-slate-600">CGST/SGST</th>
                    <th className="p-4 text-sm font-medium text-slate-600">IGST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {taxRates.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-slate-500">
                        <Database size={40} className="mx-auto mb-3 text-slate-200" />
                        <p className="font-medium text-slate-900">No tax rates found</p>
                        <p className="text-sm text-slate-400 mb-4">You haven't added any tax slabs yet.</p>
                        <Button onClick={seedTaxRates} isLoading={isTaxLoading}>
                          Seed Default GST Slabs
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    taxRates.map((tax) => (
                      <tr key={tax.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-sm font-semibold text-slate-900">{tax.taxName}</td>
                        <td className="p-4">
                          <span className="badge badge-success text-sm font-bold">
                            {(parseFloat(tax.cgstRate) + parseFloat(tax.sgstRate)).toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                          {tax.cgstRate}% / {tax.sgstRate}%
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                          {tax.igstRate}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Add New Category"}
        description="Categories help you organize and filter your product list."
      >
        <CategoryForm
          initialData={editingCategory}
          onSubmit={onSubmitCategory}
          onCancel={() => setIsCatModalOpen(false)}
          isLoading={isCatLoading}
        />
      </Modal>
    </div>
  );
};

export default InventoryMastersPage;
