/**
 * Transfer Types - Pure Definitions
 * Field names, enums, and defaults only (no validation rules/constraints)
 * Validation rules belong in validators/
 */

/**
 * Transfer Status Enum
 */
export const TRANSFER_STATUS = {
  PENDING: "pending",
  IN_TRANSIT: "in-transit",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

/**
 * Transfer Source Type Enum
 */
export const TRANSFER_SOURCE_TYPE = {
  GRN: "GRN",
  WAREHOUSE: "Warehouse",
};

/**
 * Transfer Field Names
 */
export const TRANSFER_FIELDS = {
  TRANSFER_NUMBER: "transferNumber",
  SOURCE_TYPE: "sourceType",
  SOURCE_ID: "sourceId",
  DESTINATION_WAREHOUSE_ID: "destinationWarehouseId",
  DESTINATION_STOREFRONT_ID: "destinationStorefrontId",
  LINE_ITEMS: "lineItems",
  STATUS: "status",
  TRANSFER_DATE: "transferDate",
  RECEIVED_DATE: "receivedDate",
  NOTES: "notes",
  IS_DELETED: "isDeleted",
  DELETED_AT: "deletedAt",
  TRANSFERRED_BY: "transferredBy",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
};

/**
 * Transfer Line Item Field Names
 */
export const TRANSFER_LINE_ITEM_FIELDS = {
  INVENTORY_ID: "inventoryId",
  QUANTITY: "quantity",
  GRN_LINE_ITEM_ID: "grnLineItemId",
  NOTES: "notes",
};

/**
 * Default Values (not constraints - just default values)
 */
export const TRANSFER_DEFAULTS = {
  STATUS: TRANSFER_STATUS.PENDING,
  NOTES: null,
  IS_DELETED: false,
  DELETED_AT: null,
  RECEIVED_DATE: null,
};

/**
 * Transfer Line Item Default Values
 */
export const TRANSFER_LINE_ITEM_DEFAULTS = {
  GRN_LINE_ITEM_ID: null,
  NOTES: null,
};

/**
 * Helper Functions
 */
export const getValidStatuses = () => Object.values(TRANSFER_STATUS);
export const getValidSourceTypes = () => Object.values(TRANSFER_SOURCE_TYPE);
export const isValidStatus = (status) =>
  Object.values(TRANSFER_STATUS).includes(status);
export const isValidSourceType = (sourceType) =>
  Object.values(TRANSFER_SOURCE_TYPE).includes(sourceType);

/**
 * Transfer Type Definitions
 */
export const TRANSFER_TYPES = {
  // Transfer Line Item Input Type
  TRANSFER_LINE_ITEM_INPUT: {
    inventoryId: "string", // ObjectId as string
    quantity: "number",
    grnLineItemId: "string?", // ObjectId as string, optional
    notes: "string?",
  },

  // Transfer Line Item Response Type
  TRANSFER_LINE_ITEM_RESPONSE: {
    id: "string",
    inventoryId: "string", // ObjectId as string
    quantity: "number",
    grnLineItemId: "string?", // ObjectId as string, optional
    notes: "string?",
  },

  // Create Transfer Input Type
  CREATE_TRANSFER_INPUT: {
    transferNumber: "string?",
    sourceType: "enum",
    sourceId: "string", // ObjectId as string
    destinationWarehouseId: "string?", // ObjectId as string, optional
    destinationStorefrontId: "string?", // ObjectId as string, optional
    lineItems: "TransferLineItemInput[]",
    status: "enum?",
    transferDate: "date?",
    notes: "string?",
    transferredBy: "string", // ObjectId as string
  },

  // Update Transfer Input Type
  UPDATE_TRANSFER_INPUT: {
    sourceType: "enum?",
    sourceId: "string?", // ObjectId as string
    destinationWarehouseId: "string?", // ObjectId as string
    destinationStorefrontId: "string?", // ObjectId as string
    lineItems: "TransferLineItemInput[]?",
    status: "enum?",
    transferDate: "date?",
    receivedDate: "date?",
    notes: "string?",
  },

  // Transfer Response Type (what client sees)
  TRANSFER_RESPONSE: {
    id: "string",
    transferNumber: "string",
    sourceType: "enum",
    sourceId: "string", // ObjectId as string
    destinationWarehouseId: "string?", // ObjectId as string, optional
    destinationStorefrontId: "string?", // ObjectId as string, optional
    lineItems: "TransferLineItemResponse[]",
    status: "enum",
    transferDate: "date",
    receivedDate: "date?",
    notes: "string?",
    totalQuantity: "number", // virtual
    isDeleted: "boolean",
    deletedAt: "date?",
    transferredBy: "string", // ObjectId as string
    createdAt: "date",
    updatedAt: "date",
  },
};

export default {
  TRANSFER_STATUS,
  TRANSFER_SOURCE_TYPE,
  TRANSFER_FIELDS,
  TRANSFER_LINE_ITEM_FIELDS,
  TRANSFER_DEFAULTS,
  TRANSFER_LINE_ITEM_DEFAULTS,
  TRANSFER_TYPES,
  getValidStatuses,
  getValidSourceTypes,
  isValidStatus,
  isValidSourceType,
};
