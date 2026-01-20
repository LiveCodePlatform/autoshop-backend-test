/**
 * Warehouse Inventory Types - Pure Definitions
 * Field names, enums, and defaults only (no validation rules/constraints)
 * Validation rules belong in validators/
 */

/**
 * Warehouse Inventory Field Names
 */
export const WAREHOUSE_INVENTORY_FIELDS = {
  INVENTORY_ID: "inventoryId",
  WAREHOUSE_ID: "warehouseId",
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
export const WAREHOUSE_INVENTORY_DEFAULTS = {
  QUANTITY: 0,
  IS_LOW_STOCK: false,
};

/**
 * Helper Functions
 */
// No enums needed for warehouse inventory, but helper functions can be added if needed

/**
 * Warehouse Inventory Type Definitions
 */
export const WAREHOUSE_INVENTORY_TYPES = {
  // Create Warehouse Inventory Input Type
  CREATE_WAREHOUSE_INVENTORY_INPUT: {
    inventoryId: "ObjectId",
    warehouseId: "ObjectId",
    quantity: "number?",
    isLowStock: "boolean?",
  },

  // Update Warehouse Inventory Input Type
  UPDATE_WAREHOUSE_INVENTORY_INPUT: {
    quantity: "number?",
    isLowStock: "boolean?",
    lastUpdated: "date?",
  },

  // Warehouse Inventory Response Type (what client sees)
  WAREHOUSE_INVENTORY_RESPONSE: {
    id: "string",
    inventoryId: "ObjectId",
    warehouseId: "ObjectId",
    quantity: "number",
    isLowStock: "boolean",
    availableQuantity: "number", // virtual
    lastUpdated: "date",
    createdAt: "date",
    updatedAt: "date",
  },
};

export default {
  WAREHOUSE_INVENTORY_FIELDS,
  WAREHOUSE_INVENTORY_DEFAULTS,
  WAREHOUSE_INVENTORY_TYPES,
};
