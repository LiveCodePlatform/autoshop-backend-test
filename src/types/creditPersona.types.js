/**
 * Credit Persona Types - Pure Definitions
 * Field names, enums, and defaults only (no validation rules/constraints)
 * Validation rules belong in validators/
 */

/**
 * Credit Persona Field Names
 */
export const CREDIT_PERSONA_FIELDS = {
  NAME: "name",
  PHONE: "phone",
  BLACKLIST: "blacklist",
  BLACKLIST_REASON: "blacklistReason",
  BLACKLIST_DATE: "blacklistDate",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
};

/**
 * Default Values (not constraints - just default values)
 */
export const CREDIT_PERSONA_DEFAULTS = {
  BLACKLIST: false,
  BLACKLIST_REASON: null,
  BLACKLIST_DATE: null,
};

/**
 * Credit Persona Type Definitions
 */
export const CREDIT_PERSONA_TYPES = {
  // Create Credit Persona Input Type
  CREATE_CREDIT_PERSONA_INPUT: {
    name: "string",
    phone: "string?",
  },

  // Update Credit Persona Input Type
  UPDATE_CREDIT_PERSONA_INPUT: {
    name: "string?",
    phone: "string?",
    blacklist: "boolean?",
    blacklistReason: "string?",
    blacklistDate: "date?",
  },

  // Credit Persona Response Type (what client sees)
  CREDIT_PERSONA_RESPONSE: {
    id: "string",
    name: "string",
    phone: "string?",
    blacklist: "boolean",
    blacklistReason: "string?",
    blacklistDate: "date?",
    createdAt: "date",
    updatedAt: "date",
  },
};

export default {
  CREDIT_PERSONA_FIELDS,
  CREDIT_PERSONA_DEFAULTS,
  CREDIT_PERSONA_TYPES,
};
