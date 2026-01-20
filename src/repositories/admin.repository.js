/**
 * Admin Repository
 * Data access layer for Admin model
 * No business logic - only database queries
 */

import Admin from "../models/admin.model.js";

export class AdminRepository {
  /**
   * Create new admin
   * @param {Object} data - Admin data
   * @returns {Promise<Object>} Created admin document
   */
  async create(data) {
    return await Admin.create(data);
  }

  /**
   * Find admin by ID
   * @param {string} id - Admin ID
   * @param {Object} options - Query options (select, populate)
   * @returns {Promise<Object|null>} Admin document or null
   */
  async findById(id, options = {}) {
    const { select, populate } = options;
    let query = Admin.findById(id);

    if (select) {
      query = query.select(select);
    }

    if (populate) {
      if (populate.locationId) {
        query = query.populate("locationId", populate.locationId);
      }
    }

    return await query.exec();
  }

  /**
   * Find one admin by query
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Query options (select, populate)
   * @returns {Promise<Object|null>} Admin document or null
   */
  async findOne(query, options = {}) {
    const { select, populate } = options;
    let queryBuilder = Admin.findOne(query);

    if (select) {
      queryBuilder = queryBuilder.select(select);
    }

    if (populate) {
      if (populate.locationId) {
        queryBuilder = queryBuilder.populate("locationId", populate.locationId);
      }
    }

    return await queryBuilder.exec();
  }

  /**
   * Find admins by query with options
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Query options (sort, skip, limit, select, populate)
   * @returns {Promise<Array>} Array of admin documents
   */
  async find(query, options = {}) {
    const { sort, skip, limit, select, populate } = options;
    let queryBuilder = Admin.find(query);

    if (select) {
      queryBuilder = queryBuilder.select(select);
    }

    if (populate) {
      if (populate.locationId) {
        queryBuilder = queryBuilder.populate("locationId", populate.locationId);
      }
    }

    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }

  /**
   * Count documents matching query
   * @param {Object} query - MongoDB query object
   * @returns {Promise<number>} Count of documents
   */
  async countDocuments(query) {
    return await Admin.countDocuments(query);
  }

  /**
   * Find admin by ID and update
   * @param {string} id - Admin ID
   * @param {Object} updateData - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object|null>} Updated admin document or null
   */
  async findByIdAndUpdate(id, updateData, options = {}) {
    return await Admin.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      ...options,
    });
  }

  /**
   * Find admin by ID, apply updates, and save
   * Useful when you need to run validators on the complete document
   * @param {string} id - Admin ID
   * @param {Function} updateFn - Function that applies updates to the document
   * @returns {Promise<Object|null>} Updated admin document or null
   */
  async findByIdAndSave(id, updateFn) {
    const document = await Admin.findById(id);
    if (!document) {
      return null;
    }
    // Apply updates using the provided function
    updateFn(document);
    // Save the document (this will run all validators with the complete merged document)
    return await document.save();
  }
}

export default AdminRepository;
