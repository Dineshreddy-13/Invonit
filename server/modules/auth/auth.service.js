// auth.service.js
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../database/db.js";
import { users } from "../../database/schemas/users.schema.js";
import { redis } from "../../config/redis.js";
import { generateToken } from "../../utils/token.js";
import { OTP_TTL } from "../../config/env.js";
import { 
  createOTPForRequest, 
  refreshOTPForRequest 
} from "../../services/otp.service.js";
import {sendOTPEmail} from "../../services/email.service.js";
import crypto from "crypto";

/**
 * Generate a unique request ID for OTP flow
 */
const generateRequestId = () => crypto.randomBytes(32).toString("hex");

/**
 * Helper to generate OTP (local)
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


/**
 * Request registration with email-based OTP via requestId
 * Returns requestId to be used in subsequent verify and resend calls
 */
export const requestRegisteration = async ({ name, email, phone, password }) => {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  if (existing.length > 0) throw new Error("Email already registered.");

  if (password.length < 6) throw new Error("Password must be at least 6 characters.");

  const hashedPassword = await bcrypt.hash(password, 12);
  const requestId = generateRequestId();
  const otp = generateOTP();

  // Store registration request in Redis with requestId
  const requestData = {
    type: "register",
    email,
    name,
    phone: phone || null,
    password: hashedPassword,
    otp,
    verified: false,
    createdAt: Date.now(),
  };

  await redis.set(
    `otp_request:${requestId}`,
    JSON.stringify(requestData),
    "EX",
    OTP_TTL
  );

  // Send OTP email
  await sendOTPEmail({ to: email, name, otp });

  return { requestId };
};

/**
 * Verify OTP and complete registration
 */
export const verifyAndRegister = async ({ requestId, otp }) => {
  const raw = await redis.get(`otp_request:${requestId}`);
  if (!raw) throw new Error("Registration session expired. Please start over.");

  const requestData = JSON.parse(raw);
  
  if (requestData.type !== "register") {
    throw new Error("Invalid request type.");
  }

  // Verify OTP
  if (requestData.otp !== otp) throw new Error("Invalid OTP.");

  const { name, email, phone, password } = requestData;

  // Create user in database
  const [newUser] = await db
    .insert(users)
    .values({ name, email, phone, password, isVerified: true })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
    });

  // Clean up Redis request
  await redis.del(`otp_request:${requestId}`);

  // Generate JWT token
  const token = generateToken({
    id: newUser.id,
    email: newUser.email
  });

  return { user: newUser, token };
};


/**
 * Resend registration OTP
 */
export const resendRegistrationOTP = async (requestId) => {
  const raw = await redis.get(`otp_request:${requestId}`);
  if (!raw) throw new Error("No pending registration found. Please start over.");

  const requestData = JSON.parse(raw);
  
  if (requestData.type !== "register") {
    throw new Error("Invalid request type.");
  }

  const otp = await refreshOTPForRequest(requestId);
  
  await sendOTPEmail({
    to: requestData.email,
    name: requestData.name,
    otp
  });

  return { requestId };
};


export const loginUser = async ({ email, password }) => {
  const [user] = await db
  .select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);

  if (!user) throw new Error("Invalid email or password.");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password.");

  const token = generateToken({ id: user.id, email: user.email });
  const { password: _, ...safeUser } = user;
  return { 
    user: safeUser,
    token 
  };
};

export const getUserById = async (id) => {
  const [user] = await db
    .select({
      id: users.id, name: users.name, email: users.email,
      phone: users.phone, isVerified: users.isVerified, createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) throw new Error("User not found.");
  return user;
};

/**
 * Send forgot password OTP
 * Returns requestId for subsequent verify and reset calls
 */
export const sendForgotPasswordOTP = async (email) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) throw new Error("No account found with this email.");

  const requestId = generateRequestId();
  const otp = generateOTP();

  // Store forgot password request in Redis with requestId
  const requestData = {
    type: "forgot_password",
    email,
    otp,
    verified: false,
    createdAt: Date.now(),
  };

  await redis.set(
    `otp_request:${requestId}`,
    JSON.stringify(requestData),
    "EX",
    OTP_TTL
  );

  // Send OTP email
  await sendOTPEmail({
    to: email,
    name: user.name,
    otp
  });

  return { requestId };
};

/**
 * Verify forgot password OTP and return reset token
 */
export const verifyForgotPasswordOTP = async (requestId, otp) => {
  const raw = await redis.get(`otp_request:${requestId}`);
  if (!raw) throw new Error("OTP expired or not found. Please request a new one.");

  const requestData = JSON.parse(raw);

  if (requestData.type !== "forgot_password") {
    throw new Error("Invalid request type.");
  }

  // Verify OTP
  if (requestData.otp !== otp) throw new Error("Invalid OTP.");

  // Mark as verified
  requestData.verified = true;
  await redis.set(
    `otp_request:${requestId}`,
    JSON.stringify(requestData),
    "EX",
    OTP_TTL
  );

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  return { resetToken };
};

/**
 * Resend forgot password OTP
 */
export const resendForgotPasswordOTP = async (requestId) => {
  const raw = await redis.get(`otp_request:${requestId}`);
  if (!raw) throw new Error("No pending request found. Please start over.");

  const requestData = JSON.parse(raw);

  if (requestData.type !== "forgot_password") {
    throw new Error("Invalid request type.");
  }

  const otp = await refreshOTPForRequest(requestId);

  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.email, requestData.email))
    .limit(1);

  if (!user) throw new Error("No account found with this email.");

  await sendOTPEmail({
    to: requestData.email,
    name: user.name,
    otp
  });

  return { requestId };
};

/**
 * Reset password after OTP verification
 */
export const resetPassword = async (requestId, resetToken, newPassword) => {
  const raw = await redis.get(`otp_request:${requestId}`);
  if (!raw) throw new Error("Reset request expired. Please start over.");

  const requestData = JSON.parse(raw);

  if (requestData.type !== "forgot_password") {
    throw new Error("Invalid request type.");
  }

  if (!requestData.verified) {
    throw new Error("OTP verification required. Please verify OTP first.");
  }

  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  // Hash and update password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.email, requestData.email));

  // Clean up Redis request
  await redis.del(`otp_request:${requestId}`);
};