/**
 * Credit Record Types - Pure Definitions
 * Field names, enums, and defaults only (no validation rules/constraints)
 * Validation rules belong in validators/
 */

/**
 * Payment Method Enum
 */
export const PAYMENT_METHOD = {
  CASH: "cash",
  BANK_TRANSFER: "bank_transfer",
  MOBILE_PAYMENT: "mobile_payment",
  CARD: "card",
  CHEQUE: "cheque",
  OTHER: "other",
};

/**
 * Credit Record Field Names
 */
export const CREDIT_RECORD_FIELDS = {
  ORDER_ID: "orderId",
  CREDIT_PERSON_ID: "creditPersonId",
  PAID_AMOUNT: "paidAmount",
  PAYMENT_DATE: "paymentDate",
  PAYMENT_METHOD: "paymentMethod",
  NOTES: "notes",
  ADDED_BY: "addedBy",
  IS_DELETED: "isDeleted",
  DELETED_AT: "deletedAt",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
};

/**
 * Default Values (not constraints - just default values)
 */
export const CREDIT_RECORD_DEFAULTS = {
  PAYMENT_METHOD: PAYMENT_METHOD.CASH,
  NOTES: null,
  IS_DELETED: false,
  DELETED_AT: null,
};

/**
 * Helper Functions
 */
export const getValidPaymentMethods = () => Object.values(PAYMENT_METHOD);
export const isValidPaymentMethod = (method) =>
  Object.values(PAYMENT_METHOD).includes(method);

/**
 * Credit Record Type Definitions
 */
export const CREDIT_RECORD_TYPES = {
  // Create Credit Record Input Type
  CREATE_CREDIT_RECORD_INPUT: {
    orderId: "string", // ObjectId as string
    creditPersonId: "string?", // ObjectId as string, optional
    paidAmount: "number",
    paymentDate: "date?",
    paymentMethod: "enum?",
    notes: "string?",
    addedBy: "string", // ObjectId as string
  },

  // Update Credit Record Input Type
  UPDATE_CREDIT_RECORD_INPUT: {
    orderId: "string?", // ObjectId as string
    creditPersonId: "string?", // ObjectId as string
    paidAmount: "number?",
    paymentDate: "date?",
    paymentMethod: "enum?",
    notes: "string?",
    addedBy: "string?", // ObjectId as string
  },

  // Credit Record Response Type (what client sees)
  CREDIT_RECORD_RESPONSE: {
    id: "string",
    orderId: "string",
    creditPersonId: "string?",
    paidAmount: "number",
    paymentDate: "date",
    paymentMethod: "enum",
    notes: "string?",
    addedBy: "string",
    isDeleted: "boolean",
    deletedAt: "date?",
    createdAt: "date",
    updatedAt: "date",
  },
};

export default {
  PAYMENT_METHOD,
  CREDIT_RECORD_FIELDS,
  CREDIT_RECORD_DEFAULTS,
  CREDIT_RECORD_TYPES,
  getValidPaymentMethods,
  isValidPaymentMethod,
};
