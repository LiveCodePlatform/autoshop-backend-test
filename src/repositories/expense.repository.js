/**
 * Expense Repository
 * Data access layer for Expense model
 * No business logic - only database queries
 */

import Expense from "../models/expense.model.js";

export class ExpenseRepository {
  async create(data) {
    return await Expense.create(data);
  }

  async findById(id, populateOptions = {}) {
    let query = Expense.findById(id);

    if (populateOptions.locationId) {
      query = query.populate("locationId", populateOptions.locationId);
    }
    if (populateOptions.adminId) {
      query = query.populate("adminId", populateOptions.adminId);
    }

    return await query.exec();
  }

  async findOne(query) {
    return await Expense.findOne(query);
  }

  async find(query, options = {}) {
    const { sort, skip, limit, populate } = options;
    let queryBuilder = Expense.find(query);

    // Apply populate options
    if (populate) {
      if (populate.locationId) {
        queryBuilder = queryBuilder.populate("locationId", populate.locationId);
      }
      if (populate.adminId) {
        queryBuilder = queryBuilder.populate("adminId", populate.adminId);
      }
    }

    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }

  async countDocuments(query) {
    return await Expense.countDocuments(query);
  }

  async findByIdAndUpdate(id, updateData, options = {}, populateOptions = {}) {
    let query = Expense.findByIdAndUpdate(id, updateData, options);

    if (populateOptions.locationId) {
      query = query.populate("locationId", populateOptions.locationId);
    }
    if (populateOptions.adminId) {
      query = query.populate("adminId", populateOptions.adminId);
    }

    return await query.exec();
  }

  async findByIdAndDelete(id, populateOptions = {}) {
    let query = Expense.findByIdAndDelete(id);

    if (populateOptions.locationId) {
      query = query.populate("locationId", populateOptions.locationId);
    }
    if (populateOptions.adminId) {
      query = query.populate("adminId", populateOptions.adminId);
    }

    return await query.exec();
  }
}

export default ExpenseRepository;
