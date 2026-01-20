/**
 * Expense Types - Pure Definitions
 * Field names, enums, and defaults only (no validation rules/constraints)
 * Validation rules belong in validators/
 */

/**
 * Expense Field Names
 */
export const EXPENSE_FIELDS = {
  CATEGORY: "category",
  AMOUNT: "amount",
  DATE: "date",
  NOTES: "notes",
  LOCATION_ID: "locationId",
  ADMIN_ID: "adminId",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
};

/**
 * Default Values (not constraints - just default values)
 */
export const EXPENSE_DEFAULTS = {
  NOTES: "No notes available",
};

/**
 * Expense Type Definitions
 */
export const EXPENSE_TYPES = {
  // Create Expense Input Type
  CREATE_EXPENSE_INPUT: {
    category: "string",
    amount: "number",
    date: "date",
    notes: "string?",
    locationId: "string", // ObjectId as string
    adminId: "string", // ObjectId as string
  },

  // Update Expense Input Type
  UPDATE_EXPENSE_INPUT: {
    category: "string?",
    amount: "number?",
    date: "date?",
    notes: "string?",
    locationId: "string?", // ObjectId as string
    adminId: "string?", // ObjectId as string
  },

  // Expense Response Type (what client sees)
  EXPENSE_RESPONSE: {
    id: "string",
    category: "string",
    amount: "number",
    date: "date",
    notes: "string",
    locationId: "string",
    adminId: "string",
    createdAt: "date",
    updatedAt: "date",
  },
};

export default {
  EXPENSE_FIELDS,
  EXPENSE_DEFAULTS,
  EXPENSE_TYPES,
};
