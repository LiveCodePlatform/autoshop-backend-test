/**
 * Social Media Sale Inventory Types - Pure Definitions
 * Field names, enums, and defaults only (no validation rules/constraints)
 * Validation rules belong in validators/
 */

/**
 * Social Media Sale Inventory Field Names
 */
export const SOCIAL_MEDIA_SALE_INVENTORY_FIELDS = {
  INVENTORY_ID: "inventoryId",
  QUANTITY: "quantity",
  SELLING_GUIDE_PROMPT: "sellingGuidePrompt",
  BUYING_GUIDE_PROMPT: "buyingGuidePrompt",
  IS_LOW_STOCK: "isLowStock",
  LAST_UPDATED: "lastUpdated",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
};

/**
 * Default Values (not constraints - just default values)
 */
export const SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS = {
  QUANTITY: 0,
  IS_LOW_STOCK: false,
  SELLING_GUIDE_PROMPT: "Need to fill this field for more effective selling for the bot.",
  BUYING_GUIDE_PROMPT: "Need to fill this field to guide the customer how to buy the product.",
};

/**
 * Helper Functions
 */
// No enums needed for social media sale inventory, but helper functions can be added if needed

/**
 * Social Media Sale Inventory Type Definitions
 */
export const SOCIAL_MEDIA_SALE_INVENTORY_TYPES = {
  // Create Social Media Sale Inventory Input Type
  CREATE_SOCIAL_MEDIA_SALE_INVENTORY_INPUT: {
    inventoryIds: "ObjectId[]",
    quantity: "number?",
    sellingGuidePrompt: "string?",
    buyingGuidePrompt: "string?",
  },

  // Update Social Media Sale Inventory Quantity Input Type
  UPDATE_SOCIAL_MEDIA_SALE_INVENTORY_QUANTITY_INPUT: {
    quantityChange: "number",
    reason: "string?",
  },

  // Social Media Sale Inventory Response Type (what client sees)
  SOCIAL_MEDIA_SALE_INVENTORY_RESPONSE: {
    id: "string",
    inventoryId: "ObjectId",
    quantity: "number",
    sellingGuidePrompt: "string",
    buyingGuidePrompt: "string",
    isLowStock: "boolean",
    lastUpdated: "date",
    createdAt: "date",
    updatedAt: "date",
  },
};

export default {
  SOCIAL_MEDIA_SALE_INVENTORY_FIELDS,
  SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS,
  SOCIAL_MEDIA_SALE_INVENTORY_TYPES,
};
