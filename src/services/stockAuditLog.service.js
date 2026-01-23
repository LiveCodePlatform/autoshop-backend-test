/**
 * Stock Audit Log Service
 * Business logic layer for Stock Audit Log operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { StockAuditLogRepository } from "../repositories/stockAuditLog.repository.js";
import {
  CreateStockAuditLogDTO,
  StockAuditLogResponseDTO,
  StockAuditLogListResponseDTO,
} from "../dtos/stockAuditLog.dto.js";
import { ValidationError, NotFoundError, CastError } from "../errors/errorTypes.js";
import { STOCK_AUDIT_LOG_FIELDS, STOCK_AUDIT_ACTION } from "../types/stockAuditLog.types.js";
import mongoose from "mongoose";
import { createDateFilter } from "../shared/utils/dateFilter.utils.js";
import CustomError from "../shared/utils/customError.js";

export class StockAuditLogService {
  /**
   * @param {StockAuditLogRepository} repository - Injected repository instance (optional, fallback creates new instance)
   */
  constructor(repository) {
    this.repository = repository || new StockAuditLogRepository();
  }

  /**
   * Create new stock audit log entry
   * @param {Object} data - Request data
   * @param {Object} options - Options including session for transactions
   * @returns {Promise<StockAuditLogResponseDTO>} Created stock audit log DTO
   * @throws {ValidationError} If validation fails
   */
  async createStockAuditLog(data, options = {}) {
    const { session = null } = options;

    // Transform data using DTO
    const dto = new CreateStockAuditLogDTO(data);
    const auditLogData = dto.toModel();

    // Business logic: Validate quantityChange matches (afterQuantity - beforeQuantity)
    const expectedChange =
      auditLogData[STOCK_AUDIT_LOG_FIELDS.AFTER_QUANTITY] -
      auditLogData[STOCK_AUDIT_LOG_FIELDS.BEFORE_QUANTITY];
    if (
      auditLogData[STOCK_AUDIT_LOG_FIELDS.QUANTITY_CHANGE] !== expectedChange
    ) {
      throw new ValidationError(
        "Quantity change must equal (afterQuantity - beforeQuantity)",
        STOCK_AUDIT_LOG_FIELDS.QUANTITY_CHANGE
      );
    }

    // Create audit log
    const createOptions = session ? { session } : {};
    const newAuditLog = await this.repository.create(
      auditLogData,
      createOptions
    );

    // Return DTO
    return new StockAuditLogResponseDTO(newAuditLog);
  }

  /**
   * Get all stock audit logs with pagination and filters
   * @param {Object} queryParams - Query parameters (page, limit, filters, sortBy, sortOrder, dates)
   * @returns {Promise<StockAuditLogListResponseDTO>} List of stock audit log DTOs with pagination
   */
  async getAllStockAuditLogs(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      inventoryId,
      adminId,
      locationId,
      locationType,
      action,
      stockRecordId,
      relatedTransactionId,
      relatedTransactionType,
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate,
      endDate,
    } = queryParams;

    // Build query
    const query = {};

    if (inventoryId) {
      query[STOCK_AUDIT_LOG_FIELDS.INVENTORY_ID] = inventoryId;
    }

    if (adminId) {
      query[STOCK_AUDIT_LOG_FIELDS.ADMIN_ID] = adminId;
    }

    if (locationId) {
      query[STOCK_AUDIT_LOG_FIELDS.LOCATION_ID] = locationId;
    }

    if (locationType) {
      query[STOCK_AUDIT_LOG_FIELDS.LOCATION_TYPE] = locationType;
    }

    if (action) {
      query[STOCK_AUDIT_LOG_FIELDS.ACTION] = action;
    }

    if (stockRecordId) {
      query[STOCK_AUDIT_LOG_FIELDS.STOCK_RECORD_ID] = stockRecordId;
    }

    if (relatedTransactionId) {
      query[STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_ID] =
        relatedTransactionId;
    }

    if (relatedTransactionType) {
      query[STOCK_AUDIT_LOG_FIELDS.RELATED_TRANSACTION_TYPE] =
        relatedTransactionType;
    }

    // Add date range filter using dateFilter utility
    try {
      const dateQuery = { startDate, endDate };
      const dateFilter = createDateFilter(dateQuery, "createdAt", false);
      Object.assign(query, dateFilter);
    } catch (error) {
      // If it's a CustomError, rethrow it
      if (error instanceof CustomError) {
        throw error;
      }
      // For other errors, wrap and throw
      throw new ValidationError(
        error.message || "Invalid date filter",
        "dateFilter"
      );
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Populate options
    const populate = {
      inventoryId: "productName productCode SKU category",
      adminId: "name role",
      locationId: "locationName locationCode",
    };

    // Execute query
    const stockAuditLogs = await this.repository.find(query, {
      sort,
      skip,
      limit: limitNum,
      populate,
    });

    // Get total count for pagination
    const total = await this.repository.countDocuments(query);

    // Return list DTO with pagination
    return new StockAuditLogListResponseDTO(stockAuditLogs, {
      page: pageNum,
      limit: limitNum,
      total,
    });
  }

  /**
   * Get stock audit log by ID
   * @param {string} id - Stock audit log ID
   * @returns {Promise<StockAuditLogResponseDTO>} Stock audit log DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If stock audit log not found
   */
  async getStockAuditLogById(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid stock audit log ID format", "id");
    }

    // Populate options
    const populateOptions = {
      inventoryId: "productName productCode SKU category",
      adminId: "name role",
      locationId: "locationName locationCode",
    };

    // Find stock audit log
    const stockAuditLog = await this.repository.findById(id, populateOptions);

    if (!stockAuditLog) {
      throw new NotFoundError("StockAuditLog", id);
    }

    // Return DTO
    return new StockAuditLogResponseDTO(stockAuditLog);
  }

  /**
   * Determines the action type based on quantity change
   * Helper function for business logic
   * @param {number} quantityChange - The quantity change (positive or negative)
   * @param {boolean} isInitialCreation - Whether this is the initial stock creation
   * @returns {string} Action type: "create", "add", "remove", or "adjust"
   */
  determineActionType(quantityChange, isInitialCreation = false) {
    if (isInitialCreation) {
      return STOCK_AUDIT_ACTION.CREATE;
    }
    if (quantityChange > 0) {
      return STOCK_AUDIT_ACTION.ADD;
    }
    if (quantityChange < 0) {
      return STOCK_AUDIT_ACTION.REMOVE;
    }
    return STOCK_AUDIT_ACTION.ADJUST;
  }
}

export default StockAuditLogService;
