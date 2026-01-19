/**
 * Application Messages Constants
 * Single source of truth for all success and error messages
 *
 * Usage:
 * import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/messages.js';
 * res.json({ message: SUCCESS_MESSAGES.CREATED("Inventory") });
 * throw new NotFoundError(ERROR_MESSAGES.NOT_FOUND("Expense", expenseId));
 */

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  // Generic success messages
  CREATED: (resource = "Resource") => `${resource} created successfully`,
  UPDATED: (resource = "Resource") => `${resource} updated successfully`,
  DELETED: (resource = "Resource") => `${resource} deleted successfully`,
  RETRIEVED: (resource = "Resource") => `${resource} retrieved successfully`,
  LIST_RETRIEVED: (resource = "Resources") =>
    `${resource} retrieved successfully`,
  RESTORED: (resource = "Resource") => `${resource} restored successfully`,

  // Specific success messages
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  PASSWORD_UPDATED: "Password updated successfully",
  ACCOUNT_CREATED: "Account created successfully",
  PROFILE_UPDATED: "Profile updated successfully",

  // Inventory/Stock messages
  INVENTORY_CREATED: "Inventory item created successfully",
  STOCK_UPDATED: "Stock updated successfully",
  QUANTITY_UPDATED: "Quantity updated successfully",
  ORDER_CREATED: "Order created successfully",
  ORDER_CANCELLED: "Order cancelled successfully",
  TRANSFER_COMPLETED: "Transfer completed successfully",

  // Payment messages
  PAYMENT_SUCCESS: "Payment processed successfully",
  REFUND_SUCCESS: "Refund processed successfully",
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  // Generic error messages
  NOT_FOUND: (resource = "Resource", id = null) =>
    id ? `${resource} with ID ${id} not found` : `${resource} not found`,
  ALREADY_EXISTS: (resource = "Resource") => `${resource} already exists`,
  INVALID_FORMAT: (field = "Field") => `Invalid ${field.toLowerCase()} format`,
  REQUIRED: (field = "Field") => `${field} is required`,
  INVALID_VALUE: (field = "Field", value = null) =>
    value
      ? `Invalid value for ${field.toLowerCase()}: ${value}`
      : `Invalid ${field.toLowerCase()}`,

  // Validation errors
  VALIDATION_FAILED: "Validation failed",
  INVALID_INPUT: "Invalid input data",
  INVALID_EMAIL: "Invalid email format",
  INVALID_PASSWORD: "Invalid password format",
  PASSWORD_TOO_SHORT: (minLength = 8) =>
    `Password must be at least ${minLength} characters`,
  INVALID_ID_FORMAT: (field = "ID") => `Invalid ${field.toLowerCase()} format`,

  // Authentication errors
  UNAUTHORIZED: "Unauthorized. Please login to access this resource",
  AUTHENTICATION_REQUIRED: "Authentication required",
  INVALID_TOKEN: "Invalid token. Please login again",
  TOKEN_EXPIRED: "JWT has expired. Please login again",
  INVALID_CREDENTIALS: "Invalid email or password",
  LOGIN_REQUIRED: "Please login to access this resource",

  // Authorization errors
  FORBIDDEN: "You don't have permission to access this resource",
  INSUFFICIENT_PERMISSIONS:
    "You don't have sufficient permissions to perform this action",

  // Resource errors
  RESOURCE_NOT_FOUND: (resource = "Resource") => `${resource} not found`,
  RESOURCE_DELETED: (resource = "Resource") => `${resource} is deleted`,
  RESOURCE_ALREADY_EXISTS: (resource = "Resource") =>
    `${resource} already exists`,
  RESOURCE_IN_USE: (resource = "Resource") =>
    `${resource} is currently in use and cannot be deleted`,

  // Database errors
  DUPLICATE_KEY: (field = "Field", value = null) =>
    value
      ? `The ${field.toLowerCase()} "${value}" is already in use. Please choose another one.`
      : `The ${field.toLowerCase()} is already in use. Please choose another one.`,
  DATABASE_ERROR: "Database operation failed",
  CAST_ERROR: (field = "field", value = null) =>
    value
      ? `Invalid value for ${field.toLowerCase()}: ${value}`
      : `Invalid ${field.toLowerCase()}`,

  // Business logic errors
  INSUFFICIENT_STOCK: "Insufficient stock available",
  INSUFFICIENT_QUANTITY: (quantity = null) =>
    quantity
      ? `Insufficient quantity. Available: ${quantity}`
      : "Insufficient quantity",
  NEGATIVE_QUANTITY: "Quantity cannot be negative",
  INVALID_QUANTITY: "Invalid quantity. Must be a positive number",
  QUANTITY_REQUIRED: "Quantity is required",
  CANNOT_DELETE: (reason = "") => `Cannot delete${reason ? `. ${reason}` : ""}`,
  CANNOT_UPDATE: (reason = "") => `Cannot update${reason ? `. ${reason}` : ""}`,

  // Payment errors
  PAYMENT_FAILED: "Payment processing failed",
  INVALID_PAYMENT_METHOD: "Invalid payment method",
  PAYMENT_REQUIRED: "Payment is required",
  INVALID_AMOUNT: "Invalid payment amount",

  // Order errors
  ORDER_NOT_FOUND: "Order not found",
  ORDER_CANNOT_BE_CANCELLED: (reason = "") =>
    `Order cannot be cancelled${reason ? `. ${reason}` : ""}`,
  ORDER_ALREADY_PAID: "Order has already been paid",
  EMPTY_ORDER: "Order must contain at least one item",

  // Server errors
  INTERNAL_SERVER_ERROR: "An internal server error occurred",
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again later!!!",
  SERVICE_UNAVAILABLE: "Service is temporarily unavailable",
  TIMEOUT: "Request timeout. Please try again",

  // Rate limiting
  TOO_MANY_REQUESTS: "Too many requests. Please try again later.",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Please try again later",

  // Not found errors (404)
  ROUTE_NOT_FOUND: (route = "") =>
    route ? `Can't find ${route} on the server!` : "Route not found",
  PAGE_NOT_FOUND: "Page not found",
};

