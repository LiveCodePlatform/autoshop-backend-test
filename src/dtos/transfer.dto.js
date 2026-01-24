/**
 * Transfer DTOs (Data Transfer Objects)
 * Transforms data between layers using types from types/transfer.types.js
 */

import {
  TRANSFER_FIELDS,
  TRANSFER_LINE_ITEM_FIELDS,
  TRANSFER_DEFAULTS,
  TRANSFER_LINE_ITEM_DEFAULTS,
  TRANSFER_STATUS,
} from "../types/transfer.types.js";

/**
 * Transfer Line Item DTO
 * Transforms line item data for creating/updating transfer
 */
export class TransferLineItemDTO {
  constructor(data) {
    this.inventoryId = data[TRANSFER_LINE_ITEM_FIELDS.INVENTORY_ID];
    this.quantity = data[TRANSFER_LINE_ITEM_FIELDS.QUANTITY];
    this.grnLineItemId =
      data[TRANSFER_LINE_ITEM_FIELDS.GRN_LINE_ITEM_ID] ||
      TRANSFER_LINE_ITEM_DEFAULTS.GRN_LINE_ITEM_ID;
    this.notes =
      data[TRANSFER_LINE_ITEM_FIELDS.NOTES] ||
      TRANSFER_LINE_ITEM_DEFAULTS.NOTES;
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      [TRANSFER_LINE_ITEM_FIELDS.INVENTORY_ID]: this.inventoryId,
      [TRANSFER_LINE_ITEM_FIELDS.QUANTITY]: this.quantity,
      [TRANSFER_LINE_ITEM_FIELDS.GRN_LINE_ITEM_ID]: this.grnLineItemId,
      [TRANSFER_LINE_ITEM_FIELDS.NOTES]: this.notes,
    };
  }
}

/**
 * Transfer Line Item Response DTO
 * Transforms line item model to API response format
 */
export class TransferLineItemResponseDTO {
  constructor(lineItemModel) {
    this.id = lineItemModel._id || lineItemModel.id;
    this.inventoryId = lineItemModel[TRANSFER_LINE_ITEM_FIELDS.INVENTORY_ID];
    this.quantity = lineItemModel[TRANSFER_LINE_ITEM_FIELDS.QUANTITY];
    this.grnLineItemId =
      lineItemModel[TRANSFER_LINE_ITEM_FIELDS.GRN_LINE_ITEM_ID] || null;
    this.notes = lineItemModel[TRANSFER_LINE_ITEM_FIELDS.NOTES] || null;
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      inventoryId: this.inventoryId,
      quantity: this.quantity,
      grnLineItemId: this.grnLineItemId,
      notes: this.notes,
    };
  }
}

/**
 * Create Transfer DTO
 * Transforms request data for creating transfer
 */
