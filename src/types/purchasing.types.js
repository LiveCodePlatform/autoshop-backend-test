/**
 * Purchasing Types - Pure Definitions
 * Field names, enums, and defaults only (no validation rules/constraints)
 * Validation rules belong in validators/
 */

/**
 * Purchasing Status Enum
 */
export const PURCHASING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  ARRIVED: "arrived",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
};

/**
 * Product Status Enum (for products in purchasing)
 */
export const PRODUCT_STATUS = {
  PENDING: "pending",
  SEPERATED: "seperated",
};

/**
 * Purchasing Field Names
 */
export const PURCHASING_FIELDS = {
  PO_NUMBER: "poNumber",
  SUPPLIER_ID: "supplierId",
  PRODUCTS: "products",
  STATUS: "status",
  NOTE: "note",
  TOTAL_AMOUNT: "totalAmount",
  PURCHASED_BY: "purchasedBy",
  IS_DELETED: "isDeleted",
  DELETED_AT: "deletedAt",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
};

/**
 * Product Field Names (for products in purchasing)
 */
export const PRODUCT_FIELDS = {
  INVENTORY_ID: "inventoryId",
  PRODUCT_STATUS: "productStatus",
  PRODUCT_NAME: "productName",
  BUYING_PRICE: "buyingPrice",
  PURCHASE_QUANTITY: "purchaseQuantity",
  RECEIVED_QUANTITY: "receivedQuantity",
  PRODUCT_CODE: "productCode",
  REMAINING_QUANTITY: "remainingQuantity", // virtual
  IS_DELETED: "isDeleted",
  DELETED_AT: "deletedAt",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
};

/**
 * Default Values (not constraints - just default values)
 */
export const PURCHASING_DEFAULTS = {
  STATUS: PURCHASING_STATUS.PENDING,
  NOTE: "No note available",
  IS_DELETED: false,
  DELETED_AT: null,
};

/**
 * Product Default Values (for products in purchasing)
 */
export const PRODUCT_DEFAULTS = {
  PRODUCT_STATUS: PRODUCT_STATUS.PENDING,
  RECEIVED_QUANTITY: 0,
  IS_DELETED: false,
  DELETED_AT: null,
};

/**
 * Helper Functions
 */
export const isValidPurchasingStatus = (status) =>
  Object.values(PURCHASING_STATUS).includes(status);

export const isValidProductStatus = (status) =>
  Object.values(PRODUCT_STATUS).includes(status);

/**
 * Purchasing Type Definitions
 */
export const PURCHASING_TYPES = {
  // Product Input Type (for products array)
  PRODUCT_INPUT: {
    inventoryId: "string", // ObjectId as string
    productStatus: "enum?",
    productName: "string",
    buyingPrice: "number",
    purchaseQuantity: "number",
    receivedQuantity: "number?",
    productCode: "string",
  },

  // Product Response Type
  PRODUCT_RESPONSE: {
    inventoryId: "string", // ObjectId as string
    productStatus: "enum",
    productName: "string",
    buyingPrice: "number",
    purchaseQuantity: "number",
    receivedQuantity: "number",
    productCode: "string",
    remainingQuantity: "number", // virtual
    isDeleted: "boolean",
    deletedAt: "date?",
    createdAt: "date",
    updatedAt: "date",
  },

  // Create Purchasing Input Type
  CREATE_PURCHASING_INPUT: {
    poNumber: "string?",
    supplierId: "string", // ObjectId as string
    products: "ProductInput[]",
    status: "enum?",
    note: "string?",
    totalAmount: "number",
    purchasedBy: "string", // ObjectId as string
  },

  // Update Purchasing Input Type
  UPDATE_PURCHASING_INPUT: {
    poNumber: "string?",
    supplierId: "string?", // ObjectId as string
    products: "ProductInput[]?",
    status: "enum?",
    note: "string?",
    totalAmount: "number?",
    purchasedBy: "string?", // ObjectId as string
  },

  // Purchasing Response Type (what client sees)
  PURCHASING_RESPONSE: {
    id: "string",
    poNumber: "string",
    supplierId: "string", // ObjectId as string
    products: "ProductResponse[]",
    status: "enum",
    note: "string",
    totalAmount: "number",
    purchasedBy: "string", // ObjectId as string
    isDeleted: "boolean",
    deletedAt: "date?",
    createdAt: "date",
    updatedAt: "date",
  },
};

export default {
  PURCHASING_STATUS,
  PRODUCT_STATUS,
  PURCHASING_FIELDS,
  PRODUCT_FIELDS,
  PURCHASING_DEFAULTS,
  PRODUCT_DEFAULTS,
  PURCHASING_TYPES,
  isValidPurchasingStatus,
  isValidProductStatus,
};
