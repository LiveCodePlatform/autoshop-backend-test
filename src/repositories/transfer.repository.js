/**
 * Transfer Repository
 * Data access layer for Transfer model
 * No business logic - only database queries
 */

import Transfer from "../models/transfer.model.js";

export class TransferRepository {
  async create(data) {
    return await Transfer.create(data);
  }

  async findById(id, populateOptions = {}) {
    let query = Transfer.findById(id);

    if (populateOptions.transferredBy) {
      query = query.populate("transferredBy", populateOptions.transferredBy);
    }
    if (populateOptions.sourceId) {
      query = query.populate("sourceId", populateOptions.sourceId);
    }
    if (populateOptions.destinationWarehouseId) {
      query = query.populate("destinationWarehouseId", populateOptions.destinationWarehouseId);
    }
    if (populateOptions.destinationStorefrontId) {
      query = query.populate("destinationStorefrontId", populateOptions.destinationStorefrontId);
    }
    if (populateOptions.lineItems) {
      query = query.populate("lineItems.inventoryId", populateOptions.lineItems);
    }

    return await query.exec();
  }

  async findOne(query) {
    return await Transfer.findOne(query);
  }

  async find(query, options = {}) {
    const { sort, skip, limit, populate } = options;
    let queryBuilder = Transfer.find(query);

    // Apply populate options
    if (populate) {
      if (populate.transferredBy) {
        queryBuilder = queryBuilder.populate("transferredBy", populate.transferredBy);
      }
      if (populate.sourceId) {
        queryBuilder = queryBuilder.populate("sourceId", populate.sourceId);
      }
      if (populate.destinationWarehouseId) {
        queryBuilder = queryBuilder.populate("destinationWarehouseId", populate.destinationWarehouseId);
      }
      if (populate.destinationStorefrontId) {
        queryBuilder = queryBuilder.populate("destinationStorefrontId", populate.destinationStorefrontId);
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
    return await Transfer.countDocuments(query);
  }

  async findByIdAndUpdate(id, updateData, options) {
    return await Transfer.findByIdAndUpdate(id, updateData, options);
  }

  async findOneAndUpdate(query, updateData, options) {
    return await Transfer.findOneAndUpdate(query, updateData, options);
  }

  async findByIdAndSave(id, updateFn) {
    // Find the document, apply updates, and save (ensures validators run on complete document)
    const document = await Transfer.findById(id);
    if (!document) {
      return null;
    }
    // Apply updates using the provided function
    updateFn(document);
    // Save the document (this will run all validators with the complete merged document)
    return await document.save();
  }
}

export default TransferRepository;
