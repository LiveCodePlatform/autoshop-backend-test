/**
 * Stock Audit Log Validators
 * Request validation schemas for stock audit log endpoints
 * Uses types from types/stockAuditLog.types.js for field names and enums
 * All validation constraints/rules are defined here
 */

import Joi from "joi";
import mongoose from "mongoose";
import {
  LOCATION_TYPE,
  STOCK_AUDIT_ACTION,
  RELATED_TRANSACTION_TYPE,
  STOCK_AUDIT_LOG_FIELDS,
  STOCK_AUDIT_LOG_DEFAULTS,
  getValidLocationTypes,
  getValidActions,
  getValidRelatedTransactionTypesWithNull,
} from "../types/stockAuditLog.types.js";

/**
 * Validation Constraints
 * All validation rules are defined here (not in types)
 */
const VALIDATION_CONSTRAINTS = {
  REASON: {
    MAX_LENGTH: 500,
  },
  QUANTITY: {
    MIN: 0,
  },
};

/**
 * Helper function to validate MongoDB ObjectId
 */
const objectId = Joi.string()
  .custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error("any.invalid");
    }
    return value;
  })
  .messages({
    "any.invalid": "Invalid ObjectId format",
  });

/**
 * Validation schema for creating stock audit log
 */
export const createStockAuditLogSchema = Joi.object({
  [STOCK_AUDIT_LOG_FIELDS.INVENTORY_ID]: objectId
    .required()
    .messages({
      "any.required": "Please provide the inventory ID for the log",
      "string.empty": "Please provide the inventory ID for the log",
    }),

  [STOCK_AUDIT_LOG_FIELDS.ADMIN_ID]: objectId
    .required()
    .messages({
      "any.required": "Please provide the admin ID for the log",
      "string.empty": "Please provide the admin ID for the log",
    }),

  [STOCK_AUDIT_LOG_FIELDS.LOCATION_ID]: objectId
    .required()
    .messages({
      "any.required": "Please provide the location ID for the log",
      "string.empty": "Please provide the location ID for the log",
    }),

  [STOCK_AUDIT_LOG_FIELDS.LOCATION_TYPE]: Joi.string()
    .valid(...getValidLocationTypes())
    .required()
    .messages({
      "any.only": `Location type must be one of: ${getValidLocationTypes().join(", ")}`,
      "any.required": "Please provide the location type for the log",
      "string.empty": "Please provide the location type for the log",
    }),

  [STOCK_AUDIT_LOG_FIELDS.STOCK_RECORD_ID]: objectId
    .required()
    .messages({
      "any.required": "Please provide the stock record ID for the log",
      "string.empty": "Please provide the stock record ID for the log",
    }),

  [STOCK_AUDIT_LOG_FIELDS.BEFORE_QUANTITY]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
    .required()
    .messages({
      "number.base": "Stock quantity before the change must be a number",
      "number.min": "Stock quantity cannot be negative",
      "any.required": "Please provide the stock quantity before the change",
    }),

  [STOCK_AUDIT_LOG_FIELDS.AFTER_QUANTITY]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
    .required()
    .messages({
      "number.base": "Stock quantity after the change must be a number",
      "number.min": "Stock quantity cannot be negative",
      "any.required": "Please provide the stock quantity after the change",
    }),

  [STOCK_AUDIT_LOG_FIELDS.QUANTITY_CHANGE]: Joi.number()
    .required()
    .messages({
      "number.base": "Quantity change must be a number",
      "any.required": "Please provide the quantity change",
    }),

  [STOCK_AUDIT_LOG_FIELDS.ACTION]: Joi.string()
    .valid(...getValidActions())
    .required()
    .messages({
      "any.only": `Action must be one of: ${getValidActions().join(", ")}`,
      "any.required": "Please provide the action for the log",
      "string.empty": "Please provide the action for the log",
    }),

  [STOCK_AUDIT_LOG_FIELDS.REASON]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.REASON.MAX_LENGTH)
    .allow(null, "")
    .default(STOCK_AUDIT_LOG_DEFAULTS.REASON)
    .optional()
    .messages({
      "string.max": `Reason cannot exceed ${VALIDATION_CONSTRAINTS.REASON.MAX_LENGTH} characters`,
    }),

  [STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_ID]: objectId
    .allow(null, "")
    .default(STOCK_AUDIT_LOG_DEFAULTS.RELATED_TRANSACTION_ID)
    .optional(),

  [STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_TYPE]: Joi.string()
    .valid(...getValidRelatedTransactionTypesWithNull())
    .allow(null, "")
    .default(STOCK_AUDIT_LOG_DEFAULTS.RELATED_TRANSACTION_TYPE)
    .optional()
    .messages({
      "any.only": `Related transaction type must be one of: ${getValidRelatedTransactionTypesWithNull()
        .filter((t) => t !== null)
        .join(", ")}, or null`,
    }),
})
  .custom((value, helpers) => {
    // Custom validation: quantityChange should equal (afterQuantity - beforeQuantity)
    const expectedChange =
      value[STOCK_AUDIT_LOG_FIELDS.AFTER_QUANTITY] -
      value[STOCK_AUDIT_LOG_FIELDS.BEFORE_QUANTITY];
    if (
      value[STOCK_AUDIT_LOG_FIELDS.QUANTITY_CHANGE] !== expectedChange
    ) {
      return helpers.error("custom.quantityChangeMismatch");
    }
    return value;
  }, "Quantity change validation")
  .messages({
    "custom.quantityChangeMismatch":
      "Quantity change must equal (afterQuantity - beforeQuantity)",
  });

