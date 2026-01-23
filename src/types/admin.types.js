/**
 * Admin Types - Pure Definitions
 * Field names, enums, and defaults only (no validation rules/constraints)
 * Validation rules belong in validators/
 */

/**
 * Admin Role Enum
 */
export const ADMIN_ROLE = {
  OWNER: "owner",
  CASHIER: "cashier",
  ADMIN: "admin",
};

/**
 * Admin Field Names
 */
export const ADMIN_FIELDS = {
  NAME: "name",
  PASSWORD: "password",
  CONFIRM_PASSWORD: "confirmPassword",
  ROLE: "role",
  LOCATION_ID: "locationId",
  LAST_ACTIVE_AT: "lastActiveAt",
  SOFT_DELETED: "softDeleted",
  DELETED_AT: "deletedAt",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
};

/**
 * Default Values (not constraints - just default values)
 */
export const ADMIN_DEFAULTS = {
  ROLE: ADMIN_ROLE.OWNER,
  LOCATION_ID: null,
  LAST_ACTIVE_AT: null,
  SOFT_DELETED: false,
  DELETED_AT: null,
};

/**
 * Helper Functions
 */
export const getValidRoles = () => Object.values(ADMIN_ROLE);
export const isValidRole = (role) => Object.values(ADMIN_ROLE).includes(role);

/**
 * Admin Type Definitions
 */
export const ADMIN_TYPES = {
  // Create Admin Input Type
  CREATE_ADMIN_INPUT: {
    name: "string",
    password: "string",
    confirmPassword: "string",
    role: "enum?",
    locationId: "ObjectId?",
  },

  // Update Admin Input Type
  UPDATE_ADMIN_INPUT: {
    name: "string?",
    password: "string?",
    confirmPassword: "string?",
    role: "enum?",
    locationId: "ObjectId?",
    lastActiveAt: "date?",
  },

  // Admin Response Type (what client sees)
  ADMIN_RESPONSE: {
    id: "string",
    name: "string",
    role: "enum",
    locationId: "ObjectId?",
    lastActiveAt: "date?",
    createdAt: "date",
    updatedAt: "date?",
    // Note: password and confirmPassword are never included in response
    // Note: softDeleted and deletedAt are typically excluded from public responses
  },
};

export default {
  ADMIN_ROLE,
  ADMIN_FIELDS,
  ADMIN_DEFAULTS,
  ADMIN_TYPES,
  getValidRoles,
  isValidRole,
};
