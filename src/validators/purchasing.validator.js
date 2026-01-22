/**
 * Purchasing Validators
 * Request validation schemas for purchasing endpoints
 * Uses types from types/purchasing.types.js for field names and enums
 * All validation constraints/rules are defined here
 */

import Joi from "joi";
import mongoose from "mongoose";
import {
  PURCHASING_FIELDS,
  PRODUCT_FIELDS,
  PURCHASING_DEFAULTS,
  PRODUCT_DEFAULTS,
  PURCHASING_STATUS,
  PRODUCT_STATUS,
} from "../types/purchasing.types.js";

/**
 * Validation Constraints
 * All validation rules are defined here (not in types)
 */
const VALIDATION_CONSTRAINTS = {
  PO_NUMBER: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^PO-\d{4}-\d{2}-\d{2}-\d{6}$/, // Format: PO-YYYY-MM-DD-NNNNNN
  },
  NOTE: {
    MAX_LENGTH: 1000,
  },
  TOTAL_AMOUNT: {
    MIN: 0,
  },
  PRODUCT_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  PRODUCT_CODE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  BUYING_PRICE: {
    MIN: 0,
  },
  PURCHASE_QUANTITY: {
    MIN: 1,
  },
  RECEIVED_QUANTITY: {
    MIN: 0,
  },
};

/**
 * Product schema validation for CREATE request (for products array)
 * Only requires inventoryId and purchaseQuantity - other fields are fetched from inventory
 */
const createProductSchema = Joi.object({
  [PRODUCT_FIELDS.INVENTORY_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .required()
    .messages({
      "string.empty": "Inventory ID is required",
      "any.invalid": "Inventory ID must be a valid ObjectId",
      "any.required": "Inventory ID is required",
    }),

  [PRODUCT_FIELDS.PURCHASE_QUANTITY]: Joi.number()
    .integer()
    .min(VALIDATION_CONSTRAINTS.PURCHASE_QUANTITY.MIN)
    .required()
    .messages({
      "number.base": "Purchase quantity must be a number",
      "number.integer": "Purchase quantity must be an integer",
      "number.min": `Purchase quantity must be at least ${VALIDATION_CONSTRAINTS.PURCHASE_QUANTITY.MIN}`,
      "any.required": "Purchase quantity is required",
    }),

  [PRODUCT_FIELDS.PRODUCT_STATUS]: Joi.string()
    .valid(...Object.values(PRODUCT_STATUS))
    .optional()
    .messages({
      "any.only": `Product status must be one of: ${Object.values(PRODUCT_STATUS).join(", ")}`,
    }),

  // These fields are auto-populated from inventory, so they're optional in the request
  [PRODUCT_FIELDS.PRODUCT_NAME]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.PRODUCT_NAME.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.PRODUCT_NAME.MAX_LENGTH)
    .optional()
    .messages({
      "string.min": `Product name must be at least ${VALIDATION_CONSTRAINTS.PRODUCT_NAME.MIN_LENGTH} character`,
      "string.max": `Product name cannot exceed ${VALIDATION_CONSTRAINTS.PRODUCT_NAME.MAX_LENGTH} characters`,
    }),

  [PRODUCT_FIELDS.BUYING_PRICE]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.BUYING_PRICE.MIN)
    .optional()
    .messages({
      "number.base": "Buying price must be a number",
      "number.min": `Buying price cannot be negative`,
    }),

  [PRODUCT_FIELDS.PRODUCT_CODE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.PRODUCT_CODE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.PRODUCT_CODE.MAX_LENGTH)
    .optional()
    .messages({
      "string.min": `Product code must be at least ${VALIDATION_CONSTRAINTS.PRODUCT_CODE.MIN_LENGTH} character`,
      "string.max": `Product code cannot exceed ${VALIDATION_CONSTRAINTS.PRODUCT_CODE.MAX_LENGTH} characters`,
    }),

  [PRODUCT_FIELDS.RECEIVED_QUANTITY]: Joi.number()
    .integer()
    .min(VALIDATION_CONSTRAINTS.RECEIVED_QUANTITY.MIN)
    .optional()
    .messages({
      "number.base": "Received quantity must be a number",
      "number.integer": "Received quantity must be an integer",
      "number.min": `Received quantity cannot be negative`,
    }),
});

