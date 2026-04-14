import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";
import useCategoryStore from "../../store/categoryStore";

const CategoryForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const { categories } = useCategoryStore();
  
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      parentId: "none",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description || "",
        parentId: initialData.parentId || "none",
      });
    } else {
      reset({
        name: "",
        description: "",
        parentId: "none",
      });
    }
  }, [initialData, reset]);

  // Filter out current category from parent options to avoid circular refs
  const parentOptions = [
    { value: "none", label: "None (Root)" },
    ...categories
      .filter(c => !initialData || c.id !== initialData.id)
      .map(c => ({ value: c.id, label: c.name }))
  ];

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      parentId: data.parentId === "none" ? null : data.parentId,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="form-group">
        <Label htmlFor="cat-name">Category Name <span className="text-red-500">*</span></Label>
        <Input
          id="cat-name"
          placeholder="E.g., Electronics, Groceries"
          {...register("name", { required: "Name is required" })}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="form-group">
        <Label>Parent Category</Label>
        <Controller
          control={control}
          name="parentId"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              options={parentOptions}
            />
          )}
        />
        <p className="text-xs text-slate-500">Maximum 2 levels of hierarchy recommended.</p>
      </div>

      <div className="form-group">
        <Label htmlFor="cat-desc">Description</Label>
        <Textarea
          id="cat-desc"
          placeholder="Optional description..."
          {...register("description")}
          rows={3}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialData ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm;
