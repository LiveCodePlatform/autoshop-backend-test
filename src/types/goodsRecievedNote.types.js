/**
 * Goods Received Note (GRN) Types - Pure Definitions
 * Field names, enums, and defaults only (no validation rules/constraints)
 * Validation rules belong in validators/
 */

/**
 * GRN Status Enum
 */
export const GRN_STATUS = {
  PENDING: "pending",
  PARTIAL: "partial",
  VERIFIED: "verified",
  REJECTED: "rejected",
};

/**
 * GRN Field Names
 */
export const GRN_FIELDS = {
  GRN_NUMBER: "grnNumber",
  PURCHASING_ID: "purchasingId",
  GRN_DATE: "grnDate",
  STATUS: "status",
  LINE_ITEMS: "lineItems",
  NOTES: "notes",
  TOTAL_AMOUNT: "totalAmount",
  IS_DELETED: "isDeleted",
  DELETED_AT: "deletedAt",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
};

/**
 * GRN Line Item Field Names
 */
export const GRN_LINE_ITEM_FIELDS = {
  INVENTORY_ID: "inventoryId",
  RECEIVED_QUANTITY: "receivedQuantity",
  GOOD_QUANTITY: "goodQuantity",
  BAD_QUANTITY: "badQuantity",
  TRANSFERRED_QUANTITY: "transferredQuantity",
  UNIT_PRICE: "unitPrice",
  TOTAL_PRICE: "totalPrice",
  NOTES: "notes",
};

/**
 * Default Values (not constraints - just default values)
 */
export const GRN_DEFAULTS = {
  STATUS: GRN_STATUS.PENDING,
  NOTES: "No notes available.",
  IS_DELETED: false,
  DELETED_AT: null,
};

/**
 * GRN Line Item Default Values
 */
export const GRN_LINE_ITEM_DEFAULTS = {
  BAD_QUANTITY: 0,
  TRANSFERRED_QUANTITY: 0,
  NOTES: null,
};

/**
 * Helper Functions
 */
export const getValidStatuses = () => Object.values(GRN_STATUS);
export const isValidStatus = (status) =>
  Object.values(GRN_STATUS).includes(status);

/**
 * GRN Type Definitions
 */
export const GRN_TYPES = {
  // GRN Line Item Input Type
  GRN_LINE_ITEM_INPUT: {
    inventoryId: "string", // ObjectId as string
    receivedQuantity: "number",
    goodQuantity: "number",
    badQuantity: "number?",
    transferredQuantity: "number?",
    unitPrice: "number",
    totalPrice: "number",
    notes: "string?",
  },

  // GRN Line Item Response Type
  GRN_LINE_ITEM_RESPONSE: {
    id: "string",
    inventoryId: "string", // ObjectId as string
    receivedQuantity: "number",
    goodQuantity: "number",
    badQuantity: "number",
    transferredQuantity: "number",
    unitPrice: "number",
    totalPrice: "number",
    notes: "string?",
    profitMargin: "number?", // virtual
    profitAmount: "number?", // virtual
    availableQuantity: "number", // virtual
  },

  // Create GRN Input Type
  CREATE_GRN_INPUT: {
    grnNumber: "string?",
    purchasingId: "string", // ObjectId as string
    grnDate: "date?",
    status: "enum?",
    lineItems: "GRNLineItemInput[]",
    notes: "string?",
    totalAmount: "number",
  },

  // Update GRN Input Type
  UPDATE_GRN_INPUT: {
    grnNumber: "string?",
    purchasingId: "string?", // ObjectId as string
    grnDate: "date?",
    status: "enum?",
    lineItems: "GRNLineItemInput[]?",
    notes: "string?",
    totalAmount: "number?",
  },

  // GRN Response Type (what client sees)
  GRN_RESPONSE: {
    id: "string",
    grnNumber: "string",
    purchasingId: "string", // ObjectId as string
    grnDate: "date",
    status: "enum",
    lineItems: "GRNLineItemResponse[]",
    notes: "string",
    totalAmount: "number",
    totalReceivedQuantity: "number", // virtual
    totalGoodQuantity: "number", // virtual
    totalBadQuantity: "number", // virtual
    isDeleted: "boolean",
    deletedAt: "date?",
    createdAt: "date",
    updatedAt: "date",
  },
};

export default {
  GRN_STATUS,
  GRN_FIELDS,
  GRN_LINE_ITEM_FIELDS,
  GRN_DEFAULTS,
  GRN_LINE_ITEM_DEFAULTS,
  GRN_TYPES,
  getValidStatuses,
  isValidStatus,
};