/**
 * Validation Error Messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: (field) => `${field} is required`,
  INVALID_FORMAT: (field) => `Invalid ${field.toLowerCase()} format`,
  MIN_LENGTH: (field, min) => `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field, max) => `${field} must not exceed ${max} characters`,
  MIN: (field, min) => `${field} must be at least ${min}`,
  MAX: (field, max) => `${field} must not exceed ${max}`,
  INVALID_EMAIL: "Email must be a valid email address",
  INVALID_PASSWORD:
    "Password must contain at least one uppercase, one lowercase, and one number",
  INVALID_ID: (field = "ID") => `Invalid ${field.toLowerCase()} format`,
  MUST_BE_ARRAY: (field) => `${field} must be an array`,
  MUST_BE_STRING: (field) => `${field} must be a string`,
  MUST_BE_NUMBER: (field) => `${field} must be a number`,
  MUST_BE_POSITIVE: (field) => `${field} must be a positive number`,
  MUST_BE_INTEGER: (field) => `${field} must be an integer`,
};

/**
 * Response Messages Helper
 * Quick access to commonly used message patterns
 */
export const MESSAGES = {
  // Success
  CREATED: SUCCESS_MESSAGES.CREATED,
  UPDATED: SUCCESS_MESSAGES.UPDATED,
  DELETED: SUCCESS_MESSAGES.DELETED,
  RETRIEVED: SUCCESS_MESSAGES.RETRIEVED,

  // Errors
  NOT_FOUND: ERROR_MESSAGES.NOT_FOUND,
  INVALID_FORMAT: ERROR_MESSAGES.INVALID_FORMAT,
  REQUIRED: ERROR_MESSAGES.REQUIRED,
  UNAUTHORIZED: ERROR_MESSAGES.UNAUTHORIZED,
  FORBIDDEN: ERROR_MESSAGES.FORBIDDEN,
};

// Default export
export default {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  VALIDATION_MESSAGES,
  MESSAGES,
};
