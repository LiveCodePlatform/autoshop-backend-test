/**
 * Storefront Inventory DTOs (Data Transfer Objects)
 * Transforms data between layers using types from types/storefrontInventory.types.js
 */

import {
  STOREFRONT_INVENTORY_FIELDS,
  STOREFRONT_INVENTORY_DEFAULTS,
} from "../types/storefrontInventory.types.js";

/**
 * Create Storefront Inventory DTO
 * Transforms request data for creating storefront inventory
 */
export class CreateStorefrontInventoryDTO {
  constructor(data) {
    this.inventoryId = data[STOREFRONT_INVENTORY_FIELDS.INVENTORY_ID];
    this.storefrontId = data[STOREFRONT_INVENTORY_FIELDS.STOREFRONT_ID];
    this.quantity =
      data[STOREFRONT_INVENTORY_FIELDS.QUANTITY] !== undefined
        ? data[STOREFRONT_INVENTORY_FIELDS.QUANTITY]
        : STOREFRONT_INVENTORY_DEFAULTS.QUANTITY;
    this.isLowStock =
      data[STOREFRONT_INVENTORY_FIELDS.IS_LOW_STOCK] !== undefined
        ? data[STOREFRONT_INVENTORY_FIELDS.IS_LOW_STOCK]
        : STOREFRONT_INVENTORY_DEFAULTS.IS_LOW_STOCK;
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      [STOREFRONT_INVENTORY_FIELDS.INVENTORY_ID]: this.inventoryId,
      [STOREFRONT_INVENTORY_FIELDS.STOREFRONT_ID]: this.storefrontId,
      [STOREFRONT_INVENTORY_FIELDS.QUANTITY]: this.quantity,
      [STOREFRONT_INVENTORY_FIELDS.IS_LOW_STOCK]: this.isLowStock,
    };
  }

  /**
   * Get safe object (exclude sensitive data if any)
   * @returns {Object}
   */
  toSafeObject() {
    return this.toModel();
  }
}

/**
 * Update Storefront Inventory DTO
 * Transforms request data for updating storefront inventory
 */
export class UpdateStorefrontInventoryDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[STOREFRONT_INVENTORY_FIELDS.QUANTITY] !== undefined) {
      this.quantity = data[STOREFRONT_INVENTORY_FIELDS.QUANTITY];
    }
    if (data[STOREFRONT_INVENTORY_FIELDS.IS_LOW_STOCK] !== undefined) {
      this.isLowStock = data[STOREFRONT_INVENTORY_FIELDS.IS_LOW_STOCK];
    }
    if (data[STOREFRONT_INVENTORY_FIELDS.LAST_UPDATED] !== undefined) {
      this.lastUpdated = data[STOREFRONT_INVENTORY_FIELDS.LAST_UPDATED];
    }
  }

  /**
   * Convert to database update format
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.quantity !== undefined) {
      updateData[STOREFRONT_INVENTORY_FIELDS.QUANTITY] = this.quantity;
    }
    if (this.isLowStock !== undefined) {
      updateData[STOREFRONT_INVENTORY_FIELDS.IS_LOW_STOCK] = this.isLowStock;
    }
    if (this.lastUpdated !== undefined) {
      updateData[STOREFRONT_INVENTORY_FIELDS.LAST_UPDATED] = this.lastUpdated;
    }

    return updateData;
  }
}

/**
 * Storefront Inventory Response DTO
 * Transforms database model to API response format
 */
export class StorefrontInventoryResponseDTO {
  constructor(storefrontInventoryModel) {
    this.id = storefrontInventoryModel._id || storefrontInventoryModel.id;
    this.storefrontId =
      storefrontInventoryModel[STOREFRONT_INVENTORY_FIELDS.STOREFRONT_ID];
    this.inventoryId =
      storefrontInventoryModel[STOREFRONT_INVENTORY_FIELDS.INVENTORY_ID];
    this.quantity =
      storefrontInventoryModel[STOREFRONT_INVENTORY_FIELDS.QUANTITY] || 0;
    this.isLowStock =
      storefrontInventoryModel[STOREFRONT_INVENTORY_FIELDS.IS_LOW_STOCK] || false;
    this.availableQuantity =
      storefrontInventoryModel[STOREFRONT_INVENTORY_FIELDS.AVAILABLE_QUANTITY] ||
      storefrontInventoryModel[STOREFRONT_INVENTORY_FIELDS.QUANTITY] ||
      0; // virtual
    this.lastUpdated =
      storefrontInventoryModel[STOREFRONT_INVENTORY_FIELDS.LAST_UPDATED] ||
      storefrontInventoryModel[STOREFRONT_INVENTORY_FIELDS.CREATED_AT];
    this.createdAt =
      storefrontInventoryModel[STOREFRONT_INVENTORY_FIELDS.CREATED_AT];
    this.updatedAt =
      storefrontInventoryModel[STOREFRONT_INVENTORY_FIELDS.UPDATED_AT];
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      storefrontId: this.storefrontId,
      inventoryId: this.inventoryId,
      quantity: this.quantity,
      isLowStock: this.isLowStock,
      availableQuantity: this.availableQuantity,
      lastUpdated: this.lastUpdated,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convert to public format (exclude sensitive data if any)
   * @returns {Object}
   */
  toPublicJSON() {
    return this.toJSON(); // All fields are public for storefront inventory
  }

  /**
   * Static method to convert array of storefront inventories
   * @param {Array} storefrontInventories
   * @returns {Array}
   */
  static fromArray(storefrontInventories) {
    return storefrontInventories.map(
      (inventory) => new StorefrontInventoryResponseDTO(inventory).toJSON()
    );
  }
}

/**
 * Storefront Inventory List Response DTO (with pagination)
 */
export class StorefrontInventoryListResponseDTO {
  constructor(storefrontInventories, pagination, message = "Storefront inventory retrieved successfully") {
    this.storefrontInventories =
      StorefrontInventoryResponseDTO.fromArray(storefrontInventories);
    this.pagination = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    };
    this.message = message;
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      success: true,
      message: this.message,
      data: this.storefrontInventories,
      pagination: this.pagination,
    };
  }
}

export default {
  CreateStorefrontInventoryDTO,
  UpdateStorefrontInventoryDTO,
  StorefrontInventoryResponseDTO,
  StorefrontInventoryListResponseDTO,
};
