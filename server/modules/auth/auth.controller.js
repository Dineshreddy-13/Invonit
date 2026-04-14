import {
  requestRegisteration,
  verifyAndRegister,
  resendRegistrationOTP,
  loginUser,
  getUserById,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resendForgotPasswordOTP,
  resetPassword,
} from "./auth.service.js";

export const startRegisteration = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, email, and password are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters."
      });
    }

    const { requestId } = await requestRegisteration({ name, email, phone, password });

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email. Valid for 10 minutes.",
      data: { requestId }
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const completeRegisteration = async (req, res) => {
  try {
    const { requestId, otp } = req.body;

    if (!requestId || !otp) {
      return res.status(400).json({
        success: false,
        message: "Request ID and OTP are required."
      });
    }

    const { user, token } = await verifyAndRegister({ requestId, otp });

    return res.status(201).json({
      success: true,
      message: "Email verified. Registration successful.",
      data: { user, token },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const resendRegistrationOTPHandler = async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({
      success: false,
      message: "Request ID is required."
    });

    await resendRegistrationOTP(requestId);

    return res.status(200).json({
      success: true,
      message: "New OTP sent to your email.",
      data: { requestId }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const { user, token } = await loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: "Login successful.", 
      data: { user, token } 
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    return res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false, 
        message: "Email is required."
      });
    }

    const { requestId } = await sendForgotPasswordOTP(email);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email.",
      data: { requestId }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const verifyPasswordResetOtp = async (req, res) => {
  try {
    const { requestId, otp } = req.body;

    if (!requestId || !otp) {
      return res.status(400).json({
        success: false,
        message: "Request ID and OTP are required."
      });
    }

    const { resetToken } = await verifyForgotPasswordOTP(requestId, otp);

    return res.status(200).json({
      success: true,
      message: "OTP verified. Use the reset token to set a new password.",
      data: { resetToken, requestId },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const resendPasswordResetOTPHandler = async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({
      success: false,
      message: "Request ID is required."
    });

    await resendForgotPasswordOTP(requestId);

    return res.status(200).json({
      success: true,
      message: "New OTP sent to your email.",
      data: { requestId }
    });
  } catch (error) {
    return res.status(400).json({
      success: false, 
      message: error.message
    });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { requestId, resetToken, newPassword } = req.body;

    if (!requestId || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Request ID, reset token, and new password are required.",
      });
    }

    await resetPassword(requestId, resetToken, newPassword);

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please login."
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};