import React from "react";
import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";

const StockAdjustmentModal = ({ product, onSubmit, onCancel, isLoading }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      type: "add",
      quantity: 0,
      reason: "correction",
      notes: "",
    },
  });

  const type = watch("type");
  const quantity = watch("quantity") || 0;
  const currentStock = parseFloat(product?.currentStock || 0);
  const newStock = type === "add" ? currentStock + parseFloat(quantity) : currentStock - parseFloat(quantity);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4">
        <div className="flex justify-between items-center text-sm mb-1">
          <span className="text-slate-500">Product:</span>
          <span className="font-bold text-slate-900">{product?.name}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Current Stock:</span>
          <span className="font-bold text-slate-900">{currentStock} {product?.unit}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <Label>Adjustment Type</Label>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => register("type").onChange({ target: { value: "add", name: "type" } })}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                type === "add" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
              }`}
            >
              Add (+)
            </button>
            <button
              type="button"
              onClick={() => register("type").onChange({ target: { value: "subtract", name: "type" } })}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                type === "subtract" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500"
              }`}
            >
              Subtract (-)
            </button>
          </div>
          <input type="hidden" {...register("type", { required: true })} />
        </div>

        <div className="form-group">
          <Label htmlFor="adj-qty">Quantity</Label>
          <Input
            id="adj-qty"
            type="number"
            step="0.01"
            {...register("quantity", { required: true, min: 0.01 })}
            className={errors.quantity ? "border-red-500" : ""}
          />
        </div>
      </div>

      <div className="form-group">
        <Label>Reason</Label>
        <Select
          {...register("reason")}
          options={[
            { value: "correction", label: "Stock Correction" },
            { value: "opening_stock", label: "Opening Stock" },
            { value: "damage", label: "Damaged Items" },
            { value: "loss", label: "Theft / Loss" },
            { value: "return", label: "Sales Return" },
            { value: "other", label: "Other" },
          ]}
        />
      </div>

      <div className="form-group">
        <Label htmlFor="adj-notes">Notes / Remarks</Label>
        <Textarea
          id="adj-notes"
          placeholder="Why are you adjusting this stock?"
          {...register("notes")}
          rows={2}
        />
      </div>

      <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex justify-between items-center">
        <span className="text-sm text-indigo-700 font-medium">New Calculated Stock:</span>
        <span className={`text-lg font-black ${newStock < 0 ? "text-rose-600" : "text-indigo-600"}`}>
          {newStock} {product?.unit}
        </span>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading} disabled={newStock < 0 && !product?.allowNegativeStock}>
          Confirm Adjustment
        </Button>
      </div>
      {newStock < 0 && !product?.allowNegativeStock && (
        <p className="text-[10px] text-rose-500 text-center mt-2 font-medium">
          Error: Negative stock is not allowed for this product.
        </p>
      )}
    </form>
  );
};

export default StockAdjustmentModal;
