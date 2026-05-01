/**
 * Stock Audit Log DTOs (Data Transfer Objects)
 * Transforms data between layers using types from types/stockAuditLog.types.js
 */

import {
  STOCK_AUDIT_LOG_FIELDS,
  STOCK_AUDIT_LOG_DEFAULTS,
  LOCATION_TYPE,
  STOCK_AUDIT_ACTION,
  RELATED_TRANSACTION_TYPE,
  isValidLocationType,
  isValidAction,
  isValidRelatedTransactionType,
} from "../types/stockAuditLog.types.js";

/**
 * Create Stock Audit Log DTO
 * Transforms request data for creating stock audit log
 */
export class CreateStockAuditLogDTO {
  constructor(data) {
    this.inventoryId = data[STOCK_AUDIT_LOG_FIELDS.INVENTORY_ID];
    this.adminId = data[STOCK_AUDIT_LOG_FIELDS.ADMIN_ID];
    this.locationId = data[STOCK_AUDIT_LOG_FIELDS.LOCATION_ID];
    this.locationType = data[STOCK_AUDIT_LOG_FIELDS.LOCATION_TYPE];
    this.stockRecordId = data[STOCK_AUDIT_LOG_FIELDS.STOCK_RECORD_ID];
    this.beforeQuantity = data[STOCK_AUDIT_LOG_FIELDS.BEFORE_QUANTITY];
    this.afterQuantity = data[STOCK_AUDIT_LOG_FIELDS.AFTER_QUANTITY];
    this.quantityChange = data[STOCK_AUDIT_LOG_FIELDS.QUANTITY_CHANGE];
    this.action = data[STOCK_AUDIT_LOG_FIELDS.ACTION];
    this.reason =
      data[STOCK_AUDIT_LOG_FIELDS.REASON] || STOCK_AUDIT_LOG_DEFAULTS.REASON;
    this.relatedTransactionId =
      data[STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_ID] ||
      STOCK_AUDIT_LOG_DEFAULTS.RELATED_TRANSACTION_ID;
    this.relatedTransactionType =
      data[STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_TYPE] ||
      STOCK_AUDIT_LOG_DEFAULTS.RELATED_TRANSACTION_TYPE;
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    const modelData = {
      [STOCK_AUDIT_LOG_FIELDS.INVENTORY_ID]: this.inventoryId,
      [STOCK_AUDIT_LOG_FIELDS.ADMIN_ID]: this.adminId,
      [STOCK_AUDIT_LOG_FIELDS.LOCATION_ID]: this.locationId,
      [STOCK_AUDIT_LOG_FIELDS.LOCATION_TYPE]: this.locationType,
      [STOCK_AUDIT_LOG_FIELDS.STOCK_RECORD_ID]: this.stockRecordId,
      [STOCK_AUDIT_LOG_FIELDS.BEFORE_QUANTITY]: this.beforeQuantity,
      [STOCK_AUDIT_LOG_FIELDS.AFTER_QUANTITY]: this.afterQuantity,
      [STOCK_AUDIT_LOG_FIELDS.QUANTITY_CHANGE]: this.quantityChange,
      [STOCK_AUDIT_LOG_FIELDS.ACTION]: this.action,
    };

    // Only include optional fields if they are not null
    if (this.reason !== null && this.reason !== undefined) {
      modelData[STOCK_AUDIT_LOG_FIELDS.REASON] = this.reason;
    }
    if (
      this.relatedTransactionId !== null &&
      this.relatedTransactionId !== undefined
    ) {
      modelData[STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_ID] =
        this.relatedTransactionId;
    }
    if (
      this.relatedTransactionType !== null &&
      this.relatedTransactionType !== undefined
    ) {
      modelData[STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_TYPE] =
        this.relatedTransactionType;
    }

    return modelData;
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
 * Update Stock Audit Log DTO
 * Transforms request data for updating stock audit log
 * Note: Stock audit logs are typically immutable, but this is included for completeness
 */
export class UpdateStockAuditLogDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[STOCK_AUDIT_LOG_FIELDS.REASON] !== undefined) {
      this.reason = data[STOCK_AUDIT_LOG_FIELDS.REASON] || null;
    }
    if (data[STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_ID] !== undefined) {
      this.relatedTransactionId =
        data[STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_ID] || null;
    }
    if (data[STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_TYPE] !== undefined) {
      const transactionType =
        data[STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_TYPE];
      if (isValidRelatedTransactionType(transactionType)) {
        this.relatedTransactionType = transactionType || null;
      } else {
        throw new Error(
          `Invalid related transaction type. Must be one of: ${Object.values(
            RELATED_TRANSACTION_TYPE,
          )
            .filter((t) => t !== null)
            .join(", ")}, or null`,
        );
      }
    }
  }

  /**
   * Convert to database update format
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.reason !== undefined) {
      updateData[STOCK_AUDIT_LOG_FIELDS.REASON] = this.reason;
    }
    if (this.relatedTransactionId !== undefined) {
      updateData[STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_ID] =
        this.relatedTransactionId;
    }
    if (this.relatedTransactionType !== undefined) {
      updateData[STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_TYPE] =
        this.relatedTransactionType;
    }

    return updateData;
  }
}

/**
 * Stock Audit Log Response DTO
 * Transforms database model to API response format
 */
