import React from "react";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import usePartiesStore from "../../store/partiesStore";
import useBusinessStore from "../../store/businessStore";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";

const PARTY_TYPES = [
  { value: "customer", label: "Customer" },
  { value: "supplier", label: "Supplier" },
  { value: "both", label: "Both" },
];

const BALANCE_TYPES = [
  { value: "Dr", label: "Debit (Dr)" },
  { value: "Cr", label: "Credit (Cr)" },
];

const defaultValues = {
  name: "",
  partyType: "customer",
  phone: "",
  email: "",
  gstin: "",
  pan: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  openingBalance: "",
  openingBalanceType: "Dr",
  creditLimit: "",
  creditDays: "",
  notes: "",
};

export default function CreatePartyModal({ isOpen, onClose }) {
  const { business } = useBusinessStore();
  const { createParty, creating, error } = usePartiesStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({ defaultValues });

  const handleSelectChange = (field) => (value) => {
    setValue(field, value);
  };

  const getFieldError = (fieldName) => {
    return errors[fieldName]?.message;
  };

  const onSubmit = async (formData) => {
    if (!business?.id) {
      return;
    }

    // Prepare data
    const payload = {
      name: formData.name.trim(),
      partyType: formData.partyType,
    };

    if (formData.phone) payload.phone = formData.phone.trim();
    if (formData.email) payload.email = formData.email.trim();
    if (formData.gstin) payload.gstin = formData.gstin.trim();
    if (formData.pan) payload.pan = formData.pan.trim();
    if (formData.address) payload.address = formData.address.trim();
    if (formData.city) payload.city = formData.city.trim();
    if (formData.state) payload.state = formData.state.trim();
    if (formData.pincode) payload.pincode = formData.pincode.trim();
    if (formData.openingBalance)
      payload.openingBalance = parseFloat(formData.openingBalance);
    if (formData.openingBalanceType)
      payload.openingBalanceType = formData.openingBalanceType;
    if (formData.creditLimit)
      payload.creditLimit = parseFloat(formData.creditLimit);
    if (formData.creditDays)
      payload.creditDays = parseInt(formData.creditDays);
    if (formData.notes) payload.notes = formData.notes.trim();

    const result = await createParty(business.id, payload);
    if (result.success) {
      reset();
      onClose();
    }
  };

  const hasErrors = Object.keys(errors).length > 0 || !!error;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Party"
      description="Enter the details to create a new party (customer or supplier)."
      size="lg"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button type="submit" form="create-party-form" isLoading={creating}>
            Create Party
          </Button>
        </div>
      }
    >
      <form id="create-party-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Messages */}
        {hasErrors && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-red-800">
                  Please correct the following errors:
                </p>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-0.5">
                  {Object.values(errors).map((err, i) => (
                    <li key={i}>{err.message || "Invalid field"}</li>
                  ))}
                  {error && Object.keys(errors).length === 0 && <li>{error}</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Party Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., ABC Industries"
                {...register("name", {
                  required: "Party name is required",
                })}
              />
              {getFieldError("name") && (
                <p className="text-red-500 text-xs font-medium">
                  {getFieldError("name")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="partyType">
                Party Type <span className="text-red-500">*</span>
              </Label>
              <Select
                id="partyType"
                onValueChange={handleSelectChange("partyType")}
                options={PARTY_TYPES}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                {...register("phone", {
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Enter a valid 10-digit phone number",
                  },
                })}
              />
              {getFieldError("phone") && (
                <p className="text-red-500 text-xs font-medium">
                  {getFieldError("phone")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@company.com"
                {...register("email", {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
              {getFieldError("email") && (
                <p className="text-red-500 text-xs font-medium">
                  {getFieldError("email")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Address Information
          </h3>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Street address"
              {...register("address")}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="City"
                {...register("city")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="State"
                {...register("state")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                placeholder="Pincode"
                {...register("pincode", {
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: "Pincode must be 6 digits",
                  },
                })}
              />
              {getFieldError("pincode") && (
                <p className="text-red-500 text-xs font-medium">
                  {getFieldError("pincode")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tax Information */}
        <div className="space-y-4 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Tax Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                placeholder="22AAAAA0000A1Z5"
                {...register("gstin", {
                  pattern: {
                    value: /^[0-9A-Z]{15}$/,
                    message: "GSTIN must be 15 alphanumeric characters",
                  },
                })}
              />
              {getFieldError("gstin") && (
                <p className="text-red-500 text-xs font-medium">
                  {getFieldError("gstin")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pan">PAN</Label>
              <Input
                id="pan"
                placeholder="AAAPL1234C"
                {...register("pan", {
                  pattern: {
                    value: /^[A-Z0-9]{10}$/,
                    message: "PAN must be 10 alphanumeric characters",
                  },
                })}
              />
              {getFieldError("pan") && (
                <p className="text-red-500 text-xs font-medium">
                  {getFieldError("pan")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="space-y-4 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Financial Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="openingBalance">Opening Balance</Label>
              <Input
                id="openingBalance"
                type="number"
                placeholder="0.00"
                {...register("openingBalance")}
                step="0.01"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="openingBalanceType">Balance Type</Label>
              <Select
                id="openingBalanceType"
                onValueChange={handleSelectChange("openingBalanceType")}
                options={BALANCE_TYPES}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="creditLimit">Credit Limit</Label>
              <Input
                id="creditLimit"
                type="number"
                placeholder="0.00"
                {...register("creditLimit")}
                step="0.01"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="creditDays">Credit Days</Label>
              <Input
                id="creditDays"
                type="number"
                placeholder="0"
                {...register("creditDays")}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4 border-t border-slate-200 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this party..."
              {...register("notes")}
              rows={3}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
