import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import useAuthStore from "@/store/authStore";
import { OTP_MODE, AUTH_ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { OtpInput } from "@/components/ui/OtpInput";
import { RefreshCcw, ShieldCheck } from "lucide-react";

const OtpVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const requestId = searchParams.get("requestId");
  const type = searchParams.get("type"); // register | reset

  const {
    verifyOTP,
    verifyResetOTP,
    resendOTP,
    resendResetOTP,
    loading,
  } = useAuthStore();

  const { handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { otp: "" },
  });

  const otp = watch("otp");

  if (!requestId || !type) {
    navigate(AUTH_ROUTES.SIGNIN);
    return null;
  }

  const onSubmit = async () => {
    let res;

    if (type === OTP_MODE.REGISTER) {
      res = await verifyOTP(otp);
      if (res.success) {
        navigate(AUTH_ROUTES.DASHBOARD);
      }
    } else if (type === OTP_MODE.RESET) {
      res = await verifyResetOTP(otp);
      if (res.success) {
        navigate(`${AUTH_ROUTES.RESET_PASSWORD}?requestId=${requestId}`);
      }
    }
  };

  const handleResend = async () => {
    if (type === OTP_MODE.REGISTER) {
      await resendOTP(requestId);
    } else if (type === OTP_MODE.RESET) {
      await resendResetOTP(requestId);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 mb-4">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Verify your email</h1>
        <p className="text-slate-500">
          We've sent a 6-digit verification code to your email address.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-center block text-slate-600">Verification Code</Label>
            <OtpInput
              length={6}
              value={otp}
              onChange={(value) => setValue("otp", value)}
            />
            {errors.otp && (
              <p className="text-red-500 text-xs text-center font-medium">
                {errors.otp.message}
              </p>
            )}
          </div>
          
          <p className="text-xs text-center text-slate-400">
            The code will expire in 10 minutes.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            isLoading={loading}
            disabled={otp.length !== 6}
          >
            Verify Email
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-slate-500 hover:text-indigo-600"
            onClick={handleResend}
            disabled={loading}
          >
            <RefreshCcw size={16} className="mr-2" />
            Resend Code
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OtpVerification;