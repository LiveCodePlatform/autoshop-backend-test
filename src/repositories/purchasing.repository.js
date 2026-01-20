/**
 * Purchasing Repository
 * Data access layer for Purchasing model
 * No business logic - only database queries
 */

import Purchasing from "../models/purchasing.model.js";

export class PurchasingRepository {
  async create(data) {
    return await Purchasing.create(data);
  }

  async findById(id, populateOptions = {}) {
    let query = Purchasing.findById(id);

    if (populateOptions.purchasedBy) {
      query = query.populate("purchasedBy", populateOptions.purchasedBy);
    }
    if (populateOptions.supplierId) {
      query = query.populate("supplierId", populateOptions.supplierId);
    }

    return await query.exec();
  }

  async findOne(query) {
    return await Purchasing.findOne(query);
  }

  async find(query, options = {}) {
    const { sort, skip, limit, populate } = options;
    let queryBuilder = Purchasing.find(query);

    // Apply populate options
    if (populate) {
      if (populate.purchasedBy) {
        queryBuilder = queryBuilder.populate("purchasedBy", populate.purchasedBy);
      }
      if (populate.supplierId) {
        queryBuilder = queryBuilder.populate("supplierId", populate.supplierId);
      }
    }

    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }

  async countDocuments(query) {
    return await Purchasing.countDocuments(query);
  }

  async findByIdAndUpdate(id, updateData, options) {
    return await Purchasing.findByIdAndUpdate(id, updateData, options);
  }

  async findOneAndUpdate(query, updateData, options) {
    return await Purchasing.findOneAndUpdate(query, updateData, options);
  }
}

export default PurchasingRepository;
