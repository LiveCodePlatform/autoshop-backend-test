/**
 * Inventory DTOs (Data Transfer Objects)
 * Transforms data between layers using types from types/inventory.types.js
 */

import {
  INVENTORY_FIELDS,
  INVENTORY_DEFAULTS,
  INVENTORY_STATUS,
  UNIT_OF_MEASURE,
  isValidStatus,
  isValidUnitOfMeasure,
} from "../types/inventory.types.js";

/**
 * Create Inventory DTO
 * Transforms request data for creating inventory
 */
export class CreateInventoryDTO {
  constructor(data) {
    this.productName = data[INVENTORY_FIELDS.PRODUCT_NAME];
    this.productCode = data[INVENTORY_FIELDS.PRODUCT_CODE]?.toUpperCase();
    this.saleCode = data[INVENTORY_FIELDS.SALE_CODE]?.toUpperCase() || null;
    this.SKU = data[INVENTORY_FIELDS.SKU]?.toUpperCase() || null;
    this.barcode = data[INVENTORY_FIELDS.BARCODE] || null;
    this.category =
      data[INVENTORY_FIELDS.CATEGORY] || INVENTORY_DEFAULTS.CATEGORY;
    this.subCategory =
      data[INVENTORY_FIELDS.SUB_CATEGORY] || INVENTORY_DEFAULTS.SUB_CATEGORY;
    this.brand = data[INVENTORY_FIELDS.BRAND] || INVENTORY_DEFAULTS.BRAND;
    this.description =
      data[INVENTORY_FIELDS.DESCRIPTION] || INVENTORY_DEFAULTS.DESCRIPTION;
    this.buyingPrice = data[INVENTORY_FIELDS.BUYING_PRICE];
    this.sellingPrice = data[INVENTORY_FIELDS.SELLING_PRICE];
    this.unitOfMeasure =
      data[INVENTORY_FIELDS.UNIT_OF_MEASURE] || INVENTORY_DEFAULTS.UNIT_OF_MEASURE;
    this.reorderPoint =
      data[INVENTORY_FIELDS.REORDER_POINT] || INVENTORY_DEFAULTS.REORDER_POINT;
    this.reorderQuantity =
      data[INVENTORY_FIELDS.REORDER_QUANTITY] ||
      INVENTORY_DEFAULTS.REORDER_QUANTITY;
    this.taxRate = data[INVENTORY_FIELDS.TAX_RATE] || INVENTORY_DEFAULTS.TAX_RATE;
    this.status = data[INVENTORY_FIELDS.STATUS] || INVENTORY_DEFAULTS.STATUS;
    this.tags = data[INVENTORY_FIELDS.TAGS] || INVENTORY_DEFAULTS.TAGS;
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      [INVENTORY_FIELDS.PRODUCT_NAME]: this.productName,
      [INVENTORY_FIELDS.PRODUCT_CODE]: this.productCode,
      [INVENTORY_FIELDS.SALE_CODE]: this.saleCode,
      [INVENTORY_FIELDS.SKU]: this.SKU,
      [INVENTORY_FIELDS.BARCODE]: this.barcode,
      [INVENTORY_FIELDS.CATEGORY]: this.category,
      [INVENTORY_FIELDS.SUB_CATEGORY]: this.subCategory,
      [INVENTORY_FIELDS.BRAND]: this.brand,
      [INVENTORY_FIELDS.DESCRIPTION]: this.description,
      [INVENTORY_FIELDS.BUYING_PRICE]: this.buyingPrice,
      [INVENTORY_FIELDS.SELLING_PRICE]: this.sellingPrice,
      [INVENTORY_FIELDS.UNIT_OF_MEASURE]: this.unitOfMeasure,
      [INVENTORY_FIELDS.REORDER_POINT]: this.reorderPoint,
      [INVENTORY_FIELDS.REORDER_QUANTITY]: this.reorderQuantity,
      [INVENTORY_FIELDS.TAX_RATE]: this.taxRate,
      [INVENTORY_FIELDS.STATUS]: this.status,
      [INVENTORY_FIELDS.TAGS]: this.tags,
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
 * Update Inventory DTO
 * Transforms request data for updating inventory
 */
export class UpdateInventoryDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[INVENTORY_FIELDS.PRODUCT_NAME] !== undefined)
      this.productName = data[INVENTORY_FIELDS.PRODUCT_NAME];
    if (data[INVENTORY_FIELDS.PRODUCT_CODE] !== undefined)
      this.productCode = data[INVENTORY_FIELDS.PRODUCT_CODE]?.toUpperCase();
    if (data[INVENTORY_FIELDS.SALE_CODE] !== undefined)
      this.saleCode = data[INVENTORY_FIELDS.SALE_CODE]?.toUpperCase() || null;
    if (data[INVENTORY_FIELDS.SKU] !== undefined)
      this.SKU = data[INVENTORY_FIELDS.SKU]?.toUpperCase() || null;
    if (data[INVENTORY_FIELDS.BARCODE] !== undefined)
      this.barcode = data[INVENTORY_FIELDS.BARCODE] || null;
    if (data[INVENTORY_FIELDS.CATEGORY] !== undefined)
      this.category = data[INVENTORY_FIELDS.CATEGORY];
    if (data[INVENTORY_FIELDS.SUB_CATEGORY] !== undefined)
      this.subCategory = data[INVENTORY_FIELDS.SUB_CATEGORY] || null;
    if (data[INVENTORY_FIELDS.BRAND] !== undefined)
      this.brand = data[INVENTORY_FIELDS.BRAND] || null;
    if (data[INVENTORY_FIELDS.DESCRIPTION] !== undefined)
      this.description = data[INVENTORY_FIELDS.DESCRIPTION] || null;
    if (data[INVENTORY_FIELDS.BUYING_PRICE] !== undefined)
      this.buyingPrice = data[INVENTORY_FIELDS.BUYING_PRICE];
    if (data[INVENTORY_FIELDS.SELLING_PRICE] !== undefined)
      this.sellingPrice = data[INVENTORY_FIELDS.SELLING_PRICE];
    if (data[INVENTORY_FIELDS.UNIT_OF_MEASURE] !== undefined) {
      const unit = data[INVENTORY_FIELDS.UNIT_OF_MEASURE];
      if (isValidUnitOfMeasure(unit)) {
        this.unitOfMeasure = unit;
      } else {
        throw new Error(
          `Invalid unit of measure. Must be one of: ${Object.values(UNIT_OF_MEASURE).join(", ")}`
        );
      }
    }
    if (data[INVENTORY_FIELDS.REORDER_POINT] !== undefined)
      this.reorderPoint = data[INVENTORY_FIELDS.REORDER_POINT];
    if (data[INVENTORY_FIELDS.REORDER_QUANTITY] !== undefined)
      this.reorderQuantity = data[INVENTORY_FIELDS.REORDER_QUANTITY];
    if (data[INVENTORY_FIELDS.TAX_RATE] !== undefined)
      this.taxRate = data[INVENTORY_FIELDS.TAX_RATE];
    if (data[INVENTORY_FIELDS.STATUS] !== undefined) {
      const status = data[INVENTORY_FIELDS.STATUS];
      if (isValidStatus(status)) {
        this.status = status;
      } else {
        throw new Error(
          `Invalid status. Must be one of: ${Object.values(INVENTORY_STATUS).join(", ")}`
        );
      }
    }
    if (data[INVENTORY_FIELDS.TAGS] !== undefined)
      this.tags = data[INVENTORY_FIELDS.TAGS];
  }

  /**
   * Convert to database update format
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.productName !== undefined)
      updateData[INVENTORY_FIELDS.PRODUCT_NAME] = this.productName;
    if (this.productCode !== undefined)
      updateData[INVENTORY_FIELDS.PRODUCT_CODE] = this.productCode;
    if (this.saleCode !== undefined)
      updateData[INVENTORY_FIELDS.SALE_CODE] = this.saleCode;
    if (this.SKU !== undefined) updateData[INVENTORY_FIELDS.SKU] = this.SKU;
    if (this.barcode !== undefined)
      updateData[INVENTORY_FIELDS.BARCODE] = this.barcode;
    if (this.category !== undefined)
      updateData[INVENTORY_FIELDS.CATEGORY] = this.category;
    if (this.subCategory !== undefined)
      updateData[INVENTORY_FIELDS.SUB_CATEGORY] = this.subCategory;
    if (this.brand !== undefined) updateData[INVENTORY_FIELDS.BRAND] = this.brand;
    if (this.description !== undefined)
      updateData[INVENTORY_FIELDS.DESCRIPTION] = this.description;
    if (this.buyingPrice !== undefined)
      updateData[INVENTORY_FIELDS.BUYING_PRICE] = this.buyingPrice;
    if (this.sellingPrice !== undefined)
      updateData[INVENTORY_FIELDS.SELLING_PRICE] = this.sellingPrice;
    if (this.unitOfMeasure !== undefined)
      updateData[INVENTORY_FIELDS.UNIT_OF_MEASURE] = this.unitOfMeasure;
    if (this.reorderPoint !== undefined)
      updateData[INVENTORY_FIELDS.REORDER_POINT] = this.reorderPoint;
    if (this.reorderQuantity !== undefined)
      updateData[INVENTORY_FIELDS.REORDER_QUANTITY] = this.reorderQuantity;
    if (this.taxRate !== undefined)
      updateData[INVENTORY_FIELDS.TAX_RATE] = this.taxRate;
    if (this.status !== undefined)
      updateData[INVENTORY_FIELDS.STATUS] = this.status;
    if (this.tags !== undefined) updateData[INVENTORY_FIELDS.TAGS] = this.tags;

    return updateData;
  }
}

/**
 * Inventory Response DTO
 * Transforms database model to API response format
 */
