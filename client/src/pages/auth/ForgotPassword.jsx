import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "@/store/authStore";
import { OTP_MODE, AUTH_ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { KeyRound, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, loading, error } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const res = await forgotPassword(data.email);

    if (res.success) {
      navigate(`${AUTH_ROUTES.VERIFY_OTP}?requestId=${res.requestId}&type=${OTP_MODE.RESET}`);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 mb-4">
          <KeyRound size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Forgot password?</h1>
        <p className="text-slate-500">
          Enter your email address and we'll send you a code to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            {...register("email", {
              required: "Email is required",
            })}
          />
          {errors.email && (
            <p className="text-red-500 text-xs font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <Button type="submit" className="w-full" isLoading={loading}>
            {loading ? "Sending code..." : "Send reset code"}
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

export default ForgotPassword;