/**
 * Product schema validation for UPDATE request (full product object)
 */
const productSchema = Joi.object({
  [PRODUCT_FIELDS.INVENTORY_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .required()
    .messages({
      "string.empty": "Inventory ID is required",
      "any.invalid": "Inventory ID must be a valid ObjectId",
      "any.required": "Inventory ID is required",
    }),

  [PRODUCT_FIELDS.PRODUCT_STATUS]: Joi.string()
    .valid(...Object.values(PRODUCT_STATUS))
    .optional()
    .messages({
      "any.only": `Product status must be one of: ${Object.values(PRODUCT_STATUS).join(", ")}`,
    }),

  [PRODUCT_FIELDS.PRODUCT_NAME]: Joi.string()
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

  [PRODUCT_FIELDS.BUYING_PRICE]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.BUYING_PRICE.MIN)
    .required()
    .messages({
      "number.base": "Buying price must be a number",
      "number.min": `Buying price cannot be negative`,
      "any.required": "Buying price is required",
    }),

  [PRODUCT_FIELDS.PURCHASE_QUANTITY]: Joi.number()
    .integer()
    .min(VALIDATION_CONSTRAINTS.PURCHASE_QUANTITY.MIN)
    .required()
    .messages({
      "number.base": "Purchase quantity must be a number",
      "number.integer": "Purchase quantity must be an integer",
      "number.min": `Purchase quantity must be at least ${VALIDATION_CONSTRAINTS.PURCHASE_QUANTITY.MIN}`,
      "any.required": "Purchase quantity is required",
    }),

  [PRODUCT_FIELDS.RECEIVED_QUANTITY]: Joi.number()
    .integer()
    .min(VALIDATION_CONSTRAINTS.RECEIVED_QUANTITY.MIN)
    .optional()
    .messages({
      "number.base": "Received quantity must be a number",
      "number.integer": "Received quantity must be an integer",
      "number.min": `Received quantity cannot be negative`,
    }),

  [PRODUCT_FIELDS.PRODUCT_CODE]: Joi.string()
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
});

/**
 * Validation schema for creating purchasing
 */
export const createPurchasingSchema = Joi.object({
  [PURCHASING_FIELDS.PO_NUMBER]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.PO_NUMBER.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.PO_NUMBER.MAX_LENGTH)
    .pattern(VALIDATION_CONSTRAINTS.PO_NUMBER.PATTERN)
    .uppercase()
    .optional()
    .messages({
      "string.min": `PO number must be at least ${VALIDATION_CONSTRAINTS.PO_NUMBER.MIN_LENGTH} character`,
      "string.max": `PO number cannot exceed ${VALIDATION_CONSTRAINTS.PO_NUMBER.MAX_LENGTH} characters`,
      "string.pattern.base": "PO number must follow format: PO-YYYY-MM-DD-NNNNNN",
    }),

  [PURCHASING_FIELDS.SUPPLIER_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .required()
    .messages({
      "string.empty": "Supplier ID is required",
      "any.invalid": "Supplier ID must be a valid ObjectId",
      "any.required": "Supplier ID is required",
    }),

  [PURCHASING_FIELDS.PRODUCTS]: Joi.array()
    .items(createProductSchema)
    .min(1)
    .required()
    .messages({
      "array.base": "Products must be an array",
      "array.min": "At least one product is required",
      "any.required": "Products are required",
    }),

  [PURCHASING_FIELDS.STATUS]: Joi.string()
    .valid(...Object.values(PURCHASING_STATUS))
    .optional()
    .messages({
      "any.only": `Status must be one of: ${Object.values(PURCHASING_STATUS).join(", ")}`,
    }),

  [PURCHASING_FIELDS.NOTE]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.NOTE.MAX_LENGTH)
    .default(PURCHASING_DEFAULTS.NOTE)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": `Note cannot exceed ${VALIDATION_CONSTRAINTS.NOTE.MAX_LENGTH} characters`,
    }),

  // totalAmount is now automatically calculated from products, so it's optional
  // If provided, it will be ignored and recalculated
  [PURCHASING_FIELDS.TOTAL_AMOUNT]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.TOTAL_AMOUNT.MIN)
    .optional()
    .messages({
      "number.base": "Total amount must be a number",
      "number.min": `Total amount cannot be negative`,
    }),

  // purchasedBy comes from authenticated user (req.user), not from request body
  [PURCHASING_FIELDS.PURCHASED_BY]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .optional()
    .messages({
      "any.invalid": "Purchased by must be a valid ObjectId",
    }),
});

