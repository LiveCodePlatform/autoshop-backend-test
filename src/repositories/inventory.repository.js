/**
 * Inventory Repository
 * Data access layer for Inventory model
 * No business logic - only database queries
 */

import Inventory from "../model/inventory.model.js";

export class InventoryRepository {
  /**
   * Create new inventory item
   * @param {Object} data - Inventory data
   * @returns {Promise<Object>} Created inventory document
   */
  async create(data) {
    return await Inventory.create(data);
  }

  /**
   * Find inventory by ID
   * @param {string} id - Inventory ID
   * @returns {Promise<Object|null>} Inventory document or null
   */
  async findById(id) {
    return await Inventory.findById(id);
  }

  /**
   * Find one inventory matching query
   * @param {Object} query - MongoDB query object
   * @returns {Promise<Object|null>} Inventory document or null
   */
  async findOne(query) {
    return await Inventory.findOne(query);
  }

  /**
   * Find multiple inventory items with options
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Query options (sort, skip, limit)
   * @returns {Promise<Array>} Array of inventory documents
   */
  async find(query, options = {}) {
    const { sort, skip, limit } = options;
    let queryBuilder = Inventory.find(query);

    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }

  /**
   * Count documents matching query
   * @param {Object} query - MongoDB query object
   * @returns {Promise<number>} Count of matching documents
   */
  async countDocuments(query) {
    return await Inventory.countDocuments(query);
  }

  /**
   * Find and update inventory by ID
   * @param {string} id - Inventory ID
   * @param {Object} updateData - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object|null>} Updated inventory document or null
   */
  async findByIdAndUpdate(id, updateData, options) {
    return await Inventory.findByIdAndUpdate(id, updateData, options);
  }
}

export default InventoryRepository;
