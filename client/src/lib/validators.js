/**
 * Validation helper functions
 */

/**
 * Validate Indian GSTIN format
 * Format: 15 characters (state code + 2 digits + 5-letter PAN + 4 digits + Z + 1 digit)
 */
export const validateGSTIN = (gstin) => {
  if (!gstin) return true; // GSTIN is optional
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9]{1}Z[0-9]{1}$/;
  return gstinRegex.test(gstin.toUpperCase());
};

/**
 * Validate Indian mobile number
 * Must be exactly 10 digits
 */
export const validateMobile = (mobile) => {
  const mobileRegex = /^[0-9]{10}$/;
  return mobileRegex.test(mobile);
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize and format mobile number to remove any special characters
 */
export const formatMobile = (mobile) => {
  return mobile.replace(/\D/g, "").slice(0, 10);
};

/**
 * Format GSTIN to uppercase
 */
export const formatGSTIN = (gstin) => {
  return gstin.toUpperCase().replace(/\s/g, "");
};

/**
 * List of Indian states for dropdown
 */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep",
  "Delhi",
  "Puducherry",
];

/**
 * Party types
 */
export const PARTY_TYPES = [
  { value: "customer", label: "Customer" },
  { value: "supplier", label: "Supplier" },
  { value: "both", label: "Both" },
];
