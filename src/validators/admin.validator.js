/**
 * Admin Validators
 * Request validation schemas for admin endpoints
 * Uses types from types/admin.types.js for field names and enums
 * All validation constraints/rules are defined here
 */

import Joi from "joi";
import {
  ADMIN_ROLE,
  ADMIN_FIELDS,
  ADMIN_DEFAULTS,
  getValidRoles,
} from "../types/admin.types.js";

/**
 * Validation Constraints
 * All validation rules are defined here (not in types)
 */
const VALIDATION_CONSTRAINTS = {
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 100,
  },
};

/**
 * Validation schema for creating admin (signup)
 */
export const createAdminSchema = Joi.object({
  [ADMIN_FIELDS.NAME]: Joi.string()
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

  [ADMIN_FIELDS.PASSWORD]: Joi.string()
    .min(VALIDATION_CONSTRAINTS.PASSWORD.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.PASSWORD.MAX_LENGTH)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": `Password must be at least ${VALIDATION_CONSTRAINTS.PASSWORD.MIN_LENGTH} characters long`,
      "string.max": `Password cannot exceed ${VALIDATION_CONSTRAINTS.PASSWORD.MAX_LENGTH} characters`,
      "any.required": "Password is required",
    }),

  [ADMIN_FIELDS.CONFIRM_PASSWORD]: Joi.string()
    .valid(Joi.ref(ADMIN_FIELDS.PASSWORD))
    .required()
    .messages({
      "any.only": "Password doesn't match",
      "any.required": "Confirm password is required",
    }),

  [ADMIN_FIELDS.ROLE]: Joi.string()
    .valid(...getValidRoles())
    .default(ADMIN_DEFAULTS.ROLE)
    .optional()
    .messages({
      "any.only": `Role must be one of: ${getValidRoles().join(", ")}`,
    }),

  [ADMIN_FIELDS.LOCATION_ID]: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, "")
    .default(ADMIN_DEFAULTS.LOCATION_ID)
    .optional()
    .messages({
      "string.pattern.base": "Location ID must be a valid ObjectId",
    }),
});

/**
 * Validation schema for login
 */
export const loginSchema = Joi.object({
  [ADMIN_FIELDS.NAME]: Joi.string()
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

  [ADMIN_FIELDS.PASSWORD]: Joi.string()
    .required()
    .messages({
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
});

/**
 * Validation schema for updating admin
 */
export const updateAdminSchema = Joi.object({
  [ADMIN_FIELDS.NAME]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.NAME.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.NAME.MAX_LENGTH)
    .optional()
    .messages({
      "string.min": `Name must be at least ${VALIDATION_CONSTRAINTS.NAME.MIN_LENGTH} character`,
      "string.max": `Name cannot exceed ${VALIDATION_CONSTRAINTS.NAME.MAX_LENGTH} characters`,
    }),

  [ADMIN_FIELDS.PASSWORD]: Joi.string()
    .min(VALIDATION_CONSTRAINTS.PASSWORD.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.PASSWORD.MAX_LENGTH)
    .optional()
    .messages({
      "string.min": `Password must be at least ${VALIDATION_CONSTRAINTS.PASSWORD.MIN_LENGTH} characters long`,
      "string.max": `Password cannot exceed ${VALIDATION_CONSTRAINTS.PASSWORD.MAX_LENGTH} characters`,
    }),

  [ADMIN_FIELDS.CONFIRM_PASSWORD]: Joi.string()
    .valid(Joi.ref(ADMIN_FIELDS.PASSWORD))
    .when(ADMIN_FIELDS.PASSWORD, {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      "any.only": "Password doesn't match",
      "any.required": "Confirm password is required when updating password",
    }),

  [ADMIN_FIELDS.ROLE]: Joi.string()
    .valid(...getValidRoles())
    .optional()
    .messages({
      "any.only": `Role must be one of: ${getValidRoles().join(", ")}`,
    }),

  [ADMIN_FIELDS.LOCATION_ID]: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, "")
    .optional()
    .messages({
      "string.pattern.base": "Location ID must be a valid ObjectId",
    }),

  [ADMIN_FIELDS.LAST_ACTIVE_AT]: Joi.date().optional(),
})
  .min(1) // At least one field must be provided
  .custom((value, helpers) => {
    // Custom validation: if password is provided, confirmPassword must also be provided
    if (value[ADMIN_FIELDS.PASSWORD] && !value[ADMIN_FIELDS.CONFIRM_PASSWORD]) {
      return helpers.error("custom.confirmPasswordRequired");
    }
    return value;
  }, "Password confirmation validation")
  .messages({
    "custom.confirmPasswordRequired":
      "Confirm password is required when updating password",
  });

/**
 * Validation middleware for creating admin (signup)
 */
export const validateCreateAdmin = (req, res, next) => {
  const { error, value } = createAdminSchema.validate(req.body, {
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
 * Validation middleware for login
 */
export const validateLogin = (req, res, next) => {
  const { error, value } = loginSchema.validate(req.body, {
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
 * Validation middleware for updating admin
 */
export const validateUpdateAdmin = (req, res, next) => {
  const { error, value } = updateAdminSchema.validate(req.body, {
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
  createAdminSchema,
  loginSchema,
  updateAdminSchema,
  validateCreateAdmin,
  validateLogin,
  validateUpdateAdmin,
  VALIDATION_CONSTRAINTS,
};
