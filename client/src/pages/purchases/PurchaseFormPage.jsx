import React, { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, Save, Sparkles, Upload, 
  ChevronRight, Calendar, Hash, User, 
  CreditCard, Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import usePurchaseStore from "../../store/purchaseStore";
import usePartyStore from "../../store/partyStore";
import useInventoryStore from "../../store/inventoryStore";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import PurchaseItemTable from "../../components/purchases/PurchaseItemTable";

const PurchaseFormPage = () => {
  const navigate = useNavigate();
  const { createPurchase, processOCR, isLoading } = usePurchaseStore();
  const { parties, fetchParties } = usePartyStore();
  const { products, fetchProducts } = useInventoryStore();

  const [items, setItems] = useState([]);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      supplierId: "",
      invoiceNumber: "",
      referenceNumber: "",
      purchaseDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      paymentMode: "cash",
      paidAmount: 0,
      notes: "",
    }
  });

  const paidAmount = watch("paidAmount") || 0;

  useEffect(() => {
    fetchParties();
    fetchProducts();
  }, [fetchParties, fetchProducts]);

  const suppliers = useMemo(() => 
    parties.filter(p => ["supplier", "both"].includes(p.partyType)), 
  [parties]);

  // Calculate Totals
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.purchasePrice || 0)), 0);
    const total = items.reduce((sum, item) => sum + parseFloat(item.totalAmount || 0), 0);
    const gst = total - items.reduce((sum, item) => {
      const taxable = (parseFloat(item.quantity || 0) * parseFloat(item.purchasePrice || 0)) * (1 - (parseFloat(item.discountPercent || 0) / 100));
      return sum + taxable;
    }, 0);
    const discount = items.reduce((sum, item) => {
      const gross = parseFloat(item.quantity || 0) * parseFloat(item.purchasePrice || 0);
      return sum + (gross * (parseFloat(item.discountPercent || 0) / 100));
    }, 0);

    return {
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      gst: gst.toFixed(2),
      total: total.toFixed(2),
      balance: (total - paidAmount).toFixed(2)
    };
  }, [items, paidAmount]);

  const onBillUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsOcrProcessing(true);
    const data = await processOCR(file);
    setIsOcrProcessing(false);

    if (data) {
      setValue("invoiceNumber", data.invoiceNumber);
      setValue("purchaseDate", data.purchaseDate);
      
      // Match mock items to products if possible
      const newItems = data.items.map(item => {
        const product = products.find(p => p.name.toLowerCase().includes(item.productName.toLowerCase()));
        return {
          id: Math.random(),
          productId: product ? product.id : "",
          productName: item.productName,
          hsnCode: product ? product.hsnCode : "",
          quantity: item.quantity,
          unit: product ? product.unit : "pcs",
          purchasePrice: item.purchasePrice,
          discountPercent: item.discountPercent,
          cgstRate: product ? product.cgstRate : 0,
          sgstRate: product ? product.sgstRate : 0,
          igstRate: product ? product.igstRate : 0,
          totalAmount: (item.quantity * item.purchasePrice * (1 - item.discountPercent/100)).toFixed(2)
        };
      });
      setItems(newItems);
    }
  };

  const onSubmit = async (data) => {
    if (items.length === 0) {
      return alert("Please add at least one item.");
    }

    const payload = {
      ...data,
      items: items.map(i => ({
        ...i,
        productId: i.productId === "" ? null : i.productId,
      })),
      totalAmount: totals.total,
    };

    const res = await createPurchase(payload);
    if (res) navigate("/purchases");
  };

  return (
    <div className="page-container h-full max-h-full overflow-y-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" className="p-0 h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">New Purchase</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Info Card */}
          <div className="card-container p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <Label className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  Supplier <span className="text-red-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="supplierId"
                  rules={{ required: "Supplier is required" }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      options={[
                        { value: "", label: "Search Supplier..." },
                        ...suppliers.map(s => ({ value: s.id, label: s.name }))
                      ]}
                    />
                  )}
                />
              </div>

              <div className="form-group">
                <Label className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  Purchase Date
                </Label>
                <Input type="date" {...register("purchaseDate")} />
              </div>

              <div className="form-group">
                <Label className="flex items-center gap-2">
                  <Hash size={14} className="text-slate-400" />
                  Bill / Invoice Number
                </Label>
                <Input placeholder="E.g., BILL/2024/001" {...register("invoiceNumber")} />
              </div>

              {/* OCR Scanning Area */}
              <div className="md:col-span-2">
                 <div className={`relative group border-2 border-dashed rounded-xl p-4 transition-all ${
                   isOcrProcessing ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                 }`}>
                   <input 
                     type="file" 
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                     onChange={onBillUpload}
                     accept="image/*,.pdf"
                     disabled={isOcrProcessing}
                   />
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 flex-center rounded-lg ${isOcrProcessing ? "bg-indigo-600 text-white animate-pulse" : "bg-indigo-100 text-indigo-600"}`}>
                         {isOcrProcessing ? <Sparkles size={20} /> : <Upload size={20} />}
                       </div>
                       <div>
                         <p className="text-sm font-bold text-slate-900">
                           {isOcrProcessing ? "AI Scanning bill content..." : "Quick Bill Scan"}
                         </p>
                         <p className="text-xs text-slate-500">Upload invoice to auto-fill products & pricing</p>
                       </div>
                     </div>
                     {!isOcrProcessing && (
                       <div className="text-indigo-600 bg-white px-3 py-1 rounded-full text-[10px] font-black shadow-sm border border-indigo-100 flex items-center gap-1">
                         POWERED BY AI <ChevronRight size={10} />
                       </div>
                     )}
                   </div>
                   {isOcrProcessing && (
                     <div className="mt-4 h-1 w-full bg-indigo-100 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-600 animate-[progress_1.5s_infinite]"></div>
                     </div>
                   )}
                 </div>
              </div>
            </div>
          </div>

          {/* Items Table Section */}
          <div className="card-container p-6 bg-slate-50/30">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Purchase Items</h2>
              <p className="text-[10px] font-bold text-slate-400">SELECT PRODUCTS TO ADD</p>
            </div>
            <PurchaseItemTable
               items={items}
               products={products}
               onUpdateItems={setItems}
            />
          </div>

          <div className="form-group">
            <Label>Notes / Observations</Label>
            <textarea
              {...register("notes")}
              className="w-full h-24 rounded-xl border border-slate-200 p-4 text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              placeholder="Additional details about this purchase..."
            ></textarea>
          </div>
        </div>

        {/* Right Column: Billing Summary */}
        <div className="space-y-6">
          <div className="card-container sticky top-6">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-md font-black text-slate-900 uppercase tracking-tight">Billing Summary</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm text-slate-600">
                <span>Subtotal (Gross)</span>
                <span className="font-bold">₹{totals.subtotal}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-rose-500">
                <span>Discount</span>
                <span className="font-bold">- ₹{totals.discount}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-600">
                <span>Taxable Amount</span>
                <span className="font-bold">₹{(parseFloat(totals.subtotal) - parseFloat(totals.discount)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-600">
                <span>Total GST</span>
                <span className="font-bold text-indigo-600">+ ₹{totals.gst}</span>
              </div>
              {/* Divider */}
              <div className="pt-4 border-t border-slate-100 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-black text-slate-900">TOTAL BILL</span>
                  <span className="text-2xl font-black text-indigo-600 tracking-tighter">₹{totals.total}</span>
                </div>
              </div>

              {/* Payment Section */}
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-4 bg-indigo-50/30 -mx-6 px-6 pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={16} className="text-indigo-600" />
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Payment Info</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <Label className="text-[10px]">Paid Amount</Label>
                    <Input 
                      type="number" 
                      {...register("paidAmount", { valueAsNumber: true })} 
                      className="bg-white"
                    />
                  </div>
                  <div className="form-group">
                    <Label className="text-[10px]">Payment Mode</Label>
                    <Controller
                      control={control}
                      name="paymentMode"
                      render={({ field }) => (
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                          options={[
                            { value: "cash", label: "Cash" },
                            { value: "bank", label: "Bank Transfer" },
                            { value: "upi", label: "UPI" },
                            { value: "credit", label: "Credit" },
                          ]}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-medium text-slate-500 uppercase">Balance Due</span>
                  <span className={`text-sm font-bold ${parseFloat(totals.balance) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    ₹{totals.balance}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <Button 
                   onClick={handleSubmit(onSubmit)} 
                   variant="primary" 
                   size="lg" 
                   className="w-full h-12 text-md shadow-lg shadow-indigo-100"
                   isLoading={isLoading}
                >
                  <Save size={18} className="mr-2" />
                  Save Purchase
                </Button>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 italic justify-center">
                   <Info size={10} />
                   Stock and Ledger will be updated instantly
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseFormPage;
