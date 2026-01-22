/**
 * Goods Received Note (GRN) Repository
 * Data access layer for GoodsRecievedNote model
 * No business logic - only database queries
 */

import GoodsRecievedNote from "../models/goodsRecievedNote.model.js";

export class GoodsRecievedNoteRepository {
  async create(data) {
    return await GoodsRecievedNote.create(data);
  }

  async findById(id, populateOptions = {}) {
    const { lean, session } = populateOptions;
    let query = GoodsRecievedNote.findById(id);
    
    if (session) {
      query = query.session(session);
    }

    if (populateOptions.purchasingId) {
      query = query.populate("purchasingId", populateOptions.purchasingId);
    }
    if (populateOptions.lineItems) {
      query = query.populate("lineItems.inventoryId", populateOptions.lineItems);
    }

    if (lean) {
      query = query.lean();
    }

    return await query.exec();
  }

  async findOne(query, options = {}) {
    const { session } = options;
    let queryBuilder = GoodsRecievedNote.findOne(query);
    
    if (session) {
      queryBuilder = queryBuilder.session(session);
    }
    
    return await queryBuilder.exec();
  }

  async find(query, options = {}) {
    const { sort, skip, limit, populate } = options;
    let queryBuilder = GoodsRecievedNote.find(query);

    // Apply populate options
    if (populate) {
      if (populate.purchasingId) {
        if (typeof populate.purchasingId === "object") {
          // Nested populate
          queryBuilder = queryBuilder.populate({
            path: "purchasingId",
            select: populate.purchasingId.select,
            populate: populate.purchasingId.populate,
          });
        } else {
          queryBuilder = queryBuilder.populate("purchasingId", populate.purchasingId);
        }
      }
      if (populate.lineItems) {
        queryBuilder = queryBuilder.populate("lineItems.inventoryId", populate.lineItems);
      }
    }

    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }

  async countDocuments(query) {
    return await GoodsRecievedNote.countDocuments(query);
  }

  async findByIdAndUpdate(id, updateData, options) {
    return await GoodsRecievedNote.findByIdAndUpdate(id, updateData, options);
  }

  async findOneAndUpdate(query, updateData, options) {
    return await GoodsRecievedNote.findOneAndUpdate(query, updateData, options);
  }

  async findByIdAndSave(id, updateFn) {
    // Find the document, apply updates, and save (ensures validators run on complete document)
    const document = await GoodsRecievedNote.findById(id);
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

export default GoodsRecievedNoteRepository;
