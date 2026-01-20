/**
 * Credit Persona Validators
 * Request validation schemas for credit persona endpoints
 * Uses types from types/creditPersona.types.js for field names and enums
 * All validation constraints/rules are defined here
 */

import Joi from "joi";
import {
  CREDIT_PERSONA_FIELDS,
  CREDIT_PERSONA_DEFAULTS,
} from "../types/creditPersona.types.js";

/**
 * Validation Constraints
 * All validation rules are defined here (not in types)
 */
const VALIDATION_CONSTRAINTS = {
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  PHONE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[+]?[\d\s\-()]+$/, // Allows digits, spaces, hyphens, parentheses, and optional +
  },
  BLACKLIST_REASON: {
    MAX_LENGTH: 500,
  },
};

/**
 * Validation schema for creating credit persona
 */
export const createCreditPersonaSchema = Joi.object({
  [CREDIT_PERSONA_FIELDS.NAME]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.NAME.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.NAME.MAX_LENGTH)
    .required()
    .messages({
      "string.empty": "Name is required",
      "string.min": `Name must be at least ${VALIDATION_CONSTRAINTS.NAME.MIN_LENGTH} character`,
      "string.max": `Name cannot exceed ${VALIDATION_CONSTRAINTS.NAME.MAX_LENGTH} characters`,
      "any.required": "Name is required",
    }),

  [CREDIT_PERSONA_FIELDS.PHONE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.PHONE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.PHONE.MAX_LENGTH)
    .pattern(VALIDATION_CONSTRAINTS.PHONE.PATTERN)
    .allow(null, "")
    .optional()
    .messages({
      "string.min": `Phone must be at least ${VALIDATION_CONSTRAINTS.PHONE.MIN_LENGTH} character`,
      "string.max": `Phone cannot exceed ${VALIDATION_CONSTRAINTS.PHONE.MAX_LENGTH} characters`,
      "string.pattern.base": "Phone contains invalid characters",
    }),
});

/**
 * Validation schema for updating credit persona
 */
export const updateCreditPersonaSchema = Joi.object({
  [CREDIT_PERSONA_FIELDS.NAME]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.NAME.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.NAME.MAX_LENGTH)
    .optional()
    .messages({
      "string.min": `Name must be at least ${VALIDATION_CONSTRAINTS.NAME.MIN_LENGTH} character`,
      "string.max": `Name cannot exceed ${VALIDATION_CONSTRAINTS.NAME.MAX_LENGTH} characters`,
    }),

  [CREDIT_PERSONA_FIELDS.PHONE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.PHONE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.PHONE.MAX_LENGTH)
    .pattern(VALIDATION_CONSTRAINTS.PHONE.PATTERN)
    .allow(null, "")
    .optional()
    .messages({
      "string.min": `Phone must be at least ${VALIDATION_CONSTRAINTS.PHONE.MIN_LENGTH} character`,
      "string.max": `Phone cannot exceed ${VALIDATION_CONSTRAINTS.PHONE.MAX_LENGTH} characters`,
      "string.pattern.base": "Phone contains invalid characters",
    }),

  [CREDIT_PERSONA_FIELDS.BLACKLIST]: Joi.boolean().optional(),

  [CREDIT_PERSONA_FIELDS.BLACKLIST_REASON]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.BLACKLIST_REASON.MAX_LENGTH)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": `Blacklist reason cannot exceed ${VALIDATION_CONSTRAINTS.BLACKLIST_REASON.MAX_LENGTH} characters`,
    }),

  [CREDIT_PERSONA_FIELDS.BLACKLIST_DATE]: Joi.date()
    .allow(null)
    .optional()
    .messages({
      "date.base": "Blacklist date must be a valid date",
    }),
})
  .custom((value, helpers) => {
    // Custom validation: blacklistReason is required if blacklist is true
    if (value[CREDIT_PERSONA_FIELDS.BLACKLIST] === true) {
      if (
        !value[CREDIT_PERSONA_FIELDS.BLACKLIST_REASON] ||
        value[CREDIT_PERSONA_FIELDS.BLACKLIST_REASON].trim() === ""
      ) {
        return helpers.error("custom.blacklistReasonRequired");
      }
      // If blacklist is true and blacklistDate is not provided, set it to current date
      if (!value[CREDIT_PERSONA_FIELDS.BLACKLIST_DATE]) {
        value[CREDIT_PERSONA_FIELDS.BLACKLIST_DATE] = new Date();
      }
    }
    // If blacklist is false, clear blacklistReason and blacklistDate
    if (value[CREDIT_PERSONA_FIELDS.BLACKLIST] === false) {
      value[CREDIT_PERSONA_FIELDS.BLACKLIST_REASON] = null;
      value[CREDIT_PERSONA_FIELDS.BLACKLIST_DATE] = null;
    }
    return value;
  }, "Blacklist validation")
  .messages({
    "custom.blacklistReasonRequired":
      "Blacklist reason is required when blacklist is true",
  })
  .min(1); // At least one field must be provided

/**
 * Validation middleware for creating credit persona
 */
export const validateCreateCreditPersona = (req, res, next) => {
  const { error, value } = createCreditPersonaSchema.validate(req.body, {
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
 * Validation middleware for updating credit persona
 */
export const validateUpdateCreditPersona = (req, res, next) => {
  const { error, value } = updateCreditPersonaSchema.validate(req.body, {
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
  createCreditPersonaSchema,
  updateCreditPersonaSchema,
  validateCreateCreditPersona,
  validateUpdateCreditPersona,
  VALIDATION_CONSTRAINTS,
};
