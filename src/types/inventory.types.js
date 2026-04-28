/**
 * Inventory Types - Pure Definitions
 * Field names, enums, and defaults only (no validation rules/constraints)
 * Validation rules belong in validators/
 */

/**
 * Inventory Status Enum
 */
export const INVENTORY_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DISCONTINUED: "discontinued",
};

/**
 * Unit of Measure Enum
 */
export const UNIT_OF_MEASURE = {
  PIECE: "piece",
  KG: "kg",
  GRAM: "gram",
  LITER: "liter",
  ML: "ml",
  METER: "meter",
  CM: "cm",
  BOX: "box",
  PACK: "pack",
  CARTON: "carton",
  DOZEN: "dozen",
  PAIR: "pair",
};

/**
 * Inventory Field Names
 */
export const INVENTORY_FIELDS = {
  PRODUCT_NAME: "productName",
  PRODUCT_CODE: "productCode",
  SALE_CODE: "saleCode",
  SKU: "SKU",
  BARCODE: "barcode",
  CATEGORY: "category",
  SUB_CATEGORY: "subCategory",
  BRAND: "brand",
  DESCRIPTION: "description",
  BUYING_PRICE: "buyingPrice",
  SELLING_PRICE: "sellingPrice",
  UNIT_OF_MEASURE: "unitOfMeasure",
  REORDER_POINT: "reorderPoint",
  REORDER_QUANTITY: "reorderQuantity",
  TAX_RATE: "taxRate",
  STATUS: "status",
  TAGS: "tags",
  IMAGES: "images",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
};

/**
 * Default Values (not constraints - just default values)
 */
export const INVENTORY_DEFAULTS = {
  CATEGORY: "Unknown",
  SUB_CATEGORY: "Unknown",
  BRAND: "Unknown",
  DESCRIPTION: "",
  UNIT_OF_MEASURE: UNIT_OF_MEASURE.PIECE,
  REORDER_POINT: 0,
  REORDER_QUANTITY: 0,
  TAX_RATE: 0,
  STATUS: INVENTORY_STATUS.ACTIVE,
  TAGS: [],
};

/**
 * Helper Functions
 */
export const getValidStatuses = () => Object.values(INVENTORY_STATUS);
export const getValidUnitsOfMeasure = () => Object.values(UNIT_OF_MEASURE);
export const isValidStatus = (status) =>
  Object.values(INVENTORY_STATUS).includes(status);
export const isValidUnitOfMeasure = (unit) =>
  Object.values(UNIT_OF_MEASURE).includes(unit);

/**
 * Inventory Type Definitions
 */
export const INVENTORY_TYPES = {
  // Create Inventory Input Type
  CREATE_INVENTORY_INPUT: {
    productName: "string",
    productCode: "string",
    saleCode: "string?",
    SKU: "string?",
    barcode: "string?",
    category: "string",
    subCategory: "string?",
    brand: "string?",
    description: "string?",
    buyingPrice: "number",
    sellingPrice: "number",
    unitOfMeasure: "enum",
    reorderPoint: "number?",
    reorderQuantity: "number?",
    taxRate: "number?",
    status: "enum?",
    tags: "string[]?",
    images: "object[]?",
  },

  // Update Inventory Input Type
  UPDATE_INVENTORY_INPUT: {
    productName: "string?",
    productCode: "string?",
    saleCode: "string?",
    SKU: "string?",
    barcode: "string?",
    category: "string?",
    subCategory: "string?",
    brand: "string?",
    description: "string?",
    buyingPrice: "number?",
    sellingPrice: "number?",
    unitOfMeasure: "enum?",
    reorderPoint: "number?",
    reorderQuantity: "number?",
    taxRate: "number?",
    status: "enum?",
    tags: "string[]?",
    images: "object[]?",
  },

  // Inventory Response Type (what client sees)
  INVENTORY_RESPONSE: {
    id: "string",
    productName: "string",
    productCode: "string",
    saleCode: "string?",
    SKU: "string?",
    barcode: "string?",
    category: "string",
    subCategory: "string?",
    brand: "string?",
    description: "string?",
    buyingPrice: "number",
    sellingPrice: "number",
    unitOfMeasure: "enum",
    reorderPoint: "number",
    reorderQuantity: "number",
    taxRate: "number",
    status: "enum",
    tags: "string[]",
    images: "object[]",
    profitMargin: "number", // virtual
    profitAmount: "number", // virtual
    createdAt: "date",
    updatedAt: "date",
  },
};

export default {
  INVENTORY_STATUS,
  UNIT_OF_MEASURE,
  INVENTORY_FIELDS,
  INVENTORY_DEFAULTS,
  INVENTORY_TYPES,
  getValidStatuses,
  getValidUnitsOfMeasure,
  isValidStatus,
  isValidUnitOfMeasure,
};
