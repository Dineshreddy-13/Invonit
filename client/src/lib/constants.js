/**
 * OTP Flow Mode Constants
 */
export const OTP_MODE = {
  REGISTER: "register",
  RESET: "reset",
};

/**
 * Authentication Routes
 */
export const AUTH_ROUTES = {
  SIGNIN: "/auth/signin",
  SIGNUP: "/auth/signup",
  FORGOT_PASSWORD: "/auth/forgot-password",
  VERIFY_OTP: "/auth/verify",
  RESET_PASSWORD: "/auth/reset-password",
  DASHBOARD: "/dashboard",
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  REGISTER: "/auth/register",
  REGISTER_VERIFY: "/auth/register/verify",
  REGISTER_RESEND_OTP: "/auth/register/resend-otp",
  LOGIN: "/auth/login",
  GET_ME: "/auth/me",
  FORGOT_PASSWORD: "/auth/forgot-password",
  FORGOT_PASSWORD_VERIFY: "/auth/forgot-password/verify",
  FORGOT_PASSWORD_RESEND_OTP: "/auth/forgot-password/resend-otp",
  RESET_PASSWORD: "/auth/reset-password",

  // Business
  BUSINESS: "/business",
  BUSINESS_BY_ID: (id) => `/business/${id}`,

  // Parties
  PARTIES: (businessId) => `/business/${businessId}/parties`,
  PARTIES_BY_ID: (businessId, partyId) => `/business/${businessId}/parties/${partyId}`,
};
