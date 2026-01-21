/**
 * Credit Record Validators
 * Request validation schemas for credit record endpoints
 * Uses types from types/creditRecord.types.js for field names and enums
 * All validation constraints/rules are defined here
 */

import Joi from "joi";
import mongoose from "mongoose";
import {
  CREDIT_RECORD_FIELDS,
  CREDIT_RECORD_DEFAULTS,
  PAYMENT_METHOD,
  getValidPaymentMethods,
} from "../types/creditRecord.types.js";

/**
 * Validation Constraints
 * All validation rules are defined here (not in types)
 */
const VALIDATION_CONSTRAINTS = {
  PAID_AMOUNT: {
    MIN: 0,
  },
  NOTES: {
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
 * Validation schema for creating credit record
 */
export const createCreditRecordSchema = Joi.object({
  [CREDIT_RECORD_FIELDS.ORDER_ID]: objectId
    .required()
    .messages({
      "any.required": "Order ID is required",
      "string.empty": "Order ID is required",
      "any.invalid": "Order ID must be a valid ObjectId",
    }),

  [CREDIT_RECORD_FIELDS.CREDIT_PERSON_ID]: objectId
    .allow(null, "")
    .optional()
    .messages({
      "any.invalid": "Credit person ID must be a valid ObjectId",
    }),

  [CREDIT_RECORD_FIELDS.PAID_AMOUNT]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.PAID_AMOUNT.MIN)
    .required()
    .messages({
      "number.base": "Paid amount must be a number",
      "number.min": `Paid amount cannot be negative`,
      "any.required": "Paid amount is required",
    }),

  [CREDIT_RECORD_FIELDS.PAYMENT_DATE]: Joi.date()
    .optional()
    .messages({
      "date.base": "Payment date must be a valid date",
    }),

  [CREDIT_RECORD_FIELDS.PAYMENT_METHOD]: Joi.string()
    .valid(...getValidPaymentMethods())
    .default(CREDIT_RECORD_DEFAULTS.PAYMENT_METHOD)
    .optional()
    .messages({
      "any.only": `Payment method must be one of: ${getValidPaymentMethods().join(", ")}`,
    }),

  [CREDIT_RECORD_FIELDS.NOTES]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": `Notes cannot exceed ${VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH} characters`,
    }),

  [CREDIT_RECORD_FIELDS.ADDED_BY]: objectId
    .required()
    .messages({
      "any.required": "Added by is required",
      "string.empty": "Added by is required",
      "any.invalid": "Added by must be a valid ObjectId",
    }),
});

/**
 * Validation schema for updating credit record
 */
export const updateCreditRecordSchema = Joi.object({
  [CREDIT_RECORD_FIELDS.ORDER_ID]: objectId
    .optional()
    .messages({
      "any.invalid": "Order ID must be a valid ObjectId",
    }),

  [CREDIT_RECORD_FIELDS.CREDIT_PERSON_ID]: objectId
    .allow(null, "")
    .optional()
    .messages({
      "any.invalid": "Credit person ID must be a valid ObjectId",
    }),

  [CREDIT_RECORD_FIELDS.PAID_AMOUNT]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.PAID_AMOUNT.MIN)
    .optional()
    .messages({
      "number.base": "Paid amount must be a number",
      "number.min": `Paid amount cannot be negative`,
    }),

  [CREDIT_RECORD_FIELDS.PAYMENT_DATE]: Joi.date()
    .optional()
    .messages({
      "date.base": "Payment date must be a valid date",
    }),

  [CREDIT_RECORD_FIELDS.PAYMENT_METHOD]: Joi.string()
    .valid(...getValidPaymentMethods())
    .optional()
    .messages({
      "any.only": `Payment method must be one of: ${getValidPaymentMethods().join(", ")}`,
    }),

  [CREDIT_RECORD_FIELDS.NOTES]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": `Notes cannot exceed ${VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH} characters`,
    }),

  [CREDIT_RECORD_FIELDS.ADDED_BY]: objectId
    .optional()
    .messages({
      "any.invalid": "Added by must be a valid ObjectId",
    }),
}).min(1); // At least one field must be provided

/**
 * Validation middleware for creating credit record
 */
export const validateCreateCreditRecord = (req, res, next) => {
  const { error, value } = createCreditRecordSchema.validate(req.body, {
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
 * Validation middleware for updating credit record
 */
export const validateUpdateCreditRecord = (req, res, next) => {
  const { error, value } = updateCreditRecordSchema.validate(req.body, {
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
  createCreditRecordSchema,
  updateCreditRecordSchema,
  validateCreateCreditRecord,
  validateUpdateCreditRecord,
  VALIDATION_CONSTRAINTS,
};
