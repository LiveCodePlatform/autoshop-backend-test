/**
 * Warehouse Inventory DTOs (Data Transfer Objects)
 * Transforms data between layers using types from types/warehouseInventory.types.js
 */

import {
  WAREHOUSE_INVENTORY_FIELDS,
  WAREHOUSE_INVENTORY_DEFAULTS,
} from "../types/warehouseInventory.types.js";

/**
 * Create Warehouse Inventory DTO
 * Transforms request data for creating warehouse inventory
 */
export class CreateWarehouseInventoryDTO {
  constructor(data) {
    this.inventoryId = data[WAREHOUSE_INVENTORY_FIELDS.INVENTORY_ID];
    this.warehouseId = data[WAREHOUSE_INVENTORY_FIELDS.WAREHOUSE_ID];
    this.quantity =
      data[WAREHOUSE_INVENTORY_FIELDS.QUANTITY] !== undefined
        ? data[WAREHOUSE_INVENTORY_FIELDS.QUANTITY]
        : WAREHOUSE_INVENTORY_DEFAULTS.QUANTITY;
    this.isLowStock =
      data[WAREHOUSE_INVENTORY_FIELDS.IS_LOW_STOCK] !== undefined
        ? data[WAREHOUSE_INVENTORY_FIELDS.IS_LOW_STOCK]
        : WAREHOUSE_INVENTORY_DEFAULTS.IS_LOW_STOCK;
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      [WAREHOUSE_INVENTORY_FIELDS.INVENTORY_ID]: this.inventoryId,
      [WAREHOUSE_INVENTORY_FIELDS.WAREHOUSE_ID]: this.warehouseId,
      [WAREHOUSE_INVENTORY_FIELDS.QUANTITY]: this.quantity,
      [WAREHOUSE_INVENTORY_FIELDS.IS_LOW_STOCK]: this.isLowStock,
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
 * Update Warehouse Inventory DTO
 * Transforms request data for updating warehouse inventory
 */
export class UpdateWarehouseInventoryDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[WAREHOUSE_INVENTORY_FIELDS.QUANTITY] !== undefined) {
      this.quantity = data[WAREHOUSE_INVENTORY_FIELDS.QUANTITY];
    }
    if (data[WAREHOUSE_INVENTORY_FIELDS.IS_LOW_STOCK] !== undefined) {
      this.isLowStock = data[WAREHOUSE_INVENTORY_FIELDS.IS_LOW_STOCK];
    }
    if (data[WAREHOUSE_INVENTORY_FIELDS.LAST_UPDATED] !== undefined) {
      this.lastUpdated = data[WAREHOUSE_INVENTORY_FIELDS.LAST_UPDATED];
    }
  }

  /**
   * Convert to database update format
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.quantity !== undefined) {
      updateData[WAREHOUSE_INVENTORY_FIELDS.QUANTITY] = this.quantity;
    }
    if (this.isLowStock !== undefined) {
      updateData[WAREHOUSE_INVENTORY_FIELDS.IS_LOW_STOCK] = this.isLowStock;
    }
    if (this.lastUpdated !== undefined) {
      updateData[WAREHOUSE_INVENTORY_FIELDS.LAST_UPDATED] = this.lastUpdated;
    }

    return updateData;
  }
}

/**
 * Warehouse Inventory Response DTO
 * Transforms database model to API response format
 */
export class WarehouseInventoryResponseDTO {
  constructor(warehouseInventoryModel) {
    this.id = warehouseInventoryModel._id || warehouseInventoryModel.id;
    this.inventoryId =
      warehouseInventoryModel[WAREHOUSE_INVENTORY_FIELDS.INVENTORY_ID];
    this.warehouseId =
      warehouseInventoryModel[WAREHOUSE_INVENTORY_FIELDS.WAREHOUSE_ID];
    this.quantity =
      warehouseInventoryModel[WAREHOUSE_INVENTORY_FIELDS.QUANTITY] || 0;
    this.isLowStock =
      warehouseInventoryModel[WAREHOUSE_INVENTORY_FIELDS.IS_LOW_STOCK] || false;
    this.availableQuantity =
      warehouseInventoryModel[WAREHOUSE_INVENTORY_FIELDS.AVAILABLE_QUANTITY] ||
      warehouseInventoryModel[WAREHOUSE_INVENTORY_FIELDS.QUANTITY] ||
      0; // virtual
    this.lastUpdated =
      warehouseInventoryModel[WAREHOUSE_INVENTORY_FIELDS.LAST_UPDATED] ||
      warehouseInventoryModel[WAREHOUSE_INVENTORY_FIELDS.CREATED_AT];
    this.createdAt =
      warehouseInventoryModel[WAREHOUSE_INVENTORY_FIELDS.CREATED_AT];
    this.updatedAt =
      warehouseInventoryModel[WAREHOUSE_INVENTORY_FIELDS.UPDATED_AT];
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      inventoryId: this.inventoryId,
      warehouseId: this.warehouseId,
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
    return this.toJSON(); // All fields are public for warehouse inventory
  }

  /**
   * Static method to convert array of warehouse inventories
   * @param {Array} warehouseInventories
   * @returns {Array}
   */
  static fromArray(warehouseInventories) {
    return warehouseInventories.map(
      (inventory) => new WarehouseInventoryResponseDTO(inventory).toJSON()
    );
  }
}

/**
 * Warehouse Inventory List Response DTO (with pagination)
 */
export class WarehouseInventoryListResponseDTO {
  constructor(warehouseInventories, pagination) {
    this.warehouseInventories =
      WarehouseInventoryResponseDTO.fromArray(warehouseInventories);
    this.pagination = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    };
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      success: true,
      data: this.warehouseInventories,
      pagination: this.pagination,
    };
  }
}

export default {
  CreateWarehouseInventoryDTO,
  UpdateWarehouseInventoryDTO,
  WarehouseInventoryResponseDTO,
  WarehouseInventoryListResponseDTO,
};