/**
 * Validation schema for updating stock audit log (rarely used, but included for completeness)
 */
export const updateStockAuditLogSchema = Joi.object({
  [STOCK_AUDIT_LOG_FIELDS.REASON]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.REASON.MAX_LENGTH)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": `Reason cannot exceed ${VALIDATION_CONSTRAINTS.REASON.MAX_LENGTH} characters`,
    }),

  [STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_ID]: objectId
    .allow(null, "")
    .optional(),

  [STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_TYPE]: Joi.string()
    .valid(...getValidRelatedTransactionTypesWithNull())
    .allow(null, "")
    .optional()
    .messages({
      "any.only": `Related transaction type must be one of: ${getValidRelatedTransactionTypesWithNull()
        .filter((t) => t !== null)
        .join(", ")}, or null`,
    }),
}).min(1); // At least one field must be provided

/**
 * Validation schema for query parameters (for GET requests)
 */
export const getStockAuditLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  inventoryId: objectId.optional(),
  adminId: objectId.optional(),
  locationId: objectId.optional(),
  locationType: Joi.string()
    .valid(...getValidLocationTypes())
    .optional(),
  action: Joi.string()
    .valid(...getValidActions())
    .optional(),
  stockRecordId: objectId.optional(),
  relatedTransactionId: objectId.optional(),
  relatedTransactionType: Joi.string()
    .valid(...getValidRelatedTransactionTypesWithNull())
    .optional(),
  sortBy: Joi.string()
    .valid(
      "createdAt",
      "updatedAt",
      "beforeQuantity",
      "afterQuantity",
      "quantityChange"
    )
    .default("createdAt")
    .optional(),
  sortOrder: Joi.string().valid("asc", "desc").default("desc").optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

/**
 * Validation middleware for creating stock audit log
 */
export const validateCreateStockAuditLog = (req, res, next) => {
  const { error, value } = createStockAuditLogSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.body = value;
  next();
};

/**
 * Validation middleware for updating stock audit log
 */
export const validateUpdateStockAuditLog = (req, res, next) => {
  const { error, value } = updateStockAuditLogSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.body = value;
  next();
};

/**
 * Validation middleware for query parameters
 */
export const validateGetStockAuditLogsQuery = (req, res, next) => {
  const { error, value } = getStockAuditLogsQuerySchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Store validated query in a custom property since req.query is read-only
  req.validatedQuery = value;
  next();
};

// Export constraints for model use if needed (optional)
export { VALIDATION_CONSTRAINTS };

export default {
  createStockAuditLogSchema,
  updateStockAuditLogSchema,
  getStockAuditLogsQuerySchema,
  validateCreateStockAuditLog,
  validateUpdateStockAuditLog,
  validateGetStockAuditLogsQuery,
  VALIDATION_CONSTRAINTS,
};
