/**
 * Storefront Inventory Validators
 * Request validation schemas for storefront inventory endpoints
 * Uses types from types/storefrontInventory.types.js for field names and enums
 * All validation constraints/rules are defined here
 */

import Joi from "joi";
import mongoose from "mongoose";
import {
  STOREFRONT_INVENTORY_FIELDS,
  STOREFRONT_INVENTORY_DEFAULTS,
} from "../types/storefrontInventory.types.js";

/**
 * Validation Constraints
 * All validation rules are defined here (not in types)
 */
const VALIDATION_CONSTRAINTS = {
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
 * Validation schema for creating storefront inventory
 * Accepts inventoryIds array (for batch creation), storefrontId, and optional quantity
 */
export const createStorefrontInventorySchema = Joi.object({
  inventoryIds: Joi.array()
    .items(objectId)
    .min(1)
    .required()
    .messages({
      "array.base": "inventoryIds must be an array",
      "array.min": "inventoryIds must contain at least one inventory ID",
      "any.required": "inventoryIds is required",
    }),

  storefrontId: objectId
    .required()
    .messages({
      "any.required": "Storefront ID is required",
      "string.empty": "Storefront ID is required",
    }),

  quantity: Joi.number()
    .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
    .default(STOREFRONT_INVENTORY_DEFAULTS.QUANTITY)
    .optional()
    .messages({
      "number.base": "Quantity must be a number",
      "number.min": "Quantity cannot be negative",
    }),
});

/**
 * Validation schema for updating storefront inventory
 */
export const updateStorefrontInventorySchema = Joi.object({
  [STOREFRONT_INVENTORY_FIELDS.QUANTITY]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
    .optional()
    .messages({
      "number.base": "Quantity must be a number",
      "number.min": "Quantity cannot be negative",
    }),

  [STOREFRONT_INVENTORY_FIELDS.IS_LOW_STOCK]: Joi.boolean().optional(),

  [STOREFRONT_INVENTORY_FIELDS.LAST_UPDATED]: Joi.date().optional(),
}).min(1); // At least one field must be provided

/**
 * Validation schema for updating storefront inventory quantity (with quantityChange)
 * Uses quantityChange: positive number = add, negative number = subtract
 */
export const updateStorefrontInventoryQuantitySchema = Joi.object({
  quantityChange: Joi.number()
    .required()
    .custom((value, helpers) => {
      if (value === 0) {
        return helpers.error("any.invalid");
      }
      if (!Number.isFinite(value)) {
        return helpers.error("number.base");
      }
      return value;
    })
    .messages({
      "any.required": "A valid non-zero numeric 'quantityChange' is required. Use positive number to add, negative number to subtract.",
      "any.invalid": "quantityChange cannot be zero. Use positive number to add, negative number to subtract.",
      "number.base": "quantityChange must be a valid number",
    }),

  reason: Joi.string()
    .trim()
    .max(500)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": "Reason cannot exceed 500 characters",
    }),
});

/**
 * Validation schema for query parameters (for GET requests)
 */
export const getStorefrontInventoryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  inventoryId: objectId.optional(),
  storefrontId: objectId.optional(),
  isLowStock: Joi.boolean().optional(),
  sortBy: Joi.string()
    .valid("quantity", "lastUpdated", "createdAt", "updatedAt")
    .default("lastUpdated")
    .optional(),
  sortOrder: Joi.string().valid("asc", "desc").default("desc").optional(),
});

/**
 * Validation middleware for creating storefront inventory
 */
export const validateCreateStorefrontInventory = (req, res, next) => {
  const { error, value } = createStorefrontInventorySchema.validate(req.body, {
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
 * Validation middleware for updating storefront inventory
 */
export const validateUpdateStorefrontInventory = (req, res, next) => {
  const { error, value } = updateStorefrontInventorySchema.validate(req.body, {
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
 * Validation middleware for updating storefront inventory quantity
 */
export const validateUpdateStorefrontInventoryQuantity = (req, res, next) => {
  const { error, value } = updateStorefrontInventoryQuantitySchema.validate(
    req.body,
    {
      abortEarly: false,
      stripUnknown: true,
    }
  );

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
export const validateGetStorefrontInventoryQuery = (req, res, next) => {
  const { error, value } = getStorefrontInventoryQuerySchema.validate(
    req.query,
    {
      abortEarly: false,
      stripUnknown: true,
    }
  );

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
  createStorefrontInventorySchema,
  updateStorefrontInventorySchema,
  updateStorefrontInventoryQuantitySchema,
  getStorefrontInventoryQuerySchema,
  validateCreateStorefrontInventory,
  validateUpdateStorefrontInventory,
  validateUpdateStorefrontInventoryQuantity,
  validateGetStorefrontInventoryQuery,
  VALIDATION_CONSTRAINTS,
};
