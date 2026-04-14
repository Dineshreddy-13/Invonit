import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import useAuthStore from "@/store/authStore";
import { AUTH_ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ShieldAlert, ArrowLeft } from "lucide-react";

const PasswordReset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestId = searchParams.get("requestId");

  const { resetPassword, loading, error } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const res = await resetPassword(data.password);

    if (res.success) {
      navigate(AUTH_ROUTES.SIGNIN);
    }
  };

  if (!requestId) {
    navigate(AUTH_ROUTES.FORGOT_PASSWORD);
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 mb-4">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Reset password</h1>
        <p className="text-slate-500">
          Almost there! Set a new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password", {
                required: "Password required",
                minLength: {
                  value: 6,
                  message: "Minimum 6 characters",
                },
              })}
            />
            {errors.password && (
              <p className="text-red-500 text-xs font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword", {
                required: "Confirm your password",
              })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Button type="submit" className="w-full" isLoading={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </Button>

          <Link
            to={AUTH_ROUTES.SIGNIN}
            className="flex items-center justify-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to sign in
          </Link>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 animate-in fade-in duration-200">
            <p className="text-red-600 text-sm text-center font-medium">
              {error}
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default PasswordReset;