export class CreateTransferDTO {
  constructor(data) {
    this.transferNumber = data[TRANSFER_FIELDS.TRANSFER_NUMBER]; // Optional, can be auto-generated
    this.sourceType = data[TRANSFER_FIELDS.SOURCE_TYPE];
    this.sourceId = data[TRANSFER_FIELDS.SOURCE_ID];
    this.destinationWarehouseId =
      data[TRANSFER_FIELDS.DESTINATION_WAREHOUSE_ID] || null;
    this.destinationStorefrontId =
      data[TRANSFER_FIELDS.DESTINATION_STOREFRONT_ID] || null;
    this.lineItems = (data[TRANSFER_FIELDS.LINE_ITEMS] || []).map(
      (lineItem) => new TransferLineItemDTO(lineItem)
    );
    this.status = data[TRANSFER_FIELDS.STATUS] || TRANSFER_DEFAULTS.STATUS;
    this.transferDate =
      data[TRANSFER_FIELDS.TRANSFER_DATE] || new Date();
    this.notes = data[TRANSFER_FIELDS.NOTES] || TRANSFER_DEFAULTS.NOTES;
    this.transferredBy = data[TRANSFER_FIELDS.TRANSFERRED_BY];
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      ...(this.transferNumber && {
        [TRANSFER_FIELDS.TRANSFER_NUMBER]: this.transferNumber,
      }),
      [TRANSFER_FIELDS.SOURCE_TYPE]: this.sourceType,
      [TRANSFER_FIELDS.SOURCE_ID]: this.sourceId,
      ...(this.destinationWarehouseId && {
        [TRANSFER_FIELDS.DESTINATION_WAREHOUSE_ID]: this.destinationWarehouseId,
      }),
      ...(this.destinationStorefrontId && {
        [TRANSFER_FIELDS.DESTINATION_STOREFRONT_ID]:
          this.destinationStorefrontId,
      }),
      [TRANSFER_FIELDS.LINE_ITEMS]: this.lineItems.map((lineItem) =>
        lineItem.toModel()
      ),
      [TRANSFER_FIELDS.STATUS]: this.status,
      [TRANSFER_FIELDS.TRANSFER_DATE]: this.transferDate,
      [TRANSFER_FIELDS.NOTES]: this.notes,
      [TRANSFER_FIELDS.TRANSFERRED_BY]: this.transferredBy,
      [TRANSFER_FIELDS.IS_DELETED]: TRANSFER_DEFAULTS.IS_DELETED,
      [TRANSFER_FIELDS.DELETED_AT]: TRANSFER_DEFAULTS.DELETED_AT,
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
 * Update Transfer DTO
 * Transforms request data for updating transfer
 */
export class UpdateTransferDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[TRANSFER_FIELDS.SOURCE_TYPE] !== undefined)
      this.sourceType = data[TRANSFER_FIELDS.SOURCE_TYPE];
    if (data[TRANSFER_FIELDS.SOURCE_ID] !== undefined)
      this.sourceId = data[TRANSFER_FIELDS.SOURCE_ID];
    if (data[TRANSFER_FIELDS.DESTINATION_WAREHOUSE_ID] !== undefined)
      this.destinationWarehouseId =
        data[TRANSFER_FIELDS.DESTINATION_WAREHOUSE_ID] || null;
    if (data[TRANSFER_FIELDS.DESTINATION_STOREFRONT_ID] !== undefined)
      this.destinationStorefrontId =
        data[TRANSFER_FIELDS.DESTINATION_STOREFRONT_ID] || null;
    if (data[TRANSFER_FIELDS.LINE_ITEMS] !== undefined)
      this.lineItems = data[TRANSFER_FIELDS.LINE_ITEMS].map(
        (lineItem) => new TransferLineItemDTO(lineItem)
      );
    if (data[TRANSFER_FIELDS.STATUS] !== undefined)
      this.status = data[TRANSFER_FIELDS.STATUS];
    if (data[TRANSFER_FIELDS.TRANSFER_DATE] !== undefined)
      this.transferDate = data[TRANSFER_FIELDS.TRANSFER_DATE];
    if (data[TRANSFER_FIELDS.RECEIVED_DATE] !== undefined)
      this.receivedDate = data[TRANSFER_FIELDS.RECEIVED_DATE] || null;
    if (data[TRANSFER_FIELDS.NOTES] !== undefined)
      this.notes = data[TRANSFER_FIELDS.NOTES] || null;
  }

  /**
   * Convert to database update format
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.sourceType !== undefined)
      updateData[TRANSFER_FIELDS.SOURCE_TYPE] = this.sourceType;
    if (this.sourceId !== undefined)
      updateData[TRANSFER_FIELDS.SOURCE_ID] = this.sourceId;
    if (this.destinationWarehouseId !== undefined)
      updateData[TRANSFER_FIELDS.DESTINATION_WAREHOUSE_ID] =
        this.destinationWarehouseId;
    if (this.destinationStorefrontId !== undefined)
      updateData[TRANSFER_FIELDS.DESTINATION_STOREFRONT_ID] =
        this.destinationStorefrontId;
    if (this.lineItems !== undefined)
      updateData[TRANSFER_FIELDS.LINE_ITEMS] = this.lineItems.map(
        (lineItem) => lineItem.toModel()
      );
    if (this.status !== undefined)
      updateData[TRANSFER_FIELDS.STATUS] = this.status;
    if (this.transferDate !== undefined)
      updateData[TRANSFER_FIELDS.TRANSFER_DATE] = this.transferDate;
    if (this.receivedDate !== undefined)
      updateData[TRANSFER_FIELDS.RECEIVED_DATE] = this.receivedDate;
    if (this.notes !== undefined)
      updateData[TRANSFER_FIELDS.NOTES] = this.notes;

    return updateData;
  }
}

/**
 * Transfer Response DTO
 * Transforms database model to API response format
 */
