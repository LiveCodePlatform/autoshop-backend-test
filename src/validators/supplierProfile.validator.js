/**
 * Supplier Profile Validators
 * Request validation schemas for supplier profile endpoints
 * Uses types from types/supplierProfile.types.js for field names and enums
 * All validation constraints/rules are defined here
 */

import Joi from "joi";
import {
  SUPPLIER_PROFILE_FIELDS,
  SUPPLIER_PROFILE_DEFAULTS,
} from "../types/supplierProfile.types.js";

/**
 * Validation Constraints
 * All validation rules are defined here (not in types)
 */
const VALIDATION_CONSTRAINTS = {
  SUPPLIER_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  CONTACT_NUMBER: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[+]?[\d\s\-()]+$/, // Allows digits, spaces, hyphens, parentheses, and optional +
  },
};

/**
 * Validation schema for creating supplier profile
 */
export const createSupplierProfileSchema = Joi.object({
  [SUPPLIER_PROFILE_FIELDS.SUPPLIER_NAME]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.SUPPLIER_NAME.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.SUPPLIER_NAME.MAX_LENGTH)
    .required()
    .messages({
      "string.empty": "Supplier name is required",
      "string.min": `Supplier name must be at least ${VALIDATION_CONSTRAINTS.SUPPLIER_NAME.MIN_LENGTH} character`,
      "string.max": `Supplier name cannot exceed ${VALIDATION_CONSTRAINTS.SUPPLIER_NAME.MAX_LENGTH} characters`,
      "any.required": "Supplier name is required",
    }),

  [SUPPLIER_PROFILE_FIELDS.CONTACT_NUMBER]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.CONTACT_NUMBER.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.CONTACT_NUMBER.MAX_LENGTH)
    .pattern(VALIDATION_CONSTRAINTS.CONTACT_NUMBER.PATTERN)
    .required()
    .messages({
      "string.empty": "Contact number is required",
      "string.min": `Contact number must be at least ${VALIDATION_CONSTRAINTS.CONTACT_NUMBER.MIN_LENGTH} character`,
      "string.max": `Contact number cannot exceed ${VALIDATION_CONSTRAINTS.CONTACT_NUMBER.MAX_LENGTH} characters`,
      "string.pattern.base": "Contact number contains invalid characters",
      "any.required": "Contact number is required",
    }),
});

/**
 * Validation schema for updating supplier profile
 */
export const updateSupplierProfileSchema = Joi.object({
  [SUPPLIER_PROFILE_FIELDS.SUPPLIER_NAME]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.SUPPLIER_NAME.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.SUPPLIER_NAME.MAX_LENGTH)
    .optional()
    .messages({
      "string.min": `Supplier name must be at least ${VALIDATION_CONSTRAINTS.SUPPLIER_NAME.MIN_LENGTH} character`,
      "string.max": `Supplier name cannot exceed ${VALIDATION_CONSTRAINTS.SUPPLIER_NAME.MAX_LENGTH} characters`,
    }),

  [SUPPLIER_PROFILE_FIELDS.CONTACT_NUMBER]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.CONTACT_NUMBER.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.CONTACT_NUMBER.MAX_LENGTH)
    .pattern(VALIDATION_CONSTRAINTS.CONTACT_NUMBER.PATTERN)
    .optional()
    .messages({
      "string.min": `Contact number must be at least ${VALIDATION_CONSTRAINTS.CONTACT_NUMBER.MIN_LENGTH} character`,
      "string.max": `Contact number cannot exceed ${VALIDATION_CONSTRAINTS.CONTACT_NUMBER.MAX_LENGTH} characters`,
      "string.pattern.base": "Contact number contains invalid characters",
    }),
}).min(1); // At least one field must be provided

/**
 * Validation middleware for creating supplier profile
 */
export const validateCreateSupplierProfile = (req, res, next) => {
  const { error, value } = createSupplierProfileSchema.validate(req.body, {
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
 * Validation middleware for updating supplier profile
 */
export const validateUpdateSupplierProfile = (req, res, next) => {
  const { error, value } = updateSupplierProfileSchema.validate(req.body, {
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
  createSupplierProfileSchema,
  updateSupplierProfileSchema,
  validateCreateSupplierProfile,
  validateUpdateSupplierProfile,
  VALIDATION_CONSTRAINTS,
};
