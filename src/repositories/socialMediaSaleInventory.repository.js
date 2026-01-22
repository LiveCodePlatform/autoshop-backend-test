/**
 * Social Media Sale Inventory Repository
 * Data access layer for SocialMediaSaleInventory model
 * No business logic - only database queries
 */

import SocialMediaSaleInventory from "../models/socialMediaSaleInventory.model.js";

export class SocialMediaSaleInventoryRepository {
  /**
   * Create social media sale inventory record
   * @param {Object} data - Social media sale inventory data
   * @returns {Promise<Object>} Created social media sale inventory document
   */
  async create(data) {
    return await SocialMediaSaleInventory.create(data);
  }

  /**
   * Find social media sale inventory by ID
   * @param {string} id - Social media sale inventory ID
   * @param {Object} options - Options including session for transactions
   * @returns {Promise<Object|null>} Social media sale inventory document or null
   */
  async findById(id, options = {}) {
    const { session, populate } = options;
    let query = SocialMediaSaleInventory.findById(id);

    if (session) {
      query = query.session(session);
    }

    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((pop) => {
          query = query.populate(pop.path, pop.select);
        });
      } else {
        query = query.populate(populate.path, populate.select);
      }
    }

    return await query.exec();
  }

  /**
   * Find one social media sale inventory record
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Options including session
   * @returns {Promise<Object|null>} Social media sale inventory document or null
   */
  async findOne(query, options = {}) {
    const { session, populate } = options;
    let mongoQuery = SocialMediaSaleInventory.findOne(query);

    if (session) {
      mongoQuery = mongoQuery.session(session);
    }

    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((pop) => {
          mongoQuery = mongoQuery.populate(pop.path, pop.select);
        });
      } else {
        mongoQuery = mongoQuery.populate(populate.path, populate.select);
      }
    }

    return await mongoQuery.exec();
  }

  /**
   * Find multiple social media sale inventory records
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Options including sort, skip, limit, populate, session
   * @returns {Promise<Array>} Array of social media sale inventory documents
   */
  async find(query, options = {}) {
    const { sort, skip, limit, populate, session } = options;
    let mongoQuery = SocialMediaSaleInventory.find(query);

    if (session) {
      mongoQuery = mongoQuery.session(session);
    }

    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((pop) => {
          mongoQuery = mongoQuery.populate(pop.path, pop.select);
        });
      } else {
        mongoQuery = mongoQuery.populate(populate.path, populate.select);
      }
    }

    if (sort) {
      mongoQuery = mongoQuery.sort(sort);
    }

    if (skip !== undefined) {
      mongoQuery = mongoQuery.skip(skip);
    }

    if (limit !== undefined) {
      mongoQuery = mongoQuery.limit(limit);
    }

    return await mongoQuery.exec();
  }

  /**
   * Count documents matching query
   * @param {Object} query - MongoDB query object
   * @returns {Promise<number>} Count of documents
   */
  async countDocuments(query) {
    return await SocialMediaSaleInventory.countDocuments(query);
  }

  /**
   * Find by ID and update
   * @param {string} id - Social media sale inventory ID
   * @param {Object} updateData - Update data
   * @param {Object} options - Options including session, new, runValidators
   * @returns {Promise<Object|null>} Updated social media sale inventory document or null
   */
  async findByIdAndUpdate(id, updateData, options = {}) {
    const { session, populate, ...mongoOptions } = options;
    let query = SocialMediaSaleInventory.findByIdAndUpdate(
      id,
      updateData,
      mongoOptions
    );

    if (session) {
      query = query.session(session);
    }

    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((pop) => {
          query = query.populate(pop.path, pop.select);
        });
      } else {
        query = query.populate(populate.path, populate.select);
      }
    }

    return await query.exec();
  }

  /**
   * Find by ID and delete
   * @param {string} id - Social media sale inventory ID
   * @returns {Promise<Object|null>} Deleted social media sale inventory document or null
   */
  async findByIdAndDelete(id) {
    return await SocialMediaSaleInventory.findByIdAndDelete(id);
  }
}

export default SocialMediaSaleInventoryRepository;
