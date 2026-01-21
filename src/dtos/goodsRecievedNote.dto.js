/**
 * Goods Received Note (GRN) DTOs (Data Transfer Objects)
 * Transforms data between layers using types from types/goodsRecievedNote.types.js
 */

import {
  GRN_FIELDS,
  GRN_LINE_ITEM_FIELDS,
  GRN_DEFAULTS,
  GRN_LINE_ITEM_DEFAULTS,
} from "../types/goodsRecievedNote.types.js";

/**
 * GRN Line Item DTO
 * Transforms line item data for creating/updating GRN
 */
export class GRNLineItemDTO {
  constructor(data) {
    this.inventoryId = data[GRN_LINE_ITEM_FIELDS.INVENTORY_ID];
    this.receivedQuantity = data[GRN_LINE_ITEM_FIELDS.RECEIVED_QUANTITY];
    this.goodQuantity = data[GRN_LINE_ITEM_FIELDS.GOOD_QUANTITY];
    this.badQuantity =
      data[GRN_LINE_ITEM_FIELDS.BAD_QUANTITY] !== undefined
        ? data[GRN_LINE_ITEM_FIELDS.BAD_QUANTITY]
        : GRN_LINE_ITEM_DEFAULTS.BAD_QUANTITY;
    this.transferredQuantity =
      data[GRN_LINE_ITEM_FIELDS.TRANSFERRED_QUANTITY] !== undefined
        ? data[GRN_LINE_ITEM_FIELDS.TRANSFERRED_QUANTITY]
        : GRN_LINE_ITEM_DEFAULTS.TRANSFERRED_QUANTITY;
    this.unitPrice = data[GRN_LINE_ITEM_FIELDS.UNIT_PRICE];
    this.totalPrice = data[GRN_LINE_ITEM_FIELDS.TOTAL_PRICE];
    this.notes =
      data[GRN_LINE_ITEM_FIELDS.NOTES] || GRN_LINE_ITEM_DEFAULTS.NOTES;
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      [GRN_LINE_ITEM_FIELDS.INVENTORY_ID]: this.inventoryId,
      [GRN_LINE_ITEM_FIELDS.RECEIVED_QUANTITY]: this.receivedQuantity,
      [GRN_LINE_ITEM_FIELDS.GOOD_QUANTITY]: this.goodQuantity,
      [GRN_LINE_ITEM_FIELDS.BAD_QUANTITY]: this.badQuantity,
      [GRN_LINE_ITEM_FIELDS.TRANSFERRED_QUANTITY]: this.transferredQuantity,
      [GRN_LINE_ITEM_FIELDS.UNIT_PRICE]: this.unitPrice,
      [GRN_LINE_ITEM_FIELDS.TOTAL_PRICE]: this.totalPrice,
      [GRN_LINE_ITEM_FIELDS.NOTES]: this.notes,
    };
  }
}

/**
 * GRN Line Item Response DTO
 * Transforms line item model to API response format
 */
