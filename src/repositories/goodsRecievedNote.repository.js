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
    let query = GoodsRecievedNote.findById(id);

    if (populateOptions.purchasingId) {
      query = query.populate("purchasingId", populateOptions.purchasingId);
    }
    if (populateOptions.lineItems) {
      query = query.populate("lineItems.inventoryId", populateOptions.lineItems);
    }

    return await query.exec();
  }

  async findOne(query) {
    return await GoodsRecievedNote.findOne(query);
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
}

export default GoodsRecievedNoteRepository;
