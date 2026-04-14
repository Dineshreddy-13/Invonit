import React from "react";
import { Plus, Trash2, Search, Package } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

const PurchaseItemTable = ({ items, products, onUpdateItems }) => {
  const addItem = () => {
    const newItem = {
      id: Date.now(),
      productId: "",
      productName: "",
      hsnCode: "",
      quantity: 1,
      unit: "pcs",
      purchasePrice: 0,
      discountPercent: 0,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      totalAmount: 0,
    };
    onUpdateItems([...items, newItem]);
  };

  const removeItem = (id) => {
    onUpdateItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        let updatedItem = { ...item, [field]: value };
        
        // If product changes, auto-fill prices and tax
        if (field === "productId") {
          const product = products.find(p => p.id === value);
          if (product) {
            updatedItem.productName = product.name;
            updatedItem.hsnCode = product.hsnCode || "";
            updatedItem.unit = product.unit || "pcs";
            updatedItem.purchasePrice = parseFloat(product.purchasePrice) || 0;
            updatedItem.cgstRate = parseFloat(product.cgstRate) || 0;
            updatedItem.sgstRate = parseFloat(product.sgstRate) || 0;
            updatedItem.igstRate = parseFloat(product.igstRate) || 0;
          }
        }

        // Re-calculate row total
        const qty = parseFloat(updatedItem.quantity) || 0;
        const price = parseFloat(updatedItem.purchasePrice) || 0;
        const disc = parseFloat(updatedItem.discountPercent) || 0;
        
        const taxable = (qty * price) * (1 - disc / 100);
        const taxRate = parseFloat(updatedItem.cgstRate) + parseFloat(updatedItem.sgstRate) + parseFloat(updatedItem.igstRate);
        const total = taxable * (1 + taxRate / 100);
        
        updatedItem.totalAmount = total.toFixed(2);
        return updatedItem;
      }
      return item;
    });
    onUpdateItems(updatedItems);
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden mt-6">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="p-3 text-[10px] font-bold text-slate-500 uppercase w-10 text-center">#</th>
            <th className="p-3 text-[10px] font-bold text-slate-500 uppercase min-w-[200px]">Product / Item</th>
            <th className="p-3 text-[10px] font-bold text-slate-500 uppercase w-24">Qty</th>
            <th className="p-3 text-[10px] font-bold text-slate-500 uppercase w-32">Price (Buy)</th>
            <th className="p-3 text-[10px] font-bold text-slate-500 uppercase w-20">Disc %</th>
            <th className="p-3 text-[10px] font-bold text-slate-500 uppercase w-24">GST %</th>
            <th className="p-3 text-[10px] font-bold text-slate-500 uppercase text-right w-32">Amount</th>
            <th className="p-3 text-[10px] font-bold text-slate-500 uppercase w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, index) => (
            <tr key={item.id} className="hover:bg-slate-50/50">
              <td className="p-3 text-xs text-slate-400 text-center">{index + 1}</td>
              <td className="p-3">
                <Select
                  value={item.productId}
                  onValueChange={(val) => updateItem(item.id, "productId", val)}
                  options={[
                    { value: "", label: "Select Product..." },
                    ...products.map(p => ({ value: p.id, label: p.name }))
                  ]}
                />
              </td>
              <td className="p-3">
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                  className="font-medium"
                />
              </td>
              <td className="p-3">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">₹</span>
                  <Input
                    type="number"
                    value={item.purchasePrice}
                    onChange={(e) => updateItem(item.id, "purchasePrice", e.target.value)}
                    className="pl-5 font-bold text-slate-700"
                  />
                </div>
              </td>
              <td className="p-3">
                <Input
                  type="number"
                  value={item.discountPercent}
                  onChange={(e) => updateItem(item.id, "discountPercent", e.target.value)}
                />
              </td>
              <td className="p-3">
                <div className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded text-center">
                  {(parseFloat(item.cgstRate || 0) + parseFloat(item.sgstRate || 0) + parseFloat(item.igstRate || 0))}%
                </div>
              </td>
              <td className="p-3 text-right">
                <div className="text-sm font-black text-slate-900">₹{item.totalAmount}</div>
              </td>
              <td className="p-3">
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={8} className="p-10 text-center text-slate-400 italic">
                <Package size={24} className="mx-auto mb-2 opacity-20" />
                No items added. Click the button below to add products.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
        <Button
          variant="ghost"
          onClick={addItem}
          className="text-indigo-600 hover:bg-indigo-50 border border-indigo-100 border-dashed w-full flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add Item Line
        </Button>
      </div>
    </div>
  );
};

export default PurchaseItemTable;
