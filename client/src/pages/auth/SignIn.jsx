import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "@/store/authStore";
import { AUTH_ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

const SignIn = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const res = await login({
      email: data.email,
      password: data.password,
    });

    if (res.success) {
      navigate(AUTH_ROUTES.DASHBOARD);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Invonit</h1>
        <p className="text-slate-500">Welcome back 👋</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* EMAIL */}
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

          {/* PASSWORD */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to={AUTH_ROUTES.FORGOT_PASSWORD}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password", {
                required: "Password is required",
              })}
            />
            {errors.password && (
              <p className="text-red-500 text-xs font-medium">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full"
            isLoading={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          {/* GLOBAL ERROR */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 animate-in fade-in duration-200">
              <p className="text-red-600 text-sm text-center font-medium">
                {error}
              </p>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-500">
            Don't have a business account?{" "}
            <Link
              to="/auth/signup"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignIn;