/**
 * Purchasing DTOs (Data Transfer Objects)
 * Transforms data between layers using types from types/purchasing.types.js
 */

import {
  PURCHASING_FIELDS,
  PRODUCT_FIELDS,
  PURCHASING_DEFAULTS,
  PRODUCT_DEFAULTS,
} from "../types/purchasing.types.js";

/**
 * Product DTO (for products array)
 * Transforms product data for creating/updating purchasing
 */
export class ProductDTO {
  constructor(data) {
    this.inventoryId = data[PRODUCT_FIELDS.INVENTORY_ID];
    this.productStatus =
      data[PRODUCT_FIELDS.PRODUCT_STATUS] || PRODUCT_DEFAULTS.PRODUCT_STATUS;
    this.productName = data[PRODUCT_FIELDS.PRODUCT_NAME];
    this.buyingPrice = data[PRODUCT_FIELDS.BUYING_PRICE];
    this.purchaseQuantity = data[PRODUCT_FIELDS.PURCHASE_QUANTITY];
    this.receivedQuantity =
      data[PRODUCT_FIELDS.RECEIVED_QUANTITY] !== undefined
        ? data[PRODUCT_FIELDS.RECEIVED_QUANTITY]
        : PRODUCT_DEFAULTS.RECEIVED_QUANTITY;
    this.productCode = data[PRODUCT_FIELDS.PRODUCT_CODE];
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      [PRODUCT_FIELDS.INVENTORY_ID]: this.inventoryId,
      [PRODUCT_FIELDS.PRODUCT_STATUS]: this.productStatus,
      [PRODUCT_FIELDS.PRODUCT_NAME]: this.productName,
      [PRODUCT_FIELDS.BUYING_PRICE]: this.buyingPrice,
      [PRODUCT_FIELDS.PURCHASE_QUANTITY]: this.purchaseQuantity,
      [PRODUCT_FIELDS.RECEIVED_QUANTITY]: this.receivedQuantity,
      [PRODUCT_FIELDS.PRODUCT_CODE]: this.productCode,
      [PRODUCT_FIELDS.IS_DELETED]: PRODUCT_DEFAULTS.IS_DELETED,
      [PRODUCT_FIELDS.DELETED_AT]: PRODUCT_DEFAULTS.DELETED_AT,
    };
  }
}

/**
 * Product Response DTO
 * Transforms product model to API response format
 */
export class ProductResponseDTO {
  constructor(productModel) {
    this.inventoryId = productModel[PRODUCT_FIELDS.INVENTORY_ID];
    this.productStatus =
      productModel[PRODUCT_FIELDS.PRODUCT_STATUS] ||
      PRODUCT_DEFAULTS.PRODUCT_STATUS;
    this.productName = productModel[PRODUCT_FIELDS.PRODUCT_NAME];
    this.buyingPrice = productModel[PRODUCT_FIELDS.BUYING_PRICE];
    this.purchaseQuantity = productModel[PRODUCT_FIELDS.PURCHASE_QUANTITY];
    this.receivedQuantity =
      productModel[PRODUCT_FIELDS.RECEIVED_QUANTITY] ||
      PRODUCT_DEFAULTS.RECEIVED_QUANTITY;
    this.productCode = productModel[PRODUCT_FIELDS.PRODUCT_CODE];
    this.remainingQuantity =
      productModel[PRODUCT_FIELDS.REMAINING_QUANTITY] || 0; // virtual field
    this.isDeleted =
      productModel[PRODUCT_FIELDS.IS_DELETED] !== undefined
        ? productModel[PRODUCT_FIELDS.IS_DELETED]
        : PRODUCT_DEFAULTS.IS_DELETED;
    this.deletedAt = productModel[PRODUCT_FIELDS.DELETED_AT] || null;
    this.createdAt = productModel[PRODUCT_FIELDS.CREATED_AT];
    this.updatedAt = productModel[PRODUCT_FIELDS.UPDATED_AT];
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      inventoryId: this.inventoryId,
      productStatus: this.productStatus,
      productName: this.productName,
      buyingPrice: this.buyingPrice,
      purchaseQuantity: this.purchaseQuantity,
      receivedQuantity: this.receivedQuantity,
      productCode: this.productCode,
      remainingQuantity: this.remainingQuantity,
      isDeleted: this.isDeleted,
      deletedAt: this.deletedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * Create Purchasing DTO
 * Transforms request data for creating purchasing
 */
export class CreatePurchasingDTO {
  constructor(data) {
    this.poNumber = data[PURCHASING_FIELDS.PO_NUMBER]; // Optional, can be auto-generated
    this.supplierId = data[PURCHASING_FIELDS.SUPPLIER_ID];
    this.products = (data[PURCHASING_FIELDS.PRODUCTS] || []).map(
      (product) => new ProductDTO(product)
    );
    this.status =
      data[PURCHASING_FIELDS.STATUS] || PURCHASING_DEFAULTS.STATUS;
    this.note = data[PURCHASING_FIELDS.NOTE] || PURCHASING_DEFAULTS.NOTE;
    this.totalAmount = data[PURCHASING_FIELDS.TOTAL_AMOUNT];
    this.purchasedBy = data[PURCHASING_FIELDS.PURCHASED_BY];
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      ...(this.poNumber && { [PURCHASING_FIELDS.PO_NUMBER]: this.poNumber }),
      [PURCHASING_FIELDS.SUPPLIER_ID]: this.supplierId,
      [PURCHASING_FIELDS.PRODUCTS]: this.products.map((product) =>
        product.toModel()
      ),
      [PURCHASING_FIELDS.STATUS]: this.status,
      [PURCHASING_FIELDS.NOTE]: this.note,
      [PURCHASING_FIELDS.TOTAL_AMOUNT]: this.totalAmount,
      [PURCHASING_FIELDS.PURCHASED_BY]: this.purchasedBy,
      [PURCHASING_FIELDS.IS_DELETED]: PURCHASING_DEFAULTS.IS_DELETED,
      [PURCHASING_FIELDS.DELETED_AT]: PURCHASING_DEFAULTS.DELETED_AT,
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
 * Update Purchasing DTO
 * Transforms request data for updating purchasing
 */
export class UpdatePurchasingDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[PURCHASING_FIELDS.PO_NUMBER] !== undefined)
      this.poNumber = data[PURCHASING_FIELDS.PO_NUMBER];
    if (data[PURCHASING_FIELDS.SUPPLIER_ID] !== undefined)
      this.supplierId = data[PURCHASING_FIELDS.SUPPLIER_ID];
    if (data[PURCHASING_FIELDS.PRODUCTS] !== undefined)
      this.products = data[PURCHASING_FIELDS.PRODUCTS].map(
        (product) => new ProductDTO(product)
      );
    if (data[PURCHASING_FIELDS.STATUS] !== undefined)
      this.status = data[PURCHASING_FIELDS.STATUS];
    if (data[PURCHASING_FIELDS.NOTE] !== undefined)
      this.note = data[PURCHASING_FIELDS.NOTE];
    if (data[PURCHASING_FIELDS.TOTAL_AMOUNT] !== undefined)
      this.totalAmount = data[PURCHASING_FIELDS.TOTAL_AMOUNT];
    if (data[PURCHASING_FIELDS.PURCHASED_BY] !== undefined)
      this.purchasedBy = data[PURCHASING_FIELDS.PURCHASED_BY];
  }

  /**
   * Convert to database update format
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.poNumber !== undefined)
      updateData[PURCHASING_FIELDS.PO_NUMBER] = this.poNumber;
    if (this.supplierId !== undefined)
      updateData[PURCHASING_FIELDS.SUPPLIER_ID] = this.supplierId;
    if (this.products !== undefined)
      updateData[PURCHASING_FIELDS.PRODUCTS] = this.products.map((product) =>
        product.toModel()
      );
    if (this.status !== undefined)
      updateData[PURCHASING_FIELDS.STATUS] = this.status;
    if (this.note !== undefined)
      updateData[PURCHASING_FIELDS.NOTE] = this.note;
    if (this.totalAmount !== undefined)
      updateData[PURCHASING_FIELDS.TOTAL_AMOUNT] = this.totalAmount;
    if (this.purchasedBy !== undefined)
      updateData[PURCHASING_FIELDS.PURCHASED_BY] = this.purchasedBy;

    return updateData;
  }
}

/**
 * Purchasing Response DTO
 * Transforms database model to API response format
 */
export class PurchasingResponseDTO {
  constructor(purchasingModel) {
    this.id = purchasingModel._id || purchasingModel.id;
    this.poNumber = purchasingModel[PURCHASING_FIELDS.PO_NUMBER];
    this.supplierId = purchasingModel[PURCHASING_FIELDS.SUPPLIER_ID];
    this.products = (purchasingModel[PURCHASING_FIELDS.PRODUCTS] || []).map(
      (product) => new ProductResponseDTO(product).toJSON()
    );
    this.status =
      purchasingModel[PURCHASING_FIELDS.STATUS] ||
      PURCHASING_DEFAULTS.STATUS;
    this.note =
      purchasingModel[PURCHASING_FIELDS.NOTE] || PURCHASING_DEFAULTS.NOTE;
    this.totalAmount = purchasingModel[PURCHASING_FIELDS.TOTAL_AMOUNT];
    this.purchasedBy = purchasingModel[PURCHASING_FIELDS.PURCHASED_BY];
    this.isDeleted =
      purchasingModel[PURCHASING_FIELDS.IS_DELETED] !== undefined
        ? purchasingModel[PURCHASING_FIELDS.IS_DELETED]
        : PURCHASING_DEFAULTS.IS_DELETED;
    this.deletedAt = purchasingModel[PURCHASING_FIELDS.DELETED_AT] || null;
    this.createdAt = purchasingModel[PURCHASING_FIELDS.CREATED_AT];
    this.updatedAt = purchasingModel[PURCHASING_FIELDS.UPDATED_AT];
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      poNumber: this.poNumber,
      supplierId: this.supplierId,
      products: this.products,
      status: this.status,
      note: this.note,
      totalAmount: this.totalAmount,
      purchasedBy: this.purchasedBy,
      isDeleted: this.isDeleted,
      deletedAt: this.deletedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convert to public format (exclude sensitive data if any)
   * @returns {Object}
   */
  toPublicJSON() {
    return this.toJSON(); // All fields are public for purchasing
  }

  /**
   * Static method to convert array of purchasings
   * @param {Array} purchasings
   * @returns {Array}
   */
  static fromArray(purchasings) {
    return purchasings.map(
      (purchasing) => new PurchasingResponseDTO(purchasing).toJSON()
    );
  }
}

/**
 * Purchasing List Response DTO (with pagination)
 */
export class PurchasingListResponseDTO {
  constructor(purchasings, pagination, message = "Purchasing records retrieved successfully") {
    this.purchasings = PurchasingResponseDTO.fromArray(purchasings);
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
      data: this.purchasings,
      pagination: this.pagination,
    };
  }
}

export default {
  ProductDTO,
  ProductResponseDTO,
  CreatePurchasingDTO,
  UpdatePurchasingDTO,
  PurchasingResponseDTO,
  PurchasingListResponseDTO,
};
