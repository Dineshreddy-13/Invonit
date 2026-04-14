// services/otp.service.js
import { redis } from "../config/redis.js";
import {generateOTP} from "../utils/otp.js"
import { OTP_TTL } from "../config/env.js";

/**
 * Create OTP for a request ID and store in Redis
 * Updates the existing request object with new OTP
 */
export const createOTPForRequest = async (requestId) => {
  const otp = generateOTP();
  
  // Get existing request data
  const raw = await redis.get(`otp_request:${requestId}`);
  if (!raw) throw new Error("Request not found or expired. Please start over.");
  
  const requestData = JSON.parse(raw);
  requestData.otp = otp;
  requestData.verified = false;
  
  // Update Redis with new OTP
  await redis.set(`otp_request:${requestId}`, JSON.stringify(requestData), "EX", OTP_TTL);
  return otp;
};

/**
 * Verify OTP for a request ID
 * Marks the request as verified
 */
export const verifyOTPForRequest = async (requestId, otp) => {
  const raw = await redis.get(`otp_request:${requestId}`);
  if (!raw) throw new Error("OTP expired or not found. Please request a new one.");
  
  const requestData = JSON.parse(raw);
  if (requestData.otp !== otp) throw new Error("Invalid OTP.");
  
  // Mark as verified but keep the request in Redis for password reset flow
  requestData.verified = true;
  await redis.set(`otp_request:${requestId}`, JSON.stringify(requestData), "EX", OTP_TTL);
};

/**
 * Refresh OTP for a request ID with cooldown protection
 */
export const refreshOTPForRequest = async (requestId, cooldownSeconds = 60) => {
  const ttl = await redis.ttl(`otp_request:${requestId}`);
  if (ttl < 0) throw new Error("No pending request found. Please start over.");
  if (ttl > OTP_TTL - cooldownSeconds) {
    throw new Error("Please wait before requesting a new OTP.");
  }
  return createOTPForRequest(requestId);
};

// Legacy email-based functions (kept for backward compatibility, will be deprecated)
export const createOTP = async (namespace, email) => {
  const otp = generateOTP();
  await redis.set(`otp:${namespace}:${email}`, otp, "EX", OTP_TTL);
  return otp;
};

export const verifyOTP = async (namespace, email, otp) => {
  const stored = await redis.get(`otp:${namespace}:${email}`);
  if (!stored) throw new Error("OTP expired or not found. Please request a new one.");
  if (stored !== otp) throw new Error("Invalid OTP.");
  await redis.del(`otp:${namespace}:${email}`);
};

export const refreshOTP = async (namespace, email, cooldownSeconds = 60) => {
  const ttl = await redis.ttl(`otp:${namespace}:${email}`);
  if (ttl < 0) throw new Error("No pending OTP found. Please start over.");
  if (ttl > OTP_TTL - cooldownSeconds) {
    throw new Error("Please wait before requesting a new OTP.");
  }
  return createOTP(namespace, email);
};