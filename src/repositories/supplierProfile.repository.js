/**
 * Supplier Profile Repository
 * Data access layer for SupplierProfile model
 * No business logic - only database queries
 */

import SupplierProfile from "../models/supplierProfile.model.js";

export class SupplierProfileRepository {
  async create(data) {
    return await SupplierProfile.create(data);
  }

  async findById(id) {
    return await SupplierProfile.findById(id);
  }

  async findOne(query) {
    return await SupplierProfile.findOne(query);
  }

  async find(query, options = {}) {
    const { sort, skip, limit } = options;
    let queryBuilder = SupplierProfile.find(query);

    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }

  async countDocuments(query) {
    return await SupplierProfile.countDocuments(query);
  }

  async findByIdAndUpdate(id, updateData, options) {
    return await SupplierProfile.findByIdAndUpdate(id, updateData, options);
  }

  async findByIdAndDelete(id) {
    return await SupplierProfile.findByIdAndDelete(id);
  }
}

export default SupplierProfileRepository;
