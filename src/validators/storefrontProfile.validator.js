/**
 * Storefront Profile Validators
 * Request validation schemas for storefront profile endpoints
 * Uses types from types/locationProfile.types.js for field names and enums
 * 
 * Note: Uses legacy field names (storefrontCode, storefrontName, etc.)
 * for backward compatibility with existing API
 */

import Joi from "joi";
import {
  STOREFRONT_PROFILE_FIELDS,
  LOCATION_PROFILE_DEFAULTS,
  getValidStatuses,
} from "../types/locationProfile.types.js";
import {
  VALIDATION_CONSTRAINTS,
  createValidationMiddleware,
  createQueryValidationMiddleware,
  commonLocationProfileFields,
  getLocationProfilesQuerySchema,
} from "./locationProfile.common.js";

/**
 * Validation schema for creating storefront profile
 */
export const createStorefrontProfileSchema = Joi.object({
  [STOREFRONT_PROFILE_FIELDS.STOREFRONT_CODE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_CODE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_CODE.MAX_LENGTH)
    .uppercase()
    .required()
    .messages({
      "string.empty": "Storefront code is required",
      "string.min": `Storefront code must be at least ${VALIDATION_CONSTRAINTS.LOCATION_CODE.MIN_LENGTH} character`,
      "string.max": `Storefront code cannot exceed ${VALIDATION_CONSTRAINTS.LOCATION_CODE.MAX_LENGTH} characters`,
      "any.required": "Storefront code is required",
    }),

  [STOREFRONT_PROFILE_FIELDS.STOREFRONT_NAME]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_NAME.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_NAME.MAX_LENGTH)
    .required()
    .messages({
      "string.empty": "Storefront name is required",
      "string.min": `Storefront name must be at least ${VALIDATION_CONSTRAINTS.LOCATION_NAME.MIN_LENGTH} character`,
      "string.max": `Storefront name cannot exceed ${VALIDATION_CONSTRAINTS.LOCATION_NAME.MAX_LENGTH} characters`,
      "any.required": "Storefront name is required",
    }),

  [STOREFRONT_PROFILE_FIELDS.STOREFRONT_ADDRESS]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_ADDRESS.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_ADDRESS.MAX_LENGTH)
    .required()
    .messages({
      "string.empty": "Storefront address is required",
      "string.min": `Storefront address must be at least ${VALIDATION_CONSTRAINTS.LOCATION_ADDRESS.MIN_LENGTH} character`,
      "string.max": `Storefront address cannot exceed ${VALIDATION_CONSTRAINTS.LOCATION_ADDRESS.MAX_LENGTH} characters`,
      "any.required": "Storefront address is required",
    }),

  [STOREFRONT_PROFILE_FIELDS.STOREFRONT_PHONE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_PHONE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_PHONE.MAX_LENGTH)
    .required()
    .messages({
      "string.empty": "Storefront phone is required",
      "string.min": `Storefront phone must be at least ${VALIDATION_CONSTRAINTS.LOCATION_PHONE.MIN_LENGTH} character`,
      "string.max": `Storefront phone cannot exceed ${VALIDATION_CONSTRAINTS.LOCATION_PHONE.MAX_LENGTH} characters`,
      "any.required": "Storefront phone is required",
    }),

  [STOREFRONT_PROFILE_FIELDS.STOREFRONT_EMAIL]: commonLocationProfileFields.email(
    STOREFRONT_PROFILE_FIELDS.STOREFRONT_EMAIL,
    "Storefront"
  ),

  [STOREFRONT_PROFILE_FIELDS.MANAGER_NAME]: commonLocationProfileFields.managerName(),

  [STOREFRONT_PROFILE_FIELDS.STATUS]: commonLocationProfileFields.status(),

  [STOREFRONT_PROFILE_FIELDS.DESCRIPTION]: commonLocationProfileFields.description(),

  [STOREFRONT_PROFILE_FIELDS.NOTES]: commonLocationProfileFields.notes(),
});

/**
 * Validation schema for updating storefront profile
 */
export const updateStorefrontProfileSchema = Joi.object({
  [STOREFRONT_PROFILE_FIELDS.STOREFRONT_CODE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_CODE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_CODE.MAX_LENGTH)
    .uppercase()
    .optional(),

  [STOREFRONT_PROFILE_FIELDS.STOREFRONT_NAME]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_NAME.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_NAME.MAX_LENGTH)
    .optional(),

  [STOREFRONT_PROFILE_FIELDS.STOREFRONT_ADDRESS]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_ADDRESS.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_ADDRESS.MAX_LENGTH)
    .optional(),

  [STOREFRONT_PROFILE_FIELDS.STOREFRONT_PHONE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_PHONE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_PHONE.MAX_LENGTH)
    .optional(),

  [STOREFRONT_PROFILE_FIELDS.STOREFRONT_EMAIL]: Joi.string()
    .trim()
    .email()
    .max(VALIDATION_CONSTRAINTS.LOCATION_EMAIL.MAX_LENGTH)
    .lowercase()
    .allow(null, "")
    .optional()
    .messages({
      "string.email": "Invalid email format",
    }),

  [STOREFRONT_PROFILE_FIELDS.MANAGER_NAME]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.MANAGER_NAME.MAX_LENGTH)
    .allow(null, "")
    .optional(),

  [STOREFRONT_PROFILE_FIELDS.STATUS]: Joi.string()
    .valid(...getValidStatuses())
    .optional()
    .messages({
      "any.only": `Status must be one of: ${getValidStatuses().join(", ")}`,
    }),

  [STOREFRONT_PROFILE_FIELDS.DESCRIPTION]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH)
    .allow(null, "")
    .optional(),

  [STOREFRONT_PROFILE_FIELDS.NOTES]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH)
    .allow(null, "")
    .optional(),
}).min(1); // At least one field must be provided

/**
 * Validation middleware for creating storefront profile
 */
export const validateCreateStorefrontProfile = createValidationMiddleware(
  createStorefrontProfileSchema
);

/**
 * Validation middleware for updating storefront profile
 */
export const validateUpdateStorefrontProfile = createValidationMiddleware(
  updateStorefrontProfileSchema
);

/**
 * Validation middleware for query parameters
 */
export const validateGetStorefrontProfilesQuery = createQueryValidationMiddleware(
  getLocationProfilesQuerySchema
);

export default {
  createStorefrontProfileSchema,
  updateStorefrontProfileSchema,
  validateCreateStorefrontProfile,
  validateUpdateStorefrontProfile,
  validateGetStorefrontProfilesQuery,
  VALIDATION_CONSTRAINTS,
};
