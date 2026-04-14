import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";
import useCategoryStore from "../../store/categoryStore";
import useTaxRateStore from "../../store/taxRateStore";

const ProductForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const { categories } = useCategoryStore();
  const { taxRates } = useTaxRateStore();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      hsnCode: "",
      description: "",
      imageUrl: "",
      unit: "pcs",
      purchasePrice: 0,
      sellingPrice: 0,
      mrp: 0,
      wholesalePrice: 0,
      categoryId: "",
      taxRateId: "",
      openingStock: 0,
      lowStockThreshold: 5,
      trackInventory: true,
      allowNegativeStock: false,
    },
  });

  const trackInventory = watch("trackInventory");

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        purchasePrice: parseFloat(initialData.purchasePrice) || 0,
        sellingPrice: parseFloat(initialData.sellingPrice) || 0,
        mrp: parseFloat(initialData.mrp) || 0,
        wholesalePrice: parseFloat(initialData.wholesalePrice) || 0,
        openingStock: parseFloat(initialData.openingStock) || 0,
        lowStockThreshold: parseFloat(initialData.lowStockThreshold) || 0,
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-h-[70vh] overflow-y-auto px-1 pr-4">
      {/* 1. Basic Information */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group md:col-span-2">
            <Label htmlFor="prod-name">Product Name <span className="text-red-500">*</span></Label>
            <Input
              id="prod-name"
              placeholder="E.g., Samsung Galaxy S21"
              {...register("name", { required: "Name is required" })}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="form-group">
            <Label htmlFor="prod-sku">SKU (Stock Keeping Unit)</Label>
            <Input id="prod-sku" placeholder="E.g., SAM-S21-BLK" {...register("sku")} />
          </div>

          <div className="form-group">
            <Label htmlFor="prod-barcode">Barcode / EAN</Label>
            <Input id="prod-barcode" placeholder="Scan or enter barcode" {...register("barcode")} />
          </div>

          <div className="form-group">
            <Label htmlFor="prod-hsn">HSN Code</Label>
            <Input id="prod-hsn" placeholder="8-digit HSN" {...register("hsnCode")} />
          </div>

          <div className="form-group">
            <Label>Category</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[
                    { value: "", label: "Uncategorized" },
                    ...categories.map(c => ({ value: c.id, label: c.name }))
                  ]}
                />
              )}
            />
          </div>

          <div className="form-group">
            <Label>Unit</Label>
            <Controller
              control={control}
              name="unit"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[
                    { value: "pcs", label: "Pieces (pcs)" },
                    { value: "kg", label: "Kilograms (kg)" },
                    { value: "g", label: "Grams (g)" },
                    { value: "l", label: "Liters (l)" },
                    { value: "ml", label: "Milliliters (ml)" },
                    { value: "box", label: "Box" },
                    { value: "pack", label: "Pack" },
                  ]}
                />
              )}
            />
          </div>

          <div className="form-group md:col-span-2">
            <Label htmlFor="prod-image">Image URL</Label>
            <Input id="prod-image" placeholder="https://example.com/image.jpg" {...register("imageUrl")} />
          </div>
        </div>
      </section>

      {/* 2. Pricing & Tax */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Pricing & Tax</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="form-group">
            <Label htmlFor="prod-purchase">Purchase Price (₹)</Label>
            <Input id="prod-purchase" type="number" step="0.01" {...register("purchasePrice", { valueAsNumber: true })} />
          </div>
          <div className="form-group">
            <Label htmlFor="prod-selling">Selling Price (₹) <span className="text-red-500">*</span></Label>
            <Input id="prod-selling" type="number" step="0.01" {...register("sellingPrice", { required: true, valueAsNumber: true })} />
          </div>
          <div className="form-group">
            <Label htmlFor="prod-mrp">MRP (₹)</Label>
            <Input id="prod-mrp" type="number" step="0.01" {...register("mrp", { valueAsNumber: true })} />
          </div>
          <div className="form-group">
            <Label>GST Slab</Label>
            <Controller
              control={control}
              name="taxRateId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[
                    { value: "", label: "No Tax / Exempt" },
                    ...taxRates.map(t => ({ value: t.id, label: t.taxName }))
                  ]}
                />
              )}
            />
          </div>
        </div>
      </section>

      {/* 3. Inventory */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Stock & Inventory</h3>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="track-inv" {...register("trackInventory")} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <Label htmlFor="track-inv">Track Stock</Label>
          </div>
        </div>
        
        {trackInventory && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="form-group">
              <Label htmlFor="prod-opening">Opening Stock</Label>
              <Input
                id="prod-opening"
                type="number"
                disabled={!!initialData} // Usually not editable after creation
                {...register("openingStock", { valueAsNumber: true })}
              />
              {initialData && <p className="text-[10px] text-slate-400">Use Stock Adjustment to change current stock.</p>}
            </div>
            <div className="form-group">
              <Label htmlFor="prod-low">Low Stock Alert</Label>
              <Input id="prod-low" type="number" {...register("lowStockThreshold", { valueAsNumber: true })} />
            </div>
            <div className="form-group flex items-end pb-1">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="neg-stock" {...register("allowNegativeStock")} className="rounded text-indigo-600" />
                <Label htmlFor="neg-stock" className="text-xs">Allow Negative Stock</Label>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialData ? "Update Product" : "Save Product"}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