export class InventoryResponseDTO {
  constructor(inventoryModel) {
    this.id = inventoryModel._id || inventoryModel.id;
    this.productName = inventoryModel[INVENTORY_FIELDS.PRODUCT_NAME];
    this.productCode = inventoryModel[INVENTORY_FIELDS.PRODUCT_CODE];
    this.saleCode = inventoryModel[INVENTORY_FIELDS.SALE_CODE] || null;
    this.SKU = inventoryModel[INVENTORY_FIELDS.SKU] || null;
    this.barcode = inventoryModel[INVENTORY_FIELDS.BARCODE] || null;
    this.category = inventoryModel[INVENTORY_FIELDS.CATEGORY];
    this.subCategory = inventoryModel[INVENTORY_FIELDS.SUB_CATEGORY] || null;
    this.brand = inventoryModel[INVENTORY_FIELDS.BRAND] || null;
    this.description = inventoryModel[INVENTORY_FIELDS.DESCRIPTION] || null;
    this.buyingPrice = inventoryModel[INVENTORY_FIELDS.BUYING_PRICE];
    this.sellingPrice = inventoryModel[INVENTORY_FIELDS.SELLING_PRICE];
    this.unitOfMeasure = inventoryModel[INVENTORY_FIELDS.UNIT_OF_MEASURE];
    this.reorderPoint = inventoryModel[INVENTORY_FIELDS.REORDER_POINT] || 0;
    this.reorderQuantity =
      inventoryModel[INVENTORY_FIELDS.REORDER_QUANTITY] || 0;
    this.taxRate = inventoryModel[INVENTORY_FIELDS.TAX_RATE] || 0;
    this.status = inventoryModel[INVENTORY_FIELDS.STATUS] || INVENTORY_STATUS.ACTIVE;
    this.tags = inventoryModel[INVENTORY_FIELDS.TAGS] || [];
    this.profitMargin = inventoryModel.profitMargin || null; // virtual
    this.profitAmount = inventoryModel.profitAmount || null; // virtual
    this.createdAt = inventoryModel[INVENTORY_FIELDS.CREATED_AT];
    this.updatedAt = inventoryModel[INVENTORY_FIELDS.UPDATED_AT];
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      productName: this.productName,
      productCode: this.productCode,
      saleCode: this.saleCode,
      SKU: this.SKU,
      barcode: this.barcode,
      category: this.category,
      subCategory: this.subCategory,
      brand: this.brand,
      description: this.description,
      buyingPrice: this.buyingPrice,
      sellingPrice: this.sellingPrice,
      unitOfMeasure: this.unitOfMeasure,
      reorderPoint: this.reorderPoint,
      reorderQuantity: this.reorderQuantity,
      taxRate: this.taxRate,
      status: this.status,
      tags: this.tags,
      profitMargin: this.profitMargin,
      profitAmount: this.profitAmount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convert to public format (exclude sensitive data if any)
   * @returns {Object}
   */
  toPublicJSON() {
    return this.toJSON(); // All fields are public for inventory
  }

  /**
   * Static method to convert array of inventories
   * @param {Array} inventories
   * @returns {Array}
   */
  static fromArray(inventories) {
    return inventories.map(
      (inventory) => new InventoryResponseDTO(inventory).toJSON()
    );
  }
}

/**
 * Inventory List Response DTO (with pagination)
 */
export class InventoryListResponseDTO {
  constructor(inventories, pagination, message = "Inventories retrieved successfully") {
    this.inventories = InventoryResponseDTO.fromArray(inventories);
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
      data: this.inventories,
      pagination: this.pagination,
    };
  }
}

export default {
  CreateInventoryDTO,
  UpdateInventoryDTO,
  InventoryResponseDTO,
  InventoryListResponseDTO,
};
