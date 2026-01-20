/**
 * Expense Validators
 * Request validation schemas for expense endpoints
 * Uses types from types/expense.types.js for field names and enums
 * All validation constraints/rules are defined here
 */

import Joi from "joi";
import {
  EXPENSE_FIELDS,
  EXPENSE_DEFAULTS,
} from "../types/expense.types.js";

/**
 * Validation Constraints
 * All validation rules are defined here (not in types)
 */
const VALIDATION_CONSTRAINTS = {
  CATEGORY: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  AMOUNT: {
    MIN: 0,
  },
  NOTES: {
    MAX_LENGTH: 1000,
  },
};

/**
 * Validation schema for creating expense
 */
export const createExpenseSchema = Joi.object({
  [EXPENSE_FIELDS.CATEGORY]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.CATEGORY.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.CATEGORY.MAX_LENGTH)
    .required()
    .messages({
      "string.empty": "Category is required",
      "string.min": `Category must be at least ${VALIDATION_CONSTRAINTS.CATEGORY.MIN_LENGTH} character`,
      "string.max": `Category cannot exceed ${VALIDATION_CONSTRAINTS.CATEGORY.MAX_LENGTH} characters`,
      "any.required": "Category is required",
    }),

  [EXPENSE_FIELDS.AMOUNT]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.AMOUNT.MIN)
    .required()
    .messages({
      "number.base": "Amount must be a number",
      "number.min": `Amount cannot be negative`,
      "any.required": "Amount is required",
    }),

  [EXPENSE_FIELDS.DATE]: Joi.date()
    .required()
    .messages({
      "date.base": "Date must be a valid date",
      "any.required": "Date is required",
    }),

  [EXPENSE_FIELDS.NOTES]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH)
    .default(EXPENSE_DEFAULTS.NOTES)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": `Notes cannot exceed ${VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH} characters`,
    }),

  [EXPENSE_FIELDS.LOCATION_ID]: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Location ID is required",
      "any.required": "Location is required",
    }),

  [EXPENSE_FIELDS.ADMIN_ID]: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Admin ID is required",
      "any.required": "Admin is required",
    }),
});

/**
 * Validation schema for updating expense
 */
export const updateExpenseSchema = Joi.object({
  [EXPENSE_FIELDS.CATEGORY]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.CATEGORY.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.CATEGORY.MAX_LENGTH)
    .optional()
    .messages({
      "string.min": `Category must be at least ${VALIDATION_CONSTRAINTS.CATEGORY.MIN_LENGTH} character`,
      "string.max": `Category cannot exceed ${VALIDATION_CONSTRAINTS.CATEGORY.MAX_LENGTH} characters`,
    }),

  [EXPENSE_FIELDS.AMOUNT]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.AMOUNT.MIN)
    .optional()
    .messages({
      "number.base": "Amount must be a number",
      "number.min": `Amount cannot be negative`,
    }),

  [EXPENSE_FIELDS.DATE]: Joi.date()
    .optional()
    .messages({
      "date.base": "Date must be a valid date",
    }),

  [EXPENSE_FIELDS.NOTES]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": `Notes cannot exceed ${VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH} characters`,
    }),

  [EXPENSE_FIELDS.LOCATION_ID]: Joi.string()
    .trim()
    .optional(),

  [EXPENSE_FIELDS.ADMIN_ID]: Joi.string()
    .trim()
    .optional(),
}).min(1); // At least one field must be provided

/**
 * Validation middleware for creating expense
 */
export const validateCreateExpense = (req, res, next) => {
  const { error, value } = createExpenseSchema.validate(req.body, {
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
 * Validation middleware for updating expense
 */
export const validateUpdateExpense = (req, res, next) => {
  const { error, value } = updateExpenseSchema.validate(req.body, {
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
  createExpenseSchema,
  updateExpenseSchema,
  validateCreateExpense,
  validateUpdateExpense,
  VALIDATION_CONSTRAINTS,
};
