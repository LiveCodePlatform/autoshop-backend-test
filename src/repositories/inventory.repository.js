/**
 * Inventory Repository
 * Data access layer for Inventory model
 * No business logic - only database queries
 */

import Inventory from "../models/inventory.model.js";

export class InventoryRepository {
  async create(data) {
    return await Inventory.create(data);
  }

  async findById(id, options = {}) {
    const { lean } = options;
    let query = Inventory.findById(id);

    if (lean) {
      query = query.lean();
    }

    return await query.exec();
  }

  async findOne(query, options = {}) {
    const { lean } = options;
    let queryBuilder = Inventory.findOne(query);

    if (lean) {
      queryBuilder = queryBuilder.lean();
    }

    return await queryBuilder.exec();
  }

  async find(query, options = {}) {
    const { sort, skip, limit, session } = options;
    let queryBuilder = Inventory.find(query);

    if (session) {
      queryBuilder = queryBuilder.session(session);
    }

    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }

  async countDocuments(query) {
    return await Inventory.countDocuments(query);
  }

  async findByIdAndUpdate(id, updateData, options) {
    return await Inventory.findByIdAndUpdate(id, updateData, options);
  }

  async findByIdAndSave(id, updateFn) {
    // Find the document, apply updates, and save (ensures validators run on complete document)
    const document = await Inventory.findById(id);
    if (!document) {
      return null;
    }
    // Apply updates using the provided function
    updateFn(document);
    // Save the document (this will run all validators with the complete merged document)
    return await document.save();
  }

  /**
   * Save a modified document instance
   * @param {Object} document - Modified document instance
   * @param {Object} options - Options including session for transactions
   * @returns {Promise<Object>} Saved document
   */
  async save(document, options = {}) {
    const { session } = options;
    if (session) {
      return await document.save({ session });
    }
    return await document.save();
  }
}

export default InventoryRepository;
