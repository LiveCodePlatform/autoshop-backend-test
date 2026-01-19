/**
 * Inventory Validators
 * Request validation schemas for inventory endpoints
 * Uses types from types/inventory.types.js for field names and enums
 * All validation constraints/rules are defined here
 */

import Joi from "joi";
import {
  INVENTORY_STATUS,
  UNIT_OF_MEASURE,
  INVENTORY_FIELDS,
  INVENTORY_DEFAULTS,
  getValidStatuses,
  getValidUnitsOfMeasure,
} from "../types/inventory.types.js";

/**
 * Validation Constraints
 * All validation rules are defined here (not in types)
 */
const VALIDATION_CONSTRAINTS = {
  PRODUCT_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  PRODUCT_CODE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  SALE_CODE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  SKU: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  BARCODE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  CATEGORY: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  SUB_CATEGORY: {
    MAX_LENGTH: 100,
  },
  BRAND: {
    MAX_LENGTH: 100,
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000,
  },
  BUYING_PRICE: {
    MIN: 0,
  },
  SELLING_PRICE: {
    MIN: 0,
  },
  REORDER_POINT: {
    MIN: 0,
  },
  REORDER_QUANTITY: {
    MIN: 0,
  },
  TAX_RATE: {
    MIN: 0,
    MAX: 100,
  },
};

/**
 * Validation schema for creating inventory
 */
export const createInventorySchema = Joi.object({
  [INVENTORY_FIELDS.PRODUCT_NAME]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.PRODUCT_NAME.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.PRODUCT_NAME.MAX_LENGTH)
    .required()
    .messages({
      "string.empty": "Product name is required",
      "string.min": `Product name must be at least ${VALIDATION_CONSTRAINTS.PRODUCT_NAME.MIN_LENGTH} character`,
      "string.max": `Product name cannot exceed ${VALIDATION_CONSTRAINTS.PRODUCT_NAME.MAX_LENGTH} characters`,
      "any.required": "Product name is required",
    }),

  [INVENTORY_FIELDS.PRODUCT_CODE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.PRODUCT_CODE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.PRODUCT_CODE.MAX_LENGTH)
    .required()
    .messages({
      "string.empty": "Product code is required",
      "string.min": `Product code must be at least ${VALIDATION_CONSTRAINTS.PRODUCT_CODE.MIN_LENGTH} character`,
      "string.max": `Product code cannot exceed ${VALIDATION_CONSTRAINTS.PRODUCT_CODE.MAX_LENGTH} characters`,
      "any.required": "Product code is required",
    }),

  [INVENTORY_FIELDS.SALE_CODE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.SALE_CODE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.SALE_CODE.MAX_LENGTH)
    .uppercase()
    .allow(null, "")
    .optional(),

  [INVENTORY_FIELDS.SKU]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.SKU.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.SKU.MAX_LENGTH)
    .uppercase()
    .allow(null, "")
    .optional(),

  [INVENTORY_FIELDS.BARCODE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.BARCODE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.BARCODE.MAX_LENGTH)
    .allow(null, "")
    .optional(),

  [INVENTORY_FIELDS.CATEGORY]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.CATEGORY.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.CATEGORY.MAX_LENGTH)
    .default(INVENTORY_DEFAULTS.CATEGORY)
    .messages({
      "string.empty": "Category is required",
      "any.required": "Category is required",
    }),

  [INVENTORY_FIELDS.SUB_CATEGORY]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.SUB_CATEGORY.MAX_LENGTH)
    .default(INVENTORY_DEFAULTS.SUB_CATEGORY)
    .allow(null, "")
    .optional(),

  [INVENTORY_FIELDS.BRAND]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.BRAND.MAX_LENGTH)
    .default(INVENTORY_DEFAULTS.BRAND)
    .allow(null, "")
    .optional(),

  [INVENTORY_FIELDS.DESCRIPTION]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH)
    .default(INVENTORY_DEFAULTS.DESCRIPTION)
    .allow(null, "")
    .optional(),

  [INVENTORY_FIELDS.BUYING_PRICE]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.BUYING_PRICE.MIN)
    .required()
    .messages({
      "number.base": "Buying price must be a number",
      "number.min": `Buying price cannot be negative`,
      "any.required": "Buying price is required",
    }),

  [INVENTORY_FIELDS.SELLING_PRICE]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.SELLING_PRICE.MIN)
    .required()
    .messages({
      "number.base": "Selling price must be a number",
      "number.min": `Selling price cannot be negative`,
      "any.required": "Selling price is required",
    }),

  [INVENTORY_FIELDS.UNIT_OF_MEASURE]: Joi.string()
    .valid(...getValidUnitsOfMeasure())
    .default(INVENTORY_DEFAULTS.UNIT_OF_MEASURE)
    .messages({
      "any.only": `Unit of measure must be one of: ${getValidUnitsOfMeasure().join(
        ", "
      )}`,
      "any.required": "Unit of measure is required",
    }),

  [INVENTORY_FIELDS.REORDER_POINT]: Joi.number()
    .integer()
    .min(VALIDATION_CONSTRAINTS.REORDER_POINT.MIN)
    .default(INVENTORY_DEFAULTS.REORDER_POINT)
    .optional(),

  [INVENTORY_FIELDS.REORDER_QUANTITY]: Joi.number()
    .integer()
    .min(VALIDATION_CONSTRAINTS.REORDER_QUANTITY.MIN)
    .default(INVENTORY_DEFAULTS.REORDER_QUANTITY)
    .optional(),

  [INVENTORY_FIELDS.TAX_RATE]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.TAX_RATE.MIN)
    .max(VALIDATION_CONSTRAINTS.TAX_RATE.MAX)
    .default(INVENTORY_DEFAULTS.TAX_RATE)
    .optional(),

  [INVENTORY_FIELDS.STATUS]: Joi.string()
    .valid(...getValidStatuses())
    .default(INVENTORY_DEFAULTS.STATUS)
    .optional(),

  [INVENTORY_FIELDS.TAGS]: Joi.array()
    .items(Joi.string().trim())
    .default(INVENTORY_DEFAULTS.TAGS)
    .optional(),
})
  .custom((value, helpers) => {
    // Custom validation: sellingPrice >= buyingPrice
    if (
      value[INVENTORY_FIELDS.SELLING_PRICE] <
      value[INVENTORY_FIELDS.BUYING_PRICE]
    ) {
      return helpers.error("custom.sellingPriceGreaterThanBuyingPrice");
    }
    return value;
  }, "Selling price validation")
  .messages({
    "custom.sellingPriceGreaterThanBuyingPrice":
      "Selling price should be greater than or equal to buying price",
  });

