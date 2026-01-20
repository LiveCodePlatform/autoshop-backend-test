/**
 * Warehouse Profile Validators
 * Request validation schemas for warehouse profile endpoints
 * Uses types from types/locationProfile.types.js for field names and enums
 * 
 * Note: Uses legacy field names (warehouseCode, warehouseName, etc.)
 * for backward compatibility with existing API
 */

import Joi from "joi";
import {
  WAREHOUSE_PROFILE_FIELDS,
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
 * Validation schema for creating warehouse profile
 */
export const createWarehouseProfileSchema = Joi.object({
  [WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_CODE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_CODE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_CODE.MAX_LENGTH)
    .uppercase()
    .required()
    .messages({
      "string.empty": "Warehouse code is required",
      "string.min": `Warehouse code must be at least ${VALIDATION_CONSTRAINTS.LOCATION_CODE.MIN_LENGTH} character`,
      "string.max": `Warehouse code cannot exceed ${VALIDATION_CONSTRAINTS.LOCATION_CODE.MAX_LENGTH} characters`,
      "any.required": "Warehouse code is required",
    }),

  [WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_NAME]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_NAME.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_NAME.MAX_LENGTH)
    .required()
    .messages({
      "string.empty": "Warehouse name is required",
      "string.min": `Warehouse name must be at least ${VALIDATION_CONSTRAINTS.LOCATION_NAME.MIN_LENGTH} character`,
      "string.max": `Warehouse name cannot exceed ${VALIDATION_CONSTRAINTS.LOCATION_NAME.MAX_LENGTH} characters`,
      "any.required": "Warehouse name is required",
    }),

  [WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_ADDRESS]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_ADDRESS.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_ADDRESS.MAX_LENGTH)
    .required()
    .messages({
      "string.empty": "Warehouse address is required",
      "string.min": `Warehouse address must be at least ${VALIDATION_CONSTRAINTS.LOCATION_ADDRESS.MIN_LENGTH} character`,
      "string.max": `Warehouse address cannot exceed ${VALIDATION_CONSTRAINTS.LOCATION_ADDRESS.MAX_LENGTH} characters`,
      "any.required": "Warehouse address is required",
    }),

  [WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_PHONE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_PHONE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_PHONE.MAX_LENGTH)
    .required()
    .messages({
      "string.empty": "Warehouse phone is required",
      "string.min": `Warehouse phone must be at least ${VALIDATION_CONSTRAINTS.LOCATION_PHONE.MIN_LENGTH} character`,
      "string.max": `Warehouse phone cannot exceed ${VALIDATION_CONSTRAINTS.LOCATION_PHONE.MAX_LENGTH} characters`,
      "any.required": "Warehouse phone is required",
    }),

  [WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_EMAIL]: commonLocationProfileFields.email(
    WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_EMAIL,
    "Warehouse"
  ),

  [WAREHOUSE_PROFILE_FIELDS.MANAGER_NAME]: commonLocationProfileFields.managerName(),

  [WAREHOUSE_PROFILE_FIELDS.STATUS]: commonLocationProfileFields.status(),

  [WAREHOUSE_PROFILE_FIELDS.DESCRIPTION]: commonLocationProfileFields.description(),

  [WAREHOUSE_PROFILE_FIELDS.NOTES]: commonLocationProfileFields.notes(),
});

/**
 * Validation schema for updating warehouse profile
 */
export const updateWarehouseProfileSchema = Joi.object({
  [WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_CODE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_CODE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_CODE.MAX_LENGTH)
    .uppercase()
    .optional(),

  [WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_NAME]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_NAME.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_NAME.MAX_LENGTH)
    .optional(),

  [WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_ADDRESS]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_ADDRESS.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_ADDRESS.MAX_LENGTH)
    .optional(),

  [WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_PHONE]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.LOCATION_PHONE.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.LOCATION_PHONE.MAX_LENGTH)
    .optional(),

  [WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_EMAIL]: Joi.string()
    .trim()
    .email()
    .max(VALIDATION_CONSTRAINTS.LOCATION_EMAIL.MAX_LENGTH)
    .lowercase()
    .allow(null, "")
    .optional()
    .messages({
      "string.email": "Invalid email format",
    }),

  [WAREHOUSE_PROFILE_FIELDS.MANAGER_NAME]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.MANAGER_NAME.MAX_LENGTH)
    .allow(null, "")
    .optional(),

  [WAREHOUSE_PROFILE_FIELDS.STATUS]: Joi.string()
    .valid(...getValidStatuses())
    .optional()
    .messages({
      "any.only": `Status must be one of: ${getValidStatuses().join(", ")}`,
    }),

  [WAREHOUSE_PROFILE_FIELDS.DESCRIPTION]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH)
    .allow(null, "")
    .optional(),

  [WAREHOUSE_PROFILE_FIELDS.NOTES]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH)
    .allow(null, "")
    .optional(),
}).min(1); // At least one field must be provided

/**
 * Validation middleware for creating warehouse profile
 */
export const validateCreateWarehouseProfile = createValidationMiddleware(
  createWarehouseProfileSchema
);

/**
 * Validation middleware for updating warehouse profile
 */
export const validateUpdateWarehouseProfile = createValidationMiddleware(
  updateWarehouseProfileSchema
);

/**
 * Validation middleware for query parameters
 */
export const validateGetWarehouseProfilesQuery = createQueryValidationMiddleware(
  getLocationProfilesQuerySchema
);

export default {
  createWarehouseProfileSchema,
  updateWarehouseProfileSchema,
  validateCreateWarehouseProfile,
  validateUpdateWarehouseProfile,
  validateGetWarehouseProfilesQuery,
  VALIDATION_CONSTRAINTS,
};