export class GRNLineItemResponseDTO {
  constructor(lineItemModel) {
    this.id = lineItemModel._id || lineItemModel.id;
    this.inventoryId = lineItemModel[GRN_LINE_ITEM_FIELDS.INVENTORY_ID];
    this.receivedQuantity =
      lineItemModel[GRN_LINE_ITEM_FIELDS.RECEIVED_QUANTITY];
    this.goodQuantity = lineItemModel[GRN_LINE_ITEM_FIELDS.GOOD_QUANTITY];
    this.badQuantity =
      lineItemModel[GRN_LINE_ITEM_FIELDS.BAD_QUANTITY] ||
      GRN_LINE_ITEM_DEFAULTS.BAD_QUANTITY;
    this.transferredQuantity =
      lineItemModel[GRN_LINE_ITEM_FIELDS.TRANSFERRED_QUANTITY] ||
      GRN_LINE_ITEM_DEFAULTS.TRANSFERRED_QUANTITY;
    this.unitPrice = lineItemModel[GRN_LINE_ITEM_FIELDS.UNIT_PRICE];
    this.totalPrice = lineItemModel[GRN_LINE_ITEM_FIELDS.TOTAL_PRICE];
    this.notes = lineItemModel[GRN_LINE_ITEM_FIELDS.NOTES] || null;
    this.profitMargin = lineItemModel.profitMargin || null; // virtual field
    this.profitAmount = lineItemModel.profitAmount || null; // virtual field
    this.availableQuantity =
      lineItemModel.availableQuantity || null; // virtual field
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      inventoryId: this.inventoryId,
      receivedQuantity: this.receivedQuantity,
      goodQuantity: this.goodQuantity,
      badQuantity: this.badQuantity,
      transferredQuantity: this.transferredQuantity,
      unitPrice: this.unitPrice,
      totalPrice: this.totalPrice,
      notes: this.notes,
      profitMargin: this.profitMargin,
      profitAmount: this.profitAmount,
      availableQuantity: this.availableQuantity,
    };
  }
}

/**
 * Create GRN DTO
 * Transforms request data for creating GRN
 */
export class CreateGRNDTO {
  constructor(data) {
    this.grnNumber = data[GRN_FIELDS.GRN_NUMBER]; // Optional, can be auto-generated
    this.purchasingId = data[GRN_FIELDS.PURCHASING_ID];
    this.grnDate = data[GRN_FIELDS.GRN_DATE] || new Date();
    this.status = data[GRN_FIELDS.STATUS] || GRN_DEFAULTS.STATUS;
    this.lineItems = (data[GRN_FIELDS.LINE_ITEMS] || []).map(
      (lineItem) => new GRNLineItemDTO(lineItem)
    );
    this.notes = data[GRN_FIELDS.NOTES] || GRN_DEFAULTS.NOTES;
    this.totalAmount = data[GRN_FIELDS.TOTAL_AMOUNT];
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      ...(this.grnNumber && { [GRN_FIELDS.GRN_NUMBER]: this.grnNumber }),
      [GRN_FIELDS.PURCHASING_ID]: this.purchasingId,
      [GRN_FIELDS.GRN_DATE]: this.grnDate,
      [GRN_FIELDS.STATUS]: this.status,
      [GRN_FIELDS.LINE_ITEMS]: this.lineItems.map((lineItem) =>
        lineItem.toModel()
      ),
      [GRN_FIELDS.NOTES]: this.notes,
      [GRN_FIELDS.TOTAL_AMOUNT]: this.totalAmount,
      [GRN_FIELDS.IS_DELETED]: GRN_DEFAULTS.IS_DELETED,
      [GRN_FIELDS.DELETED_AT]: GRN_DEFAULTS.DELETED_AT,
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
 * Update GRN DTO
 * Transforms request data for updating GRN
 */
export class UpdateGRNDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[GRN_FIELDS.GRN_NUMBER] !== undefined)
      this.grnNumber = data[GRN_FIELDS.GRN_NUMBER];
    if (data[GRN_FIELDS.PURCHASING_ID] !== undefined)
      this.purchasingId = data[GRN_FIELDS.PURCHASING_ID];
    if (data[GRN_FIELDS.GRN_DATE] !== undefined)
      this.grnDate = data[GRN_FIELDS.GRN_DATE];
    if (data[GRN_FIELDS.STATUS] !== undefined)
      this.status = data[GRN_FIELDS.STATUS];
    if (data[GRN_FIELDS.LINE_ITEMS] !== undefined)
      this.lineItems = data[GRN_FIELDS.LINE_ITEMS].map(
        (lineItem) => new GRNLineItemDTO(lineItem)
      );
    if (data[GRN_FIELDS.NOTES] !== undefined)
      this.notes = data[GRN_FIELDS.NOTES] || null;
    if (data[GRN_FIELDS.TOTAL_AMOUNT] !== undefined)
      this.totalAmount = data[GRN_FIELDS.TOTAL_AMOUNT];
  }

  /**
   * Convert to database update format
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.grnNumber !== undefined)
      updateData[GRN_FIELDS.GRN_NUMBER] = this.grnNumber;
    if (this.purchasingId !== undefined)
      updateData[GRN_FIELDS.PURCHASING_ID] = this.purchasingId;
    if (this.grnDate !== undefined)
      updateData[GRN_FIELDS.GRN_DATE] = this.grnDate;
    if (this.status !== undefined)
      updateData[GRN_FIELDS.STATUS] = this.status;
    if (this.lineItems !== undefined)
      updateData[GRN_FIELDS.LINE_ITEMS] = this.lineItems.map((lineItem) =>
        lineItem.toModel()
      );
    if (this.notes !== undefined) updateData[GRN_FIELDS.NOTES] = this.notes;
    if (this.totalAmount !== undefined)
      updateData[GRN_FIELDS.TOTAL_AMOUNT] = this.totalAmount;

    return updateData;
  }
}

/**
 * GRN Response DTO
 * Transforms database model to API response format
 */