/**
 * Validation schema for updating purchasing
 */
export const updatePurchasingSchema = Joi.object({
  [PURCHASING_FIELDS.PO_NUMBER]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.PO_NUMBER.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.PO_NUMBER.MAX_LENGTH)
    .pattern(VALIDATION_CONSTRAINTS.PO_NUMBER.PATTERN)
    .uppercase()
    .optional()
    .messages({
      "string.min": `PO number must be at least ${VALIDATION_CONSTRAINTS.PO_NUMBER.MIN_LENGTH} character`,
      "string.max": `PO number cannot exceed ${VALIDATION_CONSTRAINTS.PO_NUMBER.MAX_LENGTH} characters`,
      "string.pattern.base": "PO number must follow format: PO-YYYY-MM-DD-NNNNNN",
    }),

  [PURCHASING_FIELDS.SUPPLIER_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .optional()
    .messages({
      "any.invalid": "Supplier ID must be a valid ObjectId",
    }),

  [PURCHASING_FIELDS.PRODUCTS]: Joi.array()
    .items(productSchema)
    .min(1)
    .optional()
    .messages({
      "array.base": "Products must be an array",
      "array.min": "At least one product is required",
    }),

  [PURCHASING_FIELDS.STATUS]: Joi.string()
    .valid(...Object.values(PURCHASING_STATUS))
    .optional()
    .messages({
      "any.only": `Status must be one of: ${Object.values(PURCHASING_STATUS).join(", ")}`,
    }),

  [PURCHASING_FIELDS.NOTE]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.NOTE.MAX_LENGTH)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": `Note cannot exceed ${VALIDATION_CONSTRAINTS.NOTE.MAX_LENGTH} characters`,
    }),

  [PURCHASING_FIELDS.TOTAL_AMOUNT]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.TOTAL_AMOUNT.MIN)
    .optional()
    .messages({
      "number.base": "Total amount must be a number",
      "number.min": `Total amount cannot be negative`,
    }),

  [PURCHASING_FIELDS.PURCHASED_BY]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .optional()
    .messages({
      "any.invalid": "Purchased by must be a valid ObjectId",
    }),
})
  .custom((value, helpers) => {
    // Custom validation: If products or totalAmount are updated, validate they match
    if (value[PURCHASING_FIELDS.PRODUCTS] && value[PURCHASING_FIELDS.TOTAL_AMOUNT]) {
      const calculatedTotal = value[PURCHASING_FIELDS.PRODUCTS].reduce(
        (sum, product) => {
          const productTotal =
            (product[PRODUCT_FIELDS.BUYING_PRICE] || 0) *
            (product[PRODUCT_FIELDS.PURCHASE_QUANTITY] || 0);
          return sum + productTotal;
        },
        0
      );

      // Allow small floating point differences (0.01)
      if (Math.abs(calculatedTotal - value[PURCHASING_FIELDS.TOTAL_AMOUNT]) > 0.01) {
        return helpers.error("custom.totalAmountMismatch");
      }
    }
    return value;
  }, "Total amount validation")
  .messages({
    "custom.totalAmountMismatch":
      "Total amount must match the sum of all products (buyingPrice * purchaseQuantity)",
  })
  .min(1); // At least one field must be provided

/**
 * Validation middleware for creating purchasing
 */
export const validateCreatePurchasing = (req, res, next) => {
  const { error, value } = createPurchasingSchema.validate(req.body, {
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
 * Validation middleware for updating purchasing
 */
export const validateUpdatePurchasing = (req, res, next) => {
  const { error, value } = updatePurchasingSchema.validate(req.body, {
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
  createPurchasingSchema,
  updatePurchasingSchema,
  validateCreatePurchasing,
  validateUpdatePurchasing,
  VALIDATION_CONSTRAINTS,
};