/**
 * Validation schema for updating inventory
 */
export const updateInventorySchema = Joi.object({
  [INVENTORY_FIELDS.PRODUCT_NAME]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.PRODUCT_NAME.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.PRODUCT_NAME.MAX_LENGTH)
    .optional(),

  [INVENTORY_FIELDS.PRODUCT_CODE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.PRODUCT_CODE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.PRODUCT_CODE.MAX_LENGTH)
    .optional(),

  [INVENTORY_FIELDS.SALE_CODE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.SALE_CODE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.SALE_CODE.MAX_LENGTH)
    .uppercase()
    .allow(null, "")
    .optional(),

  [INVENTORY_FIELDS.SKU]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.SKU.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.SKU.MAX_LENGTH)
    .uppercase()
    .allow(null, "")
    .optional(),

  [INVENTORY_FIELDS.BARCODE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.BARCODE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.BARCODE.MAX_LENGTH)
    .allow(null, "")
    .optional(),

  [INVENTORY_FIELDS.CATEGORY]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.CATEGORY.MAX_LENGTH)
    .optional(),

  [INVENTORY_FIELDS.SUB_CATEGORY]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.SUB_CATEGORY.MAX_LENGTH)
    .allow(null, "")
    .optional(),

  [INVENTORY_FIELDS.BRAND]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.BRAND.MAX_LENGTH)
    .allow(null, "")
    .optional(),

  [INVENTORY_FIELDS.DESCRIPTION]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH)
    .allow(null, "")
    .optional(),

  [INVENTORY_FIELDS.BUYING_PRICE]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.BUYING_PRICE.MIN)
    .optional(),

  [INVENTORY_FIELDS.SELLING_PRICE]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.SELLING_PRICE.MIN)
    .optional(),

  [INVENTORY_FIELDS.UNIT_OF_MEASURE]: Joi.string()
    .valid(...getValidUnitsOfMeasure())
    .optional(),

  [INVENTORY_FIELDS.REORDER_POINT]: Joi.number()
    .integer()
    .min(VALIDATION_CONSTRAINTS.REORDER_POINT.MIN)
    .optional(),

  [INVENTORY_FIELDS.REORDER_QUANTITY]: Joi.number()
    .integer()
    .min(VALIDATION_CONSTRAINTS.REORDER_QUANTITY.MIN)
    .optional(),

  [INVENTORY_FIELDS.TAX_RATE]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.TAX_RATE.MIN)
    .max(VALIDATION_CONSTRAINTS.TAX_RATE.MAX)
    .optional(),

  [INVENTORY_FIELDS.STATUS]: Joi.string()
    .valid(...getValidStatuses())
    .optional(),

  [INVENTORY_FIELDS.TAGS]: Joi.array().items(Joi.string().trim()).optional(),
}).min(1); // At least one field must be provided

/**
 * Validation middleware for creating inventory
 */
export const validateCreateInventory = (req, res, next) => {
  const { error, value } = createInventorySchema.validate(req.body, {
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
 * Validation middleware for updating inventory
 */
export const validateUpdateInventory = (req, res, next) => {
  const { error, value } = updateInventorySchema.validate(req.body, {
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

// Export constraints for model use if needed (optional)
export { VALIDATION_CONSTRAINTS };

export default {
  createInventorySchema,
  updateInventorySchema,
  validateCreateInventory,
  validateUpdateInventory,
  VALIDATION_CONSTRAINTS,
};
