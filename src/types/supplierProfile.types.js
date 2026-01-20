/**
 * Supplier Profile Types - Pure Definitions
 * Field names, enums, and defaults only (no validation rules/constraints)
 * Validation rules belong in validators/
 */

/**
 * Supplier Profile Field Names
 */
export const SUPPLIER_PROFILE_FIELDS = {
  SUPPLIER_NAME: "supplierName",
  CONTACT_NUMBER: "contactNumber",
  IS_DELETED: "isDeleted",
  DELETED_AT: "deletedAt",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
};

/**
 * Default Values (not constraints - just default values)
 */
export const SUPPLIER_PROFILE_DEFAULTS = {
  IS_DELETED: false,
  DELETED_AT: null,
};

/**
 * Supplier Profile Type Definitions
 */
export const SUPPLIER_PROFILE_TYPES = {
  // Create Supplier Profile Input Type
  CREATE_SUPPLIER_PROFILE_INPUT: {
    supplierName: "string",
    contactNumber: "string",
  },

  // Update Supplier Profile Input Type
  UPDATE_SUPPLIER_PROFILE_INPUT: {
    supplierName: "string?",
    contactNumber: "string?",
  },

  // Supplier Profile Response Type (what client sees)
  SUPPLIER_PROFILE_RESPONSE: {
    id: "string",
    supplierName: "string",
    contactNumber: "string",
    isDeleted: "boolean",
    deletedAt: "date?",
    createdAt: "date",
    updatedAt: "date",
  },
};

export default {
  SUPPLIER_PROFILE_FIELDS,
  SUPPLIER_PROFILE_DEFAULTS,
  SUPPLIER_PROFILE_TYPES,
};
