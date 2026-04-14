// ─── HTTP Status Codes ─────────────────────────────────────────────────────
export const HTTP = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL: 500,
};

// ─── Response Messages ────────────────────────────────────────────────────
export const MSG = {
  // Auth
  REGISTER_SUCCESS: "Registration initiated. OTP sent to your email.",
  OTP_VERIFIED: "OTP verified. Account created successfully.",
  OTP_INVALID: "Invalid or expired OTP.",
  OTP_RESENT: "OTP resent successfully.",
  LOGIN_SUCCESS: "Logged in successfully.",
  LOGIN_FAILED: "Invalid email or password.",
  LOGOUT_SUCCESS: "Logged out successfully.",
  UNAUTHORIZED: "Authentication required.",
  FORBIDDEN: "Access denied.",
  TOKEN_INVALID: "Invalid or expired token.",
  FORGOT_PASSWORD_SUCCESS: "Password reset OTP sent to your email.",
  RESET_PASSWORD_SUCCESS: "Password reset successfully.",
  USER_NOT_FOUND: "User not found.",
  EMAIL_ALREADY_EXISTS: "Email already registered.",
  PHONE_ALREADY_EXISTS: "Phone number already registered.",

  // Business
  BUSINESS_CREATED: "Business created successfully.",
  BUSINESS_UPDATED: "Business updated successfully.",
  BUSINESS_FETCHED: "Business fetched successfully.",
  BUSINESS_NOT_FOUND: "Business not found.",
  BUSINESS_ALREADY_EXISTS: "Business already exists for this account.",
  BUSINESS_FORBIDDEN: "You do not have access to this business.",

  // Party
  PARTY_CREATED: "Party created successfully.",
  PARTY_UPDATED: "Party updated successfully.",
  PARTY_FETCHED: "Party fetched successfully.",
  PARTIES_FETCHED: "Parties fetched successfully.",
  PARTY_DELETED: "Party deleted successfully.",
  PARTY_NOT_FOUND: "Party not found.",
  PARTY_FORBIDDEN: "You do not have access to this party.",
  PARTY_NAME_EXISTS: "A party with this name already exists in your business.",

  // Category
  CATEGORY_CREATED: "Category created successfully.",
  CATEGORY_UPDATED: "Category updated successfully.",
  CATEGORY_FETCHED: "Category fetched successfully.",
  CATEGORIES_FETCHED: "Categories fetched successfully.",
  CATEGORY_DELETED: "Category deleted successfully.",
  CATEGORY_NOT_FOUND: "Category not found.",
  CATEGORY_FORBIDDEN: "You do not have access to this category.",
  CATEGORY_NAME_EXISTS: "A category with this name already exists.",
  CATEGORY_HAS_CHILDREN: "Cannot delete a category that has sub-categories.",
  CATEGORY_CIRCULAR_REF: "A category cannot be its own parent.",
  CATEGORY_PARENT_NOT_FOUND: "Parent category not found.",

  // Tax Rate
  TAX_RATE_CREATED: "Tax rate created successfully.",
  TAX_RATE_UPDATED: "Tax rate updated successfully.",
  TAX_RATE_FETCHED: "Tax rate fetched successfully.",
  TAX_RATES_FETCHED: "Tax rates fetched successfully.",
  TAX_RATE_DELETED: "Tax rate deleted successfully.",
  TAX_RATE_NOT_FOUND: "Tax rate not found.",
  TAX_RATE_FORBIDDEN: "You do not have access to this tax rate.",
  TAX_RATE_NAME_EXISTS: "A tax rate with this name already exists.",
  TAX_RATE_IN_USE: "Cannot delete a tax rate that is assigned to products.",

  // Product
  PRODUCT_CREATED: "Product created successfully.",
  PRODUCT_UPDATED: "Product updated successfully.",
  PRODUCT_FETCHED: "Product fetched successfully.",
  PRODUCTS_FETCHED: "Products fetched successfully.",
  PRODUCT_DELETED: "Product deleted successfully.",
  PRODUCT_NOT_FOUND: "Product not found.",
  PRODUCT_FORBIDDEN: "You do not have access to this product.",
  PRODUCT_SKU_EXISTS: "A product with this SKU already exists.",
  PRODUCT_BARCODE_EXISTS: "A product with this barcode already exists.",
  PRODUCT_NAME_EXISTS: "A product with this name already exists.",
  PRODUCT_LOW_STOCK: "Product stock is below threshold.",
  PRODUCT_OUT_OF_STOCK: "Product is out of stock.",
  PRODUCT_NEGATIVE_STOCK: "Insufficient stock for this operation.",
  STOCK_ADJUSTED: "Stock adjusted successfully.",
  STOCK_FETCHED: "Stock details fetched successfully.",

  // Purchase
  PURCHASE_CREATED: "Purchase recorded successfully.",
  PURCHASE_UPDATED: "Purchase updated successfully.",
  PURCHASE_FETCHED: "Purchase fetched successfully.",
  PURCHASES_FETCHED: "Purchases fetched successfully.",
  PURCHASE_DELETED: "Purchase cancelled successfully.",
  PURCHASE_NOT_FOUND: "Purchase not found.",
  PURCHASE_FORBIDDEN: "You do not have access to this purchase.",
  PURCHASE_DUPLICATE_INVOICE: "Duplicate invoice number detected for this supplier.",
  PURCHASE_RETURN_CREATED: "Purchase return recorded successfully.",
  PURCHASE_CANNOT_RETURN: "Only received purchases can be returned.",
  PURCHASE_ALREADY_RETURNED: "This purchase has already been fully returned.",
  PAYMENT_RECORDED: "Payment recorded successfully.",
  SUPPLIER_NOT_VALID: "Supplier not found or is not a valid supplier party.",

  // Generic
  VALIDATION_ERROR: "Validation error.",
  NOT_FOUND: "Resource not found.",
  INTERNAL_ERROR: "Internal server error.",
  DUPLICATE: "Duplicate entry detected.",
};

