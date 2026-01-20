/**
 * Location Profile Common Validators
 * Shared validation constraints and helper functions for location profile validators
 * Used by both storefrontProfile.validator.js and warehouseProfile.validator.js
 */

import Joi from "joi";
import {
  LOCATION_PROFILE_DEFAULTS,
  getValidStatuses,
} from "../types/locationProfile.types.js";

/**
 * Validation Constraints
 * All validation rules are defined here (not in types)
 * These constraints are shared between storefront and warehouse validators
 */
export const VALIDATION_CONSTRAINTS = {
  LOCATION_CODE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
  },
  LOCATION_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  LOCATION_ADDRESS: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 500,
  },
  LOCATION_PHONE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 20,
  },
  LOCATION_EMAIL: {
    MAX_LENGTH: 200,
  },
  MANAGER_NAME: {
    MAX_LENGTH: 200,
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000,
  },
  NOTES: {
    MAX_LENGTH: 500,
  },
};

/**
 * Helper function to create common validation middleware
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const createValidationMiddleware = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
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
};

/**
 * Helper function to create query validation middleware
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const createQueryValidationMiddleware = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
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

    // Store validated query in a custom property since req.query is read-only
    req.validatedQuery = value;
    next();
  };
};

/**
 * Common Joi schema fields for location profile
 * These can be reused in create/update schemas
 */
export const commonLocationProfileFields = {
  email: (fieldName, entityName) =>
    Joi.string()
      .trim()
      .email()
      .max(VALIDATION_CONSTRAINTS.LOCATION_EMAIL.MAX_LENGTH)
      .lowercase()
      .allow(null, "")
      .default(LOCATION_PROFILE_DEFAULTS.LOCATION_EMAIL)
      .optional()
      .messages({
        "string.email": "Invalid email format",
        "string.max": `${entityName} email cannot exceed ${VALIDATION_CONSTRAINTS.LOCATION_EMAIL.MAX_LENGTH} characters`,
      }),

  managerName: () =>
    Joi.string()
      .trim()
      .max(VALIDATION_CONSTRAINTS.MANAGER_NAME.MAX_LENGTH)
      .allow(null, "")
      .default(LOCATION_PROFILE_DEFAULTS.MANAGER_NAME)
      .optional()
      .messages({
        "string.max": `Manager name cannot exceed ${VALIDATION_CONSTRAINTS.MANAGER_NAME.MAX_LENGTH} characters`,
      }),

  status: () =>
    Joi.string()
      .valid(...getValidStatuses())
      .default(LOCATION_PROFILE_DEFAULTS.STATUS)
      .optional()
      .messages({
        "any.only": `Status must be one of: ${getValidStatuses().join(", ")}`,
      }),

  description: () =>
    Joi.string()
      .trim()
      .max(VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH)
      .default(LOCATION_PROFILE_DEFAULTS.DESCRIPTION)
      .allow(null, "")
      .optional()
      .messages({
        "string.max": `Description cannot exceed ${VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH} characters`,
      }),

  notes: () =>
    Joi.string()
      .trim()
      .max(VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH)
      .default(LOCATION_PROFILE_DEFAULTS.NOTES)
      .allow(null, "")
      .optional()
      .messages({
        "string.max": `Notes cannot exceed ${VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH} characters`,
      }),
};

/**
 * Common query schema for location profiles
 */
export const getLocationProfilesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  status: Joi.string()
    .valid(...getValidStatuses())
    .optional(),
  search: Joi.string().trim().optional(),
  sortBy: Joi.string()
    .valid("createdAt", "updatedAt", "locationName", "locationCode")
    .default("createdAt")
    .optional(),
  sortOrder: Joi.string().valid("asc", "desc").default("desc").optional(),
  includeDeleted: Joi.boolean().default(false).optional(),
});

export default {
  VALIDATION_CONSTRAINTS,
  createValidationMiddleware,
  createQueryValidationMiddleware,
  commonLocationProfileFields,
  getLocationProfilesQuerySchema,
};
