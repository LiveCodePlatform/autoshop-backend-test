/**
 * Social Media Sale Inventory Validators
 * Request validation schemas for social media sale inventory endpoints
 * Uses types from types/socialMediaSaleInventory.types.js for field names and enums
 * All validation constraints/rules are defined here
 */

import Joi from "joi";
import mongoose from "mongoose";
import {
  SOCIAL_MEDIA_SALE_INVENTORY_FIELDS,
  SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS,
} from "../types/socialMediaSaleInventory.types.js";

/**
 * Validation Constraints
 * All validation rules are defined here (not in types)
 */
export const VALIDATION_CONSTRAINTS = {
  QUANTITY: {
    MIN: 0,
  },
  SELLING_GUIDE_PROMPT: {
    MAX_LENGTH: 1000,
  },
  BUYING_GUIDE_PROMPT: {
    MAX_LENGTH: 1000,
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
 * Validation schema for creating social media sale inventory
 * Accepts inventoryIds array (for batch creation), and optional quantity, sellingGuidePrompt, buyingGuidePrompt
 */
export const validateCreateSocialMediaSaleInventory = (req, res, next) => {
  const schema = Joi.object({
    inventoryIds: Joi.array()
      .items(objectId)
      .min(1)
      .required()
      .messages({
        "array.base": "inventoryIds must be an array",
        "array.min": "inventoryIds must contain at least one inventory ID",
        "any.required": "inventoryIds is required",
      }),

    quantity: Joi.number()
      .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
      .default(SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS.QUANTITY)
      .optional()
      .messages({
        "number.base": "Quantity must be a number",
        "number.min": "Quantity cannot be negative",
      }),

    sellingGuidePrompt: Joi.string()
      .max(VALIDATION_CONSTRAINTS.SELLING_GUIDE_PROMPT.MAX_LENGTH)
      .default(SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS.SELLING_GUIDE_PROMPT)
      .optional()
      .allow("")
      .messages({
        "string.max": `Selling guide prompt cannot exceed ${VALIDATION_CONSTRAINTS.SELLING_GUIDE_PROMPT.MAX_LENGTH} characters`,
      }),

    buyingGuidePrompt: Joi.string()
      .max(VALIDATION_CONSTRAINTS.BUYING_GUIDE_PROMPT.MAX_LENGTH)
      .default(SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS.BUYING_GUIDE_PROMPT)
      .optional()
      .allow("")
      .messages({
        "string.max": `Buying guide prompt cannot exceed ${VALIDATION_CONSTRAINTS.BUYING_GUIDE_PROMPT.MAX_LENGTH} characters`,
      }),
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  req.validatedData = value;
  next();
};

/**
 * Validation schema for getting social media sale inventory (query params)
 */
export const validateGetSocialMediaSaleInventoryQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    inventoryId: objectId.optional(),
    isLowStock: Joi.boolean().optional(),
    search: Joi.string().optional(),
    sortBy: Joi.string()
      .valid("createdAt", "updatedAt", "quantity", "lastUpdated")
      .default("createdAt")
      .optional(),
    sortOrder: Joi.string().valid("asc", "desc").default("desc").optional(),
  });

  const { error, value } = schema.validate(req.query, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  req.validatedQuery = value;
  next();
};

/**
 * Validation schema for updating social media sale inventory quantity
 */
export const validateUpdateSocialMediaSaleInventoryQuantity = (req, res, next) => {
  const schema = Joi.object({
    quantityChange: Joi.number()
      .required()
      .custom((value, helpers) => {
        if (value === 0 || !Number.isFinite(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      })
      .messages({
        "any.required": "quantityChange is required",
        "any.invalid":
          "A valid non-zero numeric 'quantityChange' is required. Use positive number to add, negative number to subtract.",
        "number.base": "quantityChange must be a number",
      }),

    reason: Joi.string().max(500).optional().allow("").messages({
      "string.max": "Reason cannot exceed 500 characters",
    }),
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  req.validatedData = value;
  next();
};
