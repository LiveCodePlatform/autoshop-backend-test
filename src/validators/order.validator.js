/**
 * Order Validators
 * Request validation schemas for order endpoints
 * Uses types from types/order.types.js for field names and enums
 * All validation constraints/rules are defined here
 */

import Joi from "joi";
import mongoose from "mongoose";
import {
  ORDER_FIELDS,
  ORDER_DEFAULTS,
  ORDER_STATUS,
  PAYMENT_TYPE,
  PAYMENT_METHOD,
  getValidOrderStatuses,
  getValidPaymentTypes,
  getValidPaymentMethods,
} from "../types/order.types.js";

/**
 * Validation Constraints
 * All validation rules are defined here (not in types)
 */
const VALIDATION_CONSTRAINTS = {
  QUANTITY: {
    MIN: 1,
  },
  UNIT_PRICE: {
    MIN: 0,
  },
  SUB_TOTAL: {
    MIN: 0,
  },
  TAX: {
    MIN: 0,
  },
  DISCOUNT: {
    MIN: 0,
  },
  FINAL_AMOUNT: {
    MIN: 0,
  },
  PAID_AMOUNT: {
    MIN: 0,
  },
  EXTRA_CHANGE: {
    MIN: 0,
  },
  ORDERS_PRODUCTS: {
    MIN_LENGTH: 1,
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
 * Order Product Schema
 */
const orderProductSchema = Joi.object({
  [ORDER_FIELDS.INVENTORY_ID]: objectId.required().messages({
    "any.required": "Inventory ID is required",
    "string.empty": "Inventory ID is required",
    "any.invalid": "Inventory ID must be a valid ObjectId",
  }),

  [ORDER_FIELDS.QUANTITY]: Joi.number()
    .integer()
    .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
    .required()
    .messages({
      "number.base": "Quantity must be a number",
      "number.integer": "Quantity must be an integer",
      "number.min": `Quantity must be at least ${VALIDATION_CONSTRAINTS.QUANTITY.MIN}`,
      "any.required": "Quantity is required",
    }),

  [ORDER_FIELDS.UNIT_PRICE]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.UNIT_PRICE.MIN)
    .required()
    .messages({
      "number.base": "Unit price must be a number",
      "number.min": `Unit price cannot be negative`,
      "any.required": "Unit price is required",
    }),
});

/**
 * Validation schema for creating order
 */
export const createOrderSchema = Joi.object({
  [ORDER_FIELDS.STOREFRONT_ID]: objectId.required().messages({
    "any.required": "Storefront is required",
    "string.empty": "Storefront is required",
    "any.invalid": "Storefront ID must be a valid ObjectId",
  }),

  [ORDER_FIELDS.ORDERS_PRODUCTS]: Joi.array()
    .items(orderProductSchema)
    .min(VALIDATION_CONSTRAINTS.ORDERS_PRODUCTS.MIN_LENGTH)
    .required()
    .messages({
      "array.base": "Orders products must be an array",
      "array.min": `Order must have at least ${VALIDATION_CONSTRAINTS.ORDERS_PRODUCTS.MIN_LENGTH} product`,
      "any.required": "Orders products is required",
    }),

  [ORDER_FIELDS.CREDIT_PERSON_ID]: objectId
    .allow(null, "")
    .optional()
    .messages({
      "any.invalid": "Credit person ID must be a valid ObjectId",
    }),

  [ORDER_FIELDS.SUB_TOTAL]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.SUB_TOTAL.MIN)
    .allow(null)
    .optional()
    .messages({
      "number.base": "Subtotal must be a number",
      "number.min": `Subtotal cannot be negative`,
    }),

  [ORDER_FIELDS.TAX]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.TAX.MIN)
    .default(ORDER_DEFAULTS.TAX)
    .optional()
    .messages({
      "number.base": "Tax must be a number",
      "number.min": `Tax cannot be negative`,
    }),

  [ORDER_FIELDS.DISCOUNT]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.DISCOUNT.MIN)
    .default(ORDER_DEFAULTS.DISCOUNT)
    .optional()
    .messages({
      "number.base": "Discount must be a number",
      "number.min": `Discount cannot be negative`,
    }),

  [ORDER_FIELDS.FINAL_AMOUNT]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.FINAL_AMOUNT.MIN)
    .required()
    .messages({
      "number.base": "Final amount must be a number",
      "number.min": `Final amount cannot be negative`,
      "any.required": "Final amount is required",
    }),

  [ORDER_FIELDS.PAID_AMOUNT]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.PAID_AMOUNT.MIN)
    .required()
    .messages({
      "number.base": "Paid amount must be a number",
      "number.min": `Paid amount cannot be negative`,
      "any.required": "Paid amount is required",
    }),

  [ORDER_FIELDS.ORDER_STATUS]: Joi.string()
    .valid(...getValidOrderStatuses())
    .default(ORDER_DEFAULTS.ORDER_STATUS)
    .optional()
    .messages({
      "any.only": `Order status must be one of: ${getValidOrderStatuses().join(", ")}`,
    }),

  [ORDER_FIELDS.SOLD_BY]: objectId.required().messages({
    "any.required": "Sold by is required",
    "string.empty": "Sold by is required",
    "any.invalid": "Sold by must be a valid ObjectId",
  }),

  [ORDER_FIELDS.PAYMENT_TYPE]: Joi.string()
    .valid(...getValidPaymentTypes())
    .default(ORDER_DEFAULTS.PAYMENT_TYPE)
    .optional()
    .messages({
      "any.only": `Payment type must be one of: ${getValidPaymentTypes().join(", ")}`,
    }),

  [ORDER_FIELDS.PAYMENT_METHOD]: Joi.string()
    .valid(...getValidPaymentMethods())
    .default(ORDER_DEFAULTS.PAYMENT_METHOD)
    .optional()
    .messages({
      "any.only": `Payment method must be one of: ${getValidPaymentMethods().join(", ")}`,
    }),
})
  .custom((value, helpers) => {
    // Custom validation: If paymentType is "credit", creditPersonId should be provided
    if (
      value[ORDER_FIELDS.PAYMENT_TYPE] === PAYMENT_TYPE.CREDIT &&
      !value[ORDER_FIELDS.CREDIT_PERSON_ID]
    ) {
      return helpers.error("custom.creditPersonRequired");
    }
    return value;
  }, "Credit person validation")
  .messages({
    "custom.creditPersonRequired":
      "Credit person ID is required when payment type is credit",
  });

