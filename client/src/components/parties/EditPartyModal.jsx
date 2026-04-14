import React, { useEffect } from "react";
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

export default function EditPartyModal({ isOpen, party, onClose }) {
  const { business } = useBusinessStore();
  const { updateParty, updating, error } = usePartiesStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm();

  const isActiveValue = watch("isActive");

  // Initialize form data when party changes
  useEffect(() => {
    if (party && isOpen) {
      reset({
        name: party.name || "",
        partyType: party.partyType || "",
        phone: party.phone || "",
        email: party.email || "",
        gstin: party.gstin || "",
        pan: party.pan || "",
        address: party.address || "",
        city: party.city || "",
        state: party.state || "",
        pincode: party.pincode || "",
        openingBalance: party.openingBalance
          ? String(party.openingBalance)
          : "",
        openingBalanceType: party.openingBalanceType || "Dr",
        creditLimit: party.creditLimit ? String(party.creditLimit) : "",
        creditDays: party.creditDays ? String(party.creditDays) : "",
        notes: party.notes || "",
        isActive: party.isActive !== false,
      });
    }
  }, [party, isOpen, reset]);

  const handleSelectChange = (field) => (value) => {
    setValue(field, value);
  };

  const getFieldError = (fieldName) => {
    return errors[fieldName]?.message;
  };

  const onSubmit = async (formData) => {
    if (!business?.id || !party?.id) {
      return;
    }

    if (!formData.name.trim()) {
      return;
    }

    if (!formData.partyType) {
      return;
    }

    const payload = {
      name: formData.name.trim(),
      partyType: formData.partyType,
      isActive: formData.isActive,
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

    const result = await updateParty(business.id, party.id, payload);
    if (result.success) {
      onClose();
    }
  };

  const hasErrors = Object.keys(errors).length > 0 || !!error;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Party"
      description="Update the details of the party."
      size="lg"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} disabled={updating}>
            Cancel
          </Button>
          <Button type="submit" form="edit-party-form" isLoading={updating}>
            Save Changes
          </Button>
        </div>
      }
    >
      <form id="edit-party-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                    value: /^\d{10}$/,
                    message: "Phone must be 10 digits",
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
                    message: "Please enter a valid email address",
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
              rows={3}
              {...register("address")}
            />
            {getFieldError("address") && (
              <p className="text-red-500 text-xs font-medium">
                {getFieldError("address")}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                placeholder="City"
                {...register("city")}
              />
              {getFieldError("city") && (
                <p className="text-red-500 text-xs font-medium">
                  {getFieldError("city")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                type="text"
                placeholder="State"
                {...register("state")}
              />
              {getFieldError("state") && (
                <p className="text-red-500 text-xs font-medium">
                  {getFieldError("state")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                type="text"
                placeholder="Pincode"
                {...register("pincode", {
                  pattern: {
                    value: /^\d{6}$/,
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
                type="text"
                placeholder="22AAAAA0000A1Z5"
                {...register("gstin", {
                  pattern: {
                    value: /^[A-Z0-9]{15}$/,
                    message: "GSTIN must be 15 characters",
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
                type="text"
                placeholder="AAAPL1234C"
                {...register("pan", {
                  pattern: {
                    value: /^[A-Z0-9]{10}$/,
                    message: "PAN must be 10 characters",
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
                step="0.01"
                {...register("openingBalance")}
              />
              {getFieldError("openingBalance") && (
                <p className="text-red-500 text-xs font-medium">
                  {getFieldError("openingBalance")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="openingBalanceType">Balance Type</Label>
              <Select
                id="openingBalanceType"
                onValueChange={handleSelectChange("openingBalanceType")}
                options={BALANCE_TYPES}
              />
              {getFieldError("openingBalanceType") && (
                <p className="text-red-500 text-xs font-medium">
                  {getFieldError("openingBalanceType")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="creditLimit">Credit Limit</Label>
              <Input
                id="creditLimit"
                type="number"
                placeholder="0.00"
                step="0.01"
                {...register("creditLimit")}
              />
              {getFieldError("creditLimit") && (
                <p className="text-red-500 text-xs font-medium">
                  {getFieldError("creditLimit")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="creditDays">Credit Days</Label>
              <Input
                id="creditDays"
                type="number"
                placeholder="0"
                {...register("creditDays")}
              />
              {getFieldError("creditDays") && (
                <p className="text-red-500 text-xs font-medium">
                  {getFieldError("creditDays")}
                </p>
              )}
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
              rows={3}
              {...register("notes")}
            />
            {getFieldError("notes") && (
              <p className="text-red-500 text-xs font-medium">
                {getFieldError("notes")}
              </p>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={isActiveValue}
              onChange={(e) => setValue("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <Label htmlFor="isActive" className="mb-0">
              Active Party
            </Label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