export class TransferResponseDTO {
  constructor(transferModel) {
    this.id = transferModel._id || transferModel.id;
    this.transferNumber = transferModel[TRANSFER_FIELDS.TRANSFER_NUMBER];
    this.sourceType = transferModel[TRANSFER_FIELDS.SOURCE_TYPE];
    this.sourceId = transferModel[TRANSFER_FIELDS.SOURCE_ID];
    this.destinationWarehouseId =
      transferModel[TRANSFER_FIELDS.DESTINATION_WAREHOUSE_ID] || null;
    this.destinationStorefrontId =
      transferModel[TRANSFER_FIELDS.DESTINATION_STOREFRONT_ID] || null;
    this.lineItems = (transferModel[TRANSFER_FIELDS.LINE_ITEMS] || []).map(
      (lineItem) => new TransferLineItemResponseDTO(lineItem).toJSON()
    );
    this.status =
      transferModel[TRANSFER_FIELDS.STATUS] || TRANSFER_DEFAULTS.STATUS;
    this.transferDate = transferModel[TRANSFER_FIELDS.TRANSFER_DATE];
    this.receivedDate =
      transferModel[TRANSFER_FIELDS.RECEIVED_DATE] ||
      TRANSFER_DEFAULTS.RECEIVED_DATE;
    this.notes = transferModel[TRANSFER_FIELDS.NOTES] || null;
    this.totalQuantity = transferModel.totalQuantity || null; // virtual field
    this.isDeleted =
      transferModel[TRANSFER_FIELDS.IS_DELETED] !== undefined
        ? transferModel[TRANSFER_FIELDS.IS_DELETED]
        : TRANSFER_DEFAULTS.IS_DELETED;
    this.deletedAt =
      transferModel[TRANSFER_FIELDS.DELETED_AT] ||
      TRANSFER_DEFAULTS.DELETED_AT;
    this.transferredBy = transferModel[TRANSFER_FIELDS.TRANSFERRED_BY];
    this.createdAt = transferModel[TRANSFER_FIELDS.CREATED_AT];
    this.updatedAt = transferModel[TRANSFER_FIELDS.UPDATED_AT];
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      transferNumber: this.transferNumber,
      sourceType: this.sourceType,
      sourceId: this.sourceId,
      destinationWarehouseId: this.destinationWarehouseId,
      destinationStorefrontId: this.destinationStorefrontId,
      lineItems: this.lineItems,
      status: this.status,
      transferDate: this.transferDate,
      receivedDate: this.receivedDate,
      notes: this.notes,
      totalQuantity: this.totalQuantity,
      isDeleted: this.isDeleted,
      deletedAt: this.deletedAt,
      transferredBy: this.transferredBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convert to public format (exclude sensitive data if any)
   * @returns {Object}
   */
  toPublicJSON() {
    return this.toJSON(); // All fields are public for transfer
  }

  /**
   * Static method to convert array of transfers
   * @param {Array} transfers
   * @returns {Array}
   */
  static fromArray(transfers) {
    return transfers.map(
      (transfer) => new TransferResponseDTO(transfer).toJSON()
    );
  }
}

/**
 * Transfer List Response DTO (with pagination)
 */
export class TransferListResponseDTO {
  constructor(transfers, pagination, message = "Transfers retrieved successfully") {
    this.transfers = TransferResponseDTO.fromArray(transfers);
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
      data: this.transfers,
      pagination: this.pagination,
    };
  }
}

export default {
  TransferLineItemDTO,
  TransferLineItemResponseDTO,
  CreateTransferDTO,
  UpdateTransferDTO,
  TransferResponseDTO,
  TransferListResponseDTO,
};