// ─── Business ─────────────────────────────────────────────────────────────
export const BUSINESS_TYPES            = ["retail", "wholesale", "manufacturing", "service", "other"];
export const CURRENCIES                = ["INR", "USD", "EUR", "GBP", "AED"];
export const DEFAULT_INVOICE_PREFIX    = "INV";
export const DEFAULT_FINANCIAL_YEAR_START = "04-01";
export const DEFAULT_CURRENCY          = "INR";
export const DEFAULT_COUNTRY           = "India";

// ─── Party ────────────────────────────────────────────────────────────────
export const PARTY_TYPES   = ["customer", "supplier", "both"];
export const BALANCE_TYPES = ["Dr", "Cr"];

// ─── Product / Inventory ──────────────────────────────────────────────────
export const UNIT_TYPES = [
  "pcs", "kg", "g", "l", "ml", "m", "cm",
  "box", "pack", "dozen", "pair", "set",
];
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;
export const STOCK_ADJUSTMENT_REASONS   = [
  "opening_stock", "damage", "loss", "return", "correction", "other",
];

// ─── Purchase ─────────────────────────────────────────────────────────────
export const PURCHASE_STATUSES = ["draft", "received", "partial", "returned", "cancelled"];
export const PURCHASE_SOURCES  = ["manual", "ocr"];
export const PAYMENT_MODES     = [
  "cash", "upi", "card", "bank_transfer", "cheque", "credit", "mixed",
];

// ─── Tax ──────────────────────────────────────────────────────────────────
export const GST_SLABS    = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28];
export const MAX_TAX_RATE = 100;

// ─── OTP ──────────────────────────────────────────────────────────────────
export const OTP_LENGTH                  = 6;
export const OTP_EXPIRES_MINUTES         = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const MAX_OTP_ATTEMPTS            = 5;

// ─── Token ────────────────────────────────────────────────────────────────
export const JWT_EXPIRES_IN              = "7d";
export const RESET_TOKEN_EXPIRES_MINUTES = 15;

// ─── Pagination ───────────────────────────────────────────────────────────
export const DEFAULT_PAGE  = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT     = 100;

// ─── Regex ────────────────────────────────────────────────────────────────
export const GSTIN_REGEX   = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_REGEX     = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
export const PHONE_REGEX   = /^[6-9]\d{9}$/;
export const EMAIL_REGEX   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const HSN_REGEX     = /^[0-9]{4,8}$/;
export const SAC_REGEX     = /^[0-9]{6}$/;
export const SKU_REGEX     = /^[a-zA-Z0-9_\-]{1,50}$/;
export const BARCODE_REGEX = /^[a-zA-Z0-9\-]{4,50}$/;