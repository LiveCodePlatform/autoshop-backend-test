/**
 * Stock Audit Log Types - Pure Definitions
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
 * Stock Audit Action Enum
 */
export const STOCK_AUDIT_ACTION = {
  ADD: "add",
  REMOVE: "remove",
  ADJUST: "adjust",
  CREATE: "create",
};

/**
 * Related Transaction Type Enum
 */
export const RELATED_TRANSACTION_TYPE = {
  GRN: "grn",
  ORDER: "order",
  PURCHASE: "purchase",
  EXPENSE: "expense",
  NULL: null,
};

/**
 * Stock Audit Log Field Names
 */
export const STOCK_AUDIT_LOG_FIELDS = {
  INVENTORY_ID: "inventoryId",
  ADMIN_ID: "adminId",
  LOCATION_ID: "locationId",
  LOCATION_TYPE: "locationType",
  STOCK_RECORD_ID: "stockRecordId",
  BEFORE_QUANTITY: "beforeQuantity",
  AFTER_QUANTITY: "afterQuantity",
  QUANTITY_CHANGE: "quantityChange",
  ACTION: "action",
  REASON: "reason",
  RELATED_TRANSACTION_ID: "relatedTransactionId",
  RELATED_TRANSACTION_TYPE: "relatedTransactionType",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
};

/**
 * Default Values (not constraints - just default values)
 */
export const STOCK_AUDIT_LOG_DEFAULTS = {
  REASON: null,
  RELATED_TRANSACTION_ID: null,
  RELATED_TRANSACTION_TYPE: null,
};

/**
 * Helper Functions
 */
export const getValidLocationTypes = () => Object.values(LOCATION_TYPE);
export const getValidActions = () => Object.values(STOCK_AUDIT_ACTION);
export const getValidRelatedTransactionTypes = () =>
  Object.values(RELATED_TRANSACTION_TYPE).filter((type) => type !== null);
export const getValidRelatedTransactionTypesWithNull = () =>
  Object.values(RELATED_TRANSACTION_TYPE); // Includes null
export const isValidLocationType = (type) =>
  Object.values(LOCATION_TYPE).includes(type);
export const isValidAction = (action) =>
  Object.values(STOCK_AUDIT_ACTION).includes(action);
export const isValidRelatedTransactionType = (type) =>
  type === null || Object.values(RELATED_TRANSACTION_TYPE).includes(type);

/**
 * Stock Audit Log Type Definitions
 */
export const STOCK_AUDIT_LOG_TYPES = {
  // Create Stock Audit Log Input Type
  CREATE_STOCK_AUDIT_LOG_INPUT: {
    inventoryId: "ObjectId",
    adminId: "ObjectId",
    locationId: "ObjectId",
    locationType: "enum",
    stockRecordId: "ObjectId",
    beforeQuantity: "number",
    afterQuantity: "number",
    quantityChange: "number",
    action: "enum",
    reason: "string?",
    relatedTransactionId: "ObjectId?",
    relatedTransactionType: "enum?",
  },

  // Update Stock Audit Log Input Type (rarely used, but included for completeness)
  UPDATE_STOCK_AUDIT_LOG_INPUT: {
    reason: "string?",
    relatedTransactionId: "ObjectId?",
    relatedTransactionType: "enum?",
  },

  // Stock Audit Log Response Type (what client sees)
  STOCK_AUDIT_LOG_RESPONSE: {
    id: "string",
    inventoryId: "ObjectId",
    adminId: "ObjectId",
    locationId: "ObjectId",
    locationType: "enum",
    stockRecordId: "ObjectId",
    beforeQuantity: "number",
    afterQuantity: "number",
    quantityChange: "number",
    action: "enum",
    reason: "string?",
    relatedTransactionId: "ObjectId?",
    relatedTransactionType: "enum?",
    isIncrease: "boolean", // virtual
    isDecrease: "boolean", // virtual
    createdAt: "date",
    updatedAt: "date",
  },
};

export default {
  LOCATION_TYPE,
  STOCK_AUDIT_ACTION,
  RELATED_TRANSACTION_TYPE,
  STOCK_AUDIT_LOG_FIELDS,
  STOCK_AUDIT_LOG_DEFAULTS,
  STOCK_AUDIT_LOG_TYPES,
  getValidLocationTypes,
  getValidActions,
  getValidRelatedTransactionTypes,
  getValidRelatedTransactionTypesWithNull,
  isValidLocationType,
  isValidAction,
  isValidRelatedTransactionType,
};
