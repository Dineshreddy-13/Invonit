import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "@/store/authStore";
import { OTP_MODE, AUTH_ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

const SignUp = () => {
  const navigate = useNavigate();
  const { sendOTP, loading } = useAuthStore();

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

    const res = await sendOTP({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
    });

    if (res.success) {
      navigate(`${AUTH_ROUTES.VERIFY_OTP}?requestId=${res.requestId}&type=${OTP_MODE.REGISTER}`);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Invonit</h1>
        <p className="text-slate-500">Welcome to Invonit. Let's get started.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* NAME */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-red-500 text-xs font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

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

          {/* PHONE */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number (optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="9876543210"
              {...register("phone", {
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "Enter valid 10-digit number",
                },
              })}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs font-medium">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* PASSWORD */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Min 6 characters",
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
              <Label htmlFor="confirmPassword">Confirm</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword", {
                  required: "Required",
                })}
              />
            </div>
          </div>
        </div>

        <div>
          <Button type="submit" className="w-full" isLoading={loading}>
            Create account
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              to={AUTH_ROUTES.SIGNIN}
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignUp;