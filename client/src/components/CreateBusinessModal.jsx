import React from "react";
import { useForm } from "react-hook-form";
import useBusinessStore from "../store/businessStore";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import { AlertCircle } from "lucide-react";

const BUSINESS_TYPES = [
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "service", label: "Service" },
  { value: "other", label: "Other" },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
].map(state => ({ value: state, label: state }));

const DEFAULT_FORM = {
  name: "",
  businessType: "retail",
  phone: "",
  email: "",
  gstin: "",
  pan: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

export default function CreateBusinessModal({ open }) {
  const { creating, error, createBusiness } = useBusinessStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm({
    defaultValues: DEFAULT_FORM,
  });

  const onSubmit = async (formData) => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      return;
    }

    const payload = Object.fromEntries(
      Object.entries(formData).filter(([, v]) => v !== "")
    );

    const result = await createBusiness(payload);
    if (result.success) {
      reset();
    }
  };

  const handleSelectChange = (field) => (value) => {
    setValue(field, value);
  };

  const getFieldError = (fieldName) => {
    return errors[fieldName]?.message;
  };

  const hasErrors = Object.keys(errors).length > 0 || !!error;

  return (
    <Modal
      isOpen={open}
      onClose={() => {}} // Forced modal, no close button for initial setup
      title="Create your Business"
      description="You need to set up a business account before you can use the app."
      size="lg"
      footer={
        <Button type="submit" form="business-form" isLoading={creating || isSubmitting} className="w-full">
          Create Business
        </Button>
      }
    >
      <form id="business-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Validation errors */}
        {hasErrors && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-red-800">Please correct the following errors:</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Business Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                placeholder="Acme Pvt. Ltd."
                {...register("name", {
                  required: "Business name is required",
                  minLength: {
                    value: 2,
                    message: "Business name must be at least 2 characters",
                  },
                })}
              />
              {getFieldError("name") && (
                <p className="text-red-500 text-xs font-medium">
                  {getFieldError("name")}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="businessType">Business Type</Label>
              <Select 
                id="businessType"
                onValueChange={handleSelectChange("businessType")}
                options={BUSINESS_TYPES}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
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
                <Label htmlFor="email">Business Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@acme.com"
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

          {/* Right Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="gstin">GSTIN (Optional)</Label>
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
                <Label htmlFor="pan">PAN (Optional)</Label>
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

            <div className="space-y-1.5">
              <Label htmlFor="address">Full Address</Label>
              <Textarea
                id="address"
                placeholder="123 Main Street, Sector 5..."
                {...register("address")}
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Location Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="Mumbai"
              {...register("city")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="state">State</Label>
            <Select 
              id="state"
              onValueChange={handleSelectChange("state")}
              options={INDIAN_STATES}
              placeholder="Select state"
              align="top"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              placeholder="400001"
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
      </form>
    </Modal>
  );
}
