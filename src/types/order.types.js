/**
 * Order Types - Pure Definitions
 * Field names, enums, and defaults only (no validation rules/constraints)
 * Validation rules belong in validators/
 */

/**
 * Order Status Enum
 */
export const ORDER_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

/**
 * Payment Type Enum
 */
export const PAYMENT_TYPE = {
  CREDIT: "credit",
  PAID: "paid",
};

/**
 * Payment Method Enum
 */
export const PAYMENT_METHOD = {
  CASH: "cash",
  CARD: "card",
  MOBILE_PAYMENT: "mobile_payment",
  BANK_TRANSFER: "bank_transfer",
  CHEQUE: "cheque",
  OTHER: "other",
};

/**
 * Order Field Names
 */
export const ORDER_FIELDS = {
  ORDER_NUMBER: "orderNumber",
  STOREFRONT_ID: "storefrontId",
  ORDERS_PRODUCTS: "ordersProducts",
  INVENTORY_ID: "inventoryId",
  QUANTITY: "quantity",
  UNIT_PRICE: "unitPrice",
  CREDIT_PERSON_ID: "creditPersonId",
  SUB_TOTAL: "subTotal",
  TAX: "tax",
  DISCOUNT: "discount",
  FINAL_AMOUNT: "finalAmount",
  PAID_AMOUNT: "paidAmount",
  EXTRA_CHANGE: "extraChange",
  ORDER_STATUS: "orderStatus",
  SOLD_BY: "soldBy",
  IS_DELETED: "isDeleted",
  DELETED_AT: "deletedAt",
  PAYMENT_TYPE: "paymentType",
  PAYMENT_METHOD: "paymentMethod",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
};

/**
 * Default Values (not constraints - just default values)
 */
export const ORDER_DEFAULTS = {
  TAX: 0,
  DISCOUNT: 0,
  EXTRA_CHANGE: 0,
  ORDER_STATUS: ORDER_STATUS.PENDING,
  PAYMENT_TYPE: PAYMENT_TYPE.PAID,
  PAYMENT_METHOD: PAYMENT_METHOD.CASH,
  IS_DELETED: false,
  DELETED_AT: null,
  SUB_TOTAL: null,
  CREDIT_PERSON_ID: null,
};

/**
 * Helper Functions
 */
export const getValidOrderStatuses = () => Object.values(ORDER_STATUS);
export const getValidPaymentTypes = () => Object.values(PAYMENT_TYPE);
export const getValidPaymentMethods = () => Object.values(PAYMENT_METHOD);
export const isValidOrderStatus = (status) =>
  Object.values(ORDER_STATUS).includes(status);
export const isValidPaymentType = (type) =>
  Object.values(PAYMENT_TYPE).includes(type);
export const isValidPaymentMethod = (method) =>
  Object.values(PAYMENT_METHOD).includes(method);

/**
 * Order Type Definitions
 */
export const ORDER_TYPES = {
  // Create Order Input Type
  CREATE_ORDER_INPUT: {
    storefrontId: "ObjectId",
    ordersProducts: "OrderProduct[]",
    creditPersonId: "ObjectId?",
    subTotal: "number?",
    tax: "number?",
    discount: "number?",
    finalAmount: "number",
    paidAmount: "number",
    orderStatus: "enum?",
    soldBy: "ObjectId",
    paymentType: "enum?",
    paymentMethod: "enum?",
  },

  // Order Product Input Type
  ORDER_PRODUCT_INPUT: {
    inventoryId: "ObjectId",
    quantity: "number",
    unitPrice: "number",
  },

  // Update Order Input Type
  UPDATE_ORDER_INPUT: {
    orderStatus: "enum?",
    creditPersonId: "ObjectId?",
    subTotal: "number?",
    tax: "number?",
    discount: "number?",
    finalAmount: "number?",
    paidAmount: "number?",
    paymentType: "enum?",
    paymentMethod: "enum?",
  },

  // Order Response Type (what client sees)
  ORDER_RESPONSE: {
    id: "string",
    orderNumber: "string?",
    storefrontId: "ObjectId",
    ordersProducts: "OrderProduct[]",
    creditPersonId: "ObjectId?",
    subTotal: "number?",
    tax: "number",
    discount: "number",
    finalAmount: "number",
    paidAmount: "number",
    extraChange: "number",
    orderStatus: "enum",
    soldBy: "ObjectId",
    isDeleted: "boolean",
    deletedAt: "date?",
    paymentType: "enum",
    paymentMethod: "enum",
    totalPaidAmount: "number?", // virtual
    remainingBalance: "number?", // virtual
    createdAt: "date",
    updatedAt: "date",
  },
};

export default {
  ORDER_STATUS,
  PAYMENT_TYPE,
  PAYMENT_METHOD,
  ORDER_FIELDS,
  ORDER_DEFAULTS,
  ORDER_TYPES,
  getValidOrderStatuses,
  getValidPaymentTypes,
  getValidPaymentMethods,
  isValidOrderStatus,
  isValidPaymentType,
  isValidPaymentMethod,
};
