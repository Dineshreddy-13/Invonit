import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";

const PartyForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      partyType: "customer",
      phone: "",
      email: "",
      gstin: "",
      pan: "",
      pincode: "",
      address: "",
      openingBalance: 0,
      openingBalanceType: "Dr",
      creditLimit: 0,
      creditDays: 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        openingBalance: initialData.openingBalance || 0,
        creditLimit: initialData.creditLimit || 0,
        creditDays: initialData.creditDays || 0,
      });
    } else {
      reset();
    }
  }, [initialData, reset]);

  return (
    <form id="party-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="form-group">
          <Label htmlFor="name">Party Name <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            placeholder="E.g., Rahul Enterprises"
            {...register("name", { required: "Name is required", minLength: { value: 2, message: "Min 2 characters" } })}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Type */}
        <div className="form-group">
          <Label>Party Type <span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="partyType"
            rules={{ required: "Party Type is required" }}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                options={[
                  { value: "customer", label: "Customer" },
                  { value: "supplier", label: "Supplier" },
                  { value: "both", label: "Both" },
                ]}
              />
            )}
          />
          {errors.partyType && <p className="text-xs text-red-500">{errors.partyType.message}</p>}
        </div>

        {/* Phone */}
        <div className="form-group">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            placeholder="10-digit mobile number"
            {...register("phone", {
              pattern: { value: /^[6-9]\d{9}$/, message: "Invalid mobile number" }
            })}
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        {/* Email */}
        <div className="form-group">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            {...register("email", {
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" }
            })}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* GSTIN */}
        <div className="form-group">
          <Label htmlFor="gstin">GSTIN</Label>
          <Input
            id="gstin"
            placeholder="E.g., 29ABCDE1234F1Z5"
            {...register("gstin", {
              pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: "Invalid GSTIN" }
            })}
            className={errors.gstin ? "border-red-500" : ""}
          />
          {errors.gstin && <p className="text-xs text-red-500">{errors.gstin.message}</p>}
        </div>

        {/* PAN */}
        <div className="form-group">
          <Label htmlFor="pan">PAN</Label>
          <Input
            id="pan"
            placeholder="E.g., ABCDE1234F"
            {...register("pan", {
              pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: "Invalid PAN" }
            })}
            className={errors.pan ? "border-red-500" : ""}
          />
          {errors.pan && <p className="text-xs text-red-500">{errors.pan.message}</p>}
        </div>

        {/* Address */}
        <div className="form-group md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            rows={2}
            placeholder="Full business address..."
            {...register("address")}
          />
        </div>

        {/* Pincode */}
        <div className="form-group">
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            placeholder="6-digit pincode"
            {...register("pincode", {
              pattern: { value: /^[1-9][0-9]{5}$/, message: "Invalid pincode" }
            })}
            className={errors.pincode ? "border-red-500" : ""}
          />
          {errors.pincode && <p className="text-xs text-red-500">{errors.pincode.message}</p>}
        </div>

        {/* Opening Balance Group */}
        <div className="form-group">
          <Label htmlFor="openingBalance">Opening Balance</Label>
          <div className="flex items-center gap-2">
            <Input
              id="openingBalance"
              type="number"
              step="0.01"
              min="0"
              {...register("openingBalance", { valueAsNumber: true })}
            />
            <div className="w-32">
              <Controller
                control={control}
                name="openingBalanceType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    options={[
                      { value: "Dr", label: "To Receive (Dr)" },
                      { value: "Cr", label: "To Pay (Cr)" },
                    ]}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Credit Limit */}
        <div className="form-group">
          <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
          <Input
            id="creditLimit"
            type="number"
            step="0.01"
            min="0"
            {...register("creditLimit", { valueAsNumber: true })}
          />
        </div>

        {/* Credit Days */}
        <div className="form-group">
          <Label htmlFor="creditDays">Credit Days</Label>
          <Input
            id="creditDays"
            type="number"
            min="0"
            {...register("creditDays", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialData ? "Update Party" : "Save Party"}
        </Button>
      </div>
    </form>
  );
};

export default PartyForm;
