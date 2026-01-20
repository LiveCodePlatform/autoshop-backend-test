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

  async findById(id) {
    return await Inventory.findById(id);
  }

  async findOne(query) {
    return await Inventory.findOne(query);
  }

  async find(query, options = {}) {
    const { sort, skip, limit } = options;
    let queryBuilder = Inventory.find(query);

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
}

export default InventoryRepository;
