/**
 * Warehouse Inventory Validators
 * Request validation schemas for warehouse inventory endpoints
 * Uses types from types/warehouseInventory.types.js for field names and enums
 * All validation constraints/rules are defined here
 */

import Joi from "joi";
import mongoose from "mongoose";
import {
  WAREHOUSE_INVENTORY_FIELDS,
  WAREHOUSE_INVENTORY_DEFAULTS,
} from "../types/warehouseInventory.types.js";

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
 * Validation schema for creating warehouse inventory
 * Accepts inventoryIds array (for batch creation), warehouseId, and optional quantity
 */
export const createWarehouseInventorySchema = Joi.object({
  inventoryIds: Joi.array()
    .items(objectId)
    .min(1)
    .required()
    .messages({
      "array.base": "inventoryIds must be an array",
      "array.min": "inventoryIds must contain at least one inventory ID",
      "any.required": "inventoryIds is required",
    }),

  warehouseId: objectId
    .required()
    .messages({
      "any.required": "Warehouse ID is required",
      "string.empty": "Warehouse ID is required",
    }),

  quantity: Joi.number()
    .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
    .default(WAREHOUSE_INVENTORY_DEFAULTS.QUANTITY)
    .optional()
    .messages({
      "number.base": "Quantity must be a number",
      "number.min": "Quantity cannot be negative",
    }),
});

/**
 * Validation schema for updating warehouse inventory
 */
export const updateWarehouseInventorySchema = Joi.object({
  [WAREHOUSE_INVENTORY_FIELDS.QUANTITY]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
    .optional()
    .messages({
      "number.base": "Quantity must be a number",
      "number.min": "Quantity cannot be negative",
    }),

  [WAREHOUSE_INVENTORY_FIELDS.IS_LOW_STOCK]: Joi.boolean().optional(),

  [WAREHOUSE_INVENTORY_FIELDS.LAST_UPDATED]: Joi.date().optional(),
}).min(1); // At least one field must be provided

/**
 * Validation schema for updating warehouse inventory quantity (with quantityChange)
 * Uses quantityChange: positive number = add, negative number = subtract
 */
export const updateWarehouseInventoryQuantitySchema = Joi.object({
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
export const getWarehouseInventoryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  inventoryId: objectId.optional(),
  warehouseId: objectId.optional(),
  isLowStock: Joi.boolean().optional(),
  sortBy: Joi.string()
    .valid("quantity", "lastUpdated", "createdAt", "updatedAt")
    .default("lastUpdated")
    .optional(),
  sortOrder: Joi.string().valid("asc", "desc").default("desc").optional(),
});

/**
 * Validation middleware for creating warehouse inventory
 */
export const validateCreateWarehouseInventory = (req, res, next) => {
  const { error, value } = createWarehouseInventorySchema.validate(req.body, {
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
 * Validation middleware for updating warehouse inventory
 */
export const validateUpdateWarehouseInventory = (req, res, next) => {
  const { error, value } = updateWarehouseInventorySchema.validate(req.body, {
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
 * Validation middleware for updating warehouse inventory quantity
 */
export const validateUpdateWarehouseInventoryQuantity = (req, res, next) => {
  const { error, value } = updateWarehouseInventoryQuantitySchema.validate(
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
export const validateGetWarehouseInventoryQuery = (req, res, next) => {
  const { error, value } = getWarehouseInventoryQuerySchema.validate(
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
  createWarehouseInventorySchema,
  updateWarehouseInventorySchema,
  updateWarehouseInventoryQuantitySchema,
  getWarehouseInventoryQuerySchema,
  validateCreateWarehouseInventory,
  validateUpdateWarehouseInventory,
  validateUpdateWarehouseInventoryQuantity,
  validateGetWarehouseInventoryQuery,
  VALIDATION_CONSTRAINTS,
};