export class StockAuditLogResponseDTO {
  constructor(stockAuditLogModel) {
    this._id = stockAuditLogModel._id
      ? stockAuditLogModel._id.toString()
      : stockAuditLogModel.id;
    this.inventoryId = stockAuditLogModel[STOCK_AUDIT_LOG_FIELDS.INVENTORY_ID];
    this.adminId = stockAuditLogModel[STOCK_AUDIT_LOG_FIELDS.ADMIN_ID];
    this.locationId = stockAuditLogModel[STOCK_AUDIT_LOG_FIELDS.LOCATION_ID];
    this.locationType =
      stockAuditLogModel[STOCK_AUDIT_LOG_FIELDS.LOCATION_TYPE];
    this.stockRecordId =
      stockAuditLogModel[STOCK_AUDIT_LOG_FIELDS.STOCK_RECORD_ID];
    this.beforeQuantity =
      stockAuditLogModel[STOCK_AUDIT_LOG_FIELDS.BEFORE_QUANTITY];
    this.afterQuantity =
      stockAuditLogModel[STOCK_AUDIT_LOG_FIELDS.AFTER_QUANTITY];
    this.quantityChange =
      stockAuditLogModel[STOCK_AUDIT_LOG_FIELDS.QUANTITY_CHANGE];
    this.action = stockAuditLogModel[STOCK_AUDIT_LOG_FIELDS.ACTION];
    this.reason = stockAuditLogModel[STOCK_AUDIT_LOG_FIELDS.REASON] || null;
    this.relatedTransactionId =
      stockAuditLogModel[STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_ID] || null;
    this.relatedTransactionType =
      stockAuditLogModel[STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_TYPE] ||
      null;
    this.isIncrease = stockAuditLogModel.isIncrease || null; // virtual
    this.isDecrease = stockAuditLogModel.isDecrease || null; // virtual
    this.createdAt = stockAuditLogModel[STOCK_AUDIT_LOG_FIELDS.CREATED_AT];
    this.updatedAt = stockAuditLogModel[STOCK_AUDIT_LOG_FIELDS.UPDATED_AT];
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      _id: this._id,
      inventoryId: this.inventoryId,
      adminId: this.adminId,
      locationId: this.locationId,
      locationType: this.locationType,
      stockRecordId: this.stockRecordId,
      beforeQuantity: this.beforeQuantity,
      afterQuantity: this.afterQuantity,
      quantityChange: this.quantityChange,
      action: this.action,
      reason: this.reason,
      relatedTransactionId: this.relatedTransactionId,
      relatedTransactionType: this.relatedTransactionType,
      isIncrease: this.isIncrease,
      isDecrease: this.isDecrease,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convert to public format (exclude sensitive data if any)
   * @returns {Object}
   */
  toPublicJSON() {
    return this.toJSON(); // All fields are public for stock audit log
  }

  /**
   * Static method to convert array of stock audit logs
   * @param {Array} stockAuditLogs
   * @returns {Array}
   */
  static fromArray(stockAuditLogs) {
    return stockAuditLogs.map((log) =>
      new StockAuditLogResponseDTO(log).toJSON(),
    );
  }
}

/**
 * Stock Audit Log List Response DTO (with pagination)
 */
export class StockAuditLogListResponseDTO {
  constructor(
    stockAuditLogs,
    pagination,
    message = "Stock audit logs retrieved successfully",
  ) {
    this.stockAuditLogs = StockAuditLogResponseDTO.fromArray(stockAuditLogs);
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
      data: this.stockAuditLogs,
      pagination: this.pagination,
    };
  }
}

export default {
  CreateStockAuditLogDTO,
  UpdateStockAuditLogDTO,
  StockAuditLogResponseDTO,
  StockAuditLogListResponseDTO,
};