export class GRNResponseDTO {
  constructor(grnModel) {
    this.id = grnModel._id || grnModel.id;
    this.grnNumber = grnModel[GRN_FIELDS.GRN_NUMBER];
    this.purchasingId = grnModel[GRN_FIELDS.PURCHASING_ID];
    this.grnDate = grnModel[GRN_FIELDS.GRN_DATE];
    this.status = grnModel[GRN_FIELDS.STATUS] || GRN_DEFAULTS.STATUS;
    this.lineItems = (grnModel[GRN_FIELDS.LINE_ITEMS] || []).map(
      (lineItem) => new GRNLineItemResponseDTO(lineItem).toJSON()
    );
    this.notes = grnModel[GRN_FIELDS.NOTES] || GRN_DEFAULTS.NOTES;
    this.totalAmount = grnModel[GRN_FIELDS.TOTAL_AMOUNT];
    this.totalReceivedQuantity = grnModel.totalReceivedQuantity || null; // virtual field
    this.totalGoodQuantity = grnModel.totalGoodQuantity || null; // virtual field
    this.totalBadQuantity = grnModel.totalBadQuantity || null; // virtual field
    this.isDeleted =
      grnModel[GRN_FIELDS.IS_DELETED] !== undefined
        ? grnModel[GRN_FIELDS.IS_DELETED]
        : GRN_DEFAULTS.IS_DELETED;
    this.deletedAt =
      grnModel[GRN_FIELDS.DELETED_AT] || GRN_DEFAULTS.DELETED_AT;
    this.createdAt = grnModel[GRN_FIELDS.CREATED_AT];
    this.updatedAt = grnModel[GRN_FIELDS.UPDATED_AT];
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      grnNumber: this.grnNumber,
      purchasingId: this.purchasingId,
      grnDate: this.grnDate,
      status: this.status,
      lineItems: this.lineItems,
      notes: this.notes,
      totalAmount: this.totalAmount,
      totalReceivedQuantity: this.totalReceivedQuantity,
      totalGoodQuantity: this.totalGoodQuantity,
      totalBadQuantity: this.totalBadQuantity,
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
    return this.toJSON(); // All fields are public for GRN
  }

  /**
   * Static method to convert array of GRNs
   * @param {Array} grns
   * @returns {Array}
   */
  static fromArray(grns) {
    return grns.map((grn) => new GRNResponseDTO(grn).toJSON());
  }
}

/**
 * GRN List Response DTO (with pagination)
 */
export class GRNListResponseDTO {
  constructor(grns, pagination) {
    this.grns = GRNResponseDTO.fromArray(grns);
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
      data: this.grns,
      pagination: this.pagination,
    };
  }
}

export default {
  GRNLineItemDTO,
  GRNLineItemResponseDTO,
  CreateGRNDTO,
  UpdateGRNDTO,
  GRNResponseDTO,
  GRNListResponseDTO,
};
