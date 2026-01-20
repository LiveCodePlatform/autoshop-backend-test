/**
 * Location Profile Types - Pure Definitions
 * Field names, enums, and defaults only (no validation rules/constraints)
 * Validation rules belong in validators/
 */

/**
 * Location Type Enum
 */
export const LOCATION_TYPE = {
  WAREHOUSE: "warehouse",
  STOREFRONT: "storefront",
};

/**
 * Location Status Enum
 */
export const LOCATION_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};

/**
 * Location Profile Field Names (Unified Schema Fields)
 */
export const LOCATION_PROFILE_FIELDS = {
  TYPE: "type",
  LOCATION_CODE: "locationCode",
  LOCATION_NAME: "locationName",
  LOCATION_ADDRESS: "locationAddress",
  LOCATION_PHONE: "locationPhone",
  LOCATION_EMAIL: "locationEmail",
  MANAGER_NAME: "managerName",
  STATUS: "status",
  DESCRIPTION: "description",
  NOTES: "notes",
  IS_DELETED: "isDeleted",
  DELETED_AT: "deletedAt",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
};

/**
 * Storefront Profile Field Names (Legacy API Field Names)
 * These map to LOCATION_PROFILE_FIELDS in the unified schema
 */
export const STOREFRONT_PROFILE_FIELDS = {
  STOREFRONT_CODE: "storefrontCode", // → locationCode
  STOREFRONT_NAME: "storefrontName", // → locationName
  STOREFRONT_ADDRESS: "storefrontAddress", // → locationAddress
  STOREFRONT_PHONE: "storefrontPhone", // → locationPhone
  STOREFRONT_EMAIL: "storefrontEmail", // → locationEmail
  MANAGER_NAME: "managerName", // → managerName (same)
  STATUS: "status", // → status (same)
  DESCRIPTION: "description", // → description (same)
  NOTES: "notes", // → notes (same)
};

/**
 * Warehouse Profile Field Names (Legacy API Field Names)
 * These map to LOCATION_PROFILE_FIELDS in the unified schema
 */
export const WAREHOUSE_PROFILE_FIELDS = {
  WAREHOUSE_CODE: "warehouseCode", // → locationCode
  WAREHOUSE_NAME: "warehouseName", // → locationName
  WAREHOUSE_ADDRESS: "warehouseAddress", // → locationAddress
  WAREHOUSE_PHONE: "warehousePhone", // → locationPhone
  WAREHOUSE_EMAIL: "warehouseEmail", // → locationEmail
  MANAGER_NAME: "managerName", // → managerName (same)
  STATUS: "status", // → status (same)
  DESCRIPTION: "description", // → description (same)
  NOTES: "notes", // → notes (same)
};

/**
 * Default Values (not constraints - just default values)
 */
export const LOCATION_PROFILE_DEFAULTS = {
  STATUS: LOCATION_STATUS.ACTIVE,
  DESCRIPTION: "No description available",
  NOTES: "No notes available",
  IS_DELETED: false,
  DELETED_AT: null,
  LOCATION_EMAIL: null,
  MANAGER_NAME: null,
};

/**
 * Helper Functions
 */
export const getValidLocationTypes = () => Object.values(LOCATION_TYPE);
export const getValidStatuses = () => Object.values(LOCATION_STATUS);
export const isValidLocationType = (type) =>
  Object.values(LOCATION_TYPE).includes(type);
export const isValidStatus = (status) =>
  Object.values(LOCATION_STATUS).includes(status);

/**
 * Location Profile Type Definitions
 * 
 * Note: LocationProfile is a unified schema that merges both storefront and warehouse profiles.
 * The legacy API accepts different field names (storefrontCode vs warehouseCode) but both
 * map to the same unified schema fields (locationCode).
 */
export const LOCATION_PROFILE_TYPES = {
  // Unified Create Location Profile Input Type (uses unified field names)
  CREATE_LOCATION_PROFILE_INPUT: {
    type: "enum",
    locationCode: "string",
    locationName: "string",
    locationAddress: "string",
    locationPhone: "string",
    locationEmail: "string?",
    managerName: "string?",
    status: "enum?",
    description: "string?",
    notes: "string?",
  },

  // Create Storefront Profile Input Type (legacy API field names)
  CREATE_STOREFRONT_PROFILE_INPUT: {
    storefrontCode: "string", // → locationCode
    storefrontName: "string", // → locationName
    storefrontAddress: "string", // → locationAddress
    storefrontPhone: "string", // → locationPhone
    storefrontEmail: "string?", // → locationEmail
    managerName: "string?",
    status: "enum?",
    description: "string?",
    notes: "string?",
  },

  // Create Warehouse Profile Input Type (legacy API field names)
  CREATE_WAREHOUSE_PROFILE_INPUT: {
    warehouseCode: "string", // → locationCode
    warehouseName: "string", // → locationName
    warehouseAddress: "string", // → locationAddress
    warehousePhone: "string", // → locationPhone
    warehouseEmail: "string?", // → locationEmail
    managerName: "string?",
    status: "enum?",
    description: "string?",
    notes: "string?",
  },

  // Unified Update Location Profile Input Type (uses unified field names)
  UPDATE_LOCATION_PROFILE_INPUT: {
    type: "enum?",
    locationCode: "string?",
    locationName: "string?",
    locationAddress: "string?",
    locationPhone: "string?",
    locationEmail: "string?",
    managerName: "string?",
    status: "enum?",
    description: "string?",
    notes: "string?",
  },

  // Update Storefront Profile Input Type (legacy API field names)
  UPDATE_STOREFRONT_PROFILE_INPUT: {
    storefrontCode: "string?", // → locationCode
    storefrontName: "string?", // → locationName
    storefrontAddress: "string?", // → locationAddress
    storefrontPhone: "string?", // → locationPhone
    storefrontEmail: "string?", // → locationEmail
    managerName: "string?",
    status: "enum?",
    description: "string?",
    notes: "string?",
  },

  // Update Warehouse Profile Input Type (legacy API field names)
  UPDATE_WAREHOUSE_PROFILE_INPUT: {
    warehouseCode: "string?", // → locationCode
    warehouseName: "string?", // → locationName
    warehouseAddress: "string?", // → locationAddress
    warehousePhone: "string?", // → locationPhone
    warehouseEmail: "string?", // → locationEmail
    managerName: "string?",
    status: "enum?",
    description: "string?",
    notes: "string?",
  },

  // Location Profile Response Type (unified - what client sees)
  // Response always uses unified schema field names regardless of input field names
  LOCATION_PROFILE_RESPONSE: {
    id: "string",
    type: "enum",
    locationCode: "string",
    locationName: "string",
    locationAddress: "string",
    locationPhone: "string",
    locationEmail: "string?",
    managerName: "string?",
    status: "enum",
    description: "string",
    notes: "string",
    isDeleted: "boolean",
    deletedAt: "date?",
    createdAt: "date",
    updatedAt: "date",
  },
};

export default {
  LOCATION_TYPE,
  LOCATION_STATUS,
  LOCATION_PROFILE_FIELDS,
  STOREFRONT_PROFILE_FIELDS,
  WAREHOUSE_PROFILE_FIELDS,
  LOCATION_PROFILE_DEFAULTS,
  LOCATION_PROFILE_TYPES,
  getValidLocationTypes,
  getValidStatuses,
  isValidLocationType,
  isValidStatus,
};
