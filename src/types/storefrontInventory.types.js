/**
 * Storefront Inventory Types - Pure Definitions
 * Field names, enums, and defaults only (no validation rules/constraints)
 * Validation rules belong in validators/
 */

/**
 * Storefront Inventory Field Names
 */
export const STOREFRONT_INVENTORY_FIELDS = {
  STOREFRONT_ID: "storefrontId",
  INVENTORY_ID: "inventoryId",
  QUANTITY: "quantity",
  IS_LOW_STOCK: "isLowStock",
  LAST_UPDATED: "lastUpdated",
  AVAILABLE_QUANTITY: "availableQuantity", // virtual
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
};

/**
 * Default Values (not constraints - just default values)
 */
export const STOREFRONT_INVENTORY_DEFAULTS = {
  QUANTITY: 0,
  IS_LOW_STOCK: false,
};

/**
 * Helper Functions
 */
// No enums needed for storefront inventory, but helper functions can be added if needed

/**
 * Storefront Inventory Type Definitions
 */
export const STOREFRONT_INVENTORY_TYPES = {
  // Create Storefront Inventory Input Type
  CREATE_STOREFRONT_INVENTORY_INPUT: {
    storefrontId: "ObjectId",
    inventoryId: "ObjectId",
    quantity: "number?",
    isLowStock: "boolean?",
  },

  // Update Storefront Inventory Input Type
  UPDATE_STOREFRONT_INVENTORY_INPUT: {
    quantity: "number?",
    isLowStock: "boolean?",
    lastUpdated: "date?",
  },

  // Storefront Inventory Response Type (what client sees)
  STOREFRONT_INVENTORY_RESPONSE: {
    id: "string",
    storefrontId: "ObjectId",
    inventoryId: "ObjectId",
    quantity: "number",
    isLowStock: "boolean",
    availableQuantity: "number", // virtual
    lastUpdated: "date",
    createdAt: "date",
    updatedAt: "date",
  },
};

export default {
  STOREFRONT_INVENTORY_FIELDS,
  STOREFRONT_INVENTORY_DEFAULTS,
  STOREFRONT_INVENTORY_TYPES,
};