/**
 * Validation schema for updating order
 */
export const updateOrderSchema = Joi.object({
  [ORDER_FIELDS.ORDER_STATUS]: Joi.string()
    .valid(...getValidOrderStatuses())
    .optional()
    .messages({
      "any.only": `Order status must be one of: ${getValidOrderStatuses().join(", ")}`,
    }),

  [ORDER_FIELDS.CREDIT_PERSON_ID]: objectId
    .allow(null, "")
    .optional()
    .messages({
      "any.invalid": "Credit person ID must be a valid ObjectId",
    }),

  [ORDER_FIELDS.SUB_TOTAL]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.SUB_TOTAL.MIN)
    .allow(null)
    .optional()
    .messages({
      "number.base": "Subtotal must be a number",
      "number.min": `Subtotal cannot be negative`,
    }),

  [ORDER_FIELDS.TAX]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.TAX.MIN)
    .optional()
    .messages({
      "number.base": "Tax must be a number",
      "number.min": `Tax cannot be negative`,
    }),

  [ORDER_FIELDS.DISCOUNT]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.DISCOUNT.MIN)
    .optional()
    .messages({
      "number.base": "Discount must be a number",
      "number.min": `Discount cannot be negative`,
    }),

  [ORDER_FIELDS.FINAL_AMOUNT]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.FINAL_AMOUNT.MIN)
    .optional()
    .messages({
      "number.base": "Final amount must be a number",
      "number.min": `Final amount cannot be negative`,
    }),

  [ORDER_FIELDS.PAID_AMOUNT]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.PAID_AMOUNT.MIN)
    .optional()
    .messages({
      "number.base": "Paid amount must be a number",
      "number.min": `Paid amount cannot be negative`,
    }),

  [ORDER_FIELDS.PAYMENT_TYPE]: Joi.string()
    .valid(...getValidPaymentTypes())
    .optional()
    .messages({
      "any.only": `Payment type must be one of: ${getValidPaymentTypes().join(", ")}`,
    }),

  [ORDER_FIELDS.PAYMENT_METHOD]: Joi.string()
    .valid(...getValidPaymentMethods())
    .optional()
    .messages({
      "any.only": `Payment method must be one of: ${getValidPaymentMethods().join(", ")}`,
    }),
})
  .min(1) // At least one field must be provided
  .custom((value, helpers) => {
    // Custom validation: If paymentType is "credit", creditPersonId should be provided
    if (
      value[ORDER_FIELDS.PAYMENT_TYPE] === PAYMENT_TYPE.CREDIT &&
      !value[ORDER_FIELDS.CREDIT_PERSON_ID]
    ) {
      return helpers.error("custom.creditPersonRequired");
    }
    return value;
  }, "Credit person validation")
  .messages({
    "custom.creditPersonRequired":
      "Credit person ID is required when payment type is credit",
  });

/**
 * Validation middleware for creating order
 */
export const validateCreateOrder = (req, res, next) => {
  const { error, value } = createOrderSchema.validate(req.body, {
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
 * Validation middleware for updating order
 */
export const validateUpdateOrder = (req, res, next) => {
  const { error, value } = updateOrderSchema.validate(req.body, {
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
  createOrderSchema,
  updateOrderSchema,
  validateCreateOrder,
  validateUpdateOrder,
  VALIDATION_CONSTRAINTS,
};
