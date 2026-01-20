/**
 * Stock Audit Log Repository
 * Data access layer for StockAuditLog model
 * No business logic - only database queries
 */

import StockAuditLog from "../models/stockAuditLog.model.js";

export class StockAuditLogRepository {
  async create(data, options = {}) {
    return await StockAuditLog.create([data], options);
  }

  async findById(id, populateOptions = {}) {
    let query = StockAuditLog.findById(id);

    if (populateOptions.inventoryId) {
      query = query.populate("inventoryId", populateOptions.inventoryId);
    }
    if (populateOptions.adminId) {
      query = query.populate("adminId", populateOptions.adminId);
    }
    if (populateOptions.locationId) {
      query = query.populate("locationId", populateOptions.locationId);
    }

    return await query.exec();
  }

  async findOne(query) {
    return await StockAuditLog.findOne(query);
  }

  async find(query, options = {}) {
    const { sort, skip, limit, populate } = options;
    let queryBuilder = StockAuditLog.find(query);

    // Apply populate options
    if (populate) {
      if (populate.inventoryId) {
        queryBuilder = queryBuilder.populate("inventoryId", populate.inventoryId);
      }
      if (populate.adminId) {
        queryBuilder = queryBuilder.populate("adminId", populate.adminId);
      }
      if (populate.locationId) {
        queryBuilder = queryBuilder.populate("locationId", populate.locationId);
      }
    }

    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }

  async countDocuments(query) {
    return await StockAuditLog.countDocuments(query);
  }
}

export default StockAuditLogRepository;
