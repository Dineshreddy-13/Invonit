import { Router } from "express";
import {
    startRegisteration,
    completeRegisteration,
    resendRegistrationOTPHandler,
    login,
    getMe,
    forgotPassword,
    verifyPasswordResetOtp,
    resendPasswordResetOTPHandler,
    resetUserPassword,
} from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

// Registration
router.post("/register", startRegisteration);
router.post("/register/verify", completeRegisteration);
router.post("/register/resend-otp", resendRegistrationOTPHandler);

router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/forgot-password/verify", verifyPasswordResetOtp);
router.post("/forgot-password/resend-otp", resendPasswordResetOTPHandler);
router.post("/reset-password", resetUserPassword);

router.get("/me", authenticate, getMe);

export default router;