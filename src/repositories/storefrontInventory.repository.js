/**
 * Storefront Inventory Repository
 * Data access layer for StorefrontInventory model
 * No business logic - only database queries
 */

import StorefrontInventory from "../models/storeFrontInventory.model.js";

export class StorefrontInventoryRepository {
  /**
   * Create storefront inventory record
   * @param {Object} data - Storefront inventory data
   * @returns {Promise<Object>} Created storefront inventory document
   */
  async create(data) {
    return await StorefrontInventory.create(data);
  }

  /**
   * Find storefront inventory by ID
   * @param {string} id - Storefront inventory ID
   * @param {Object} options - Options including session for transactions
   * @returns {Promise<Object|null>} Storefront inventory document or null
   */
  async findById(id, options = {}) {
    const { session, populate } = options;
    let query = StorefrontInventory.findById(id);

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
   * Find one storefront inventory record
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Options including session
   * @returns {Promise<Object|null>} Storefront inventory document or null
   */
  async findOne(query, options = {}) {
    const { session } = options;
    let queryBuilder = StorefrontInventory.findOne(query);

    if (session) {
      queryBuilder = queryBuilder.session(session);
    }

    return await queryBuilder.exec();
  }

  /**
   * Find storefront inventories with query and options
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Query options (sort, skip, limit, populate)
   * @returns {Promise<Array>} Array of storefront inventory documents
   */
  async find(query, options = {}) {
    const { sort, skip, limit, populate } = options;
    let queryBuilder = StorefrontInventory.find(query);

    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((pop) => {
          queryBuilder = queryBuilder.populate(pop.path, pop.select);
        });
      } else {
        queryBuilder = queryBuilder.populate(populate.path, populate.select);
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
   * @returns {Promise<number>} Count of matching documents
   */
  async countDocuments(query) {
    return await StorefrontInventory.countDocuments(query);
  }

  /**
   * Find storefront stocks by inventory ID with populated storefront details
   * @param {string} inventoryId - Inventory ID
   * @returns {Promise<Array>} Array of storefront stock documents with populated storefrontId
   */
  async findByInventoryId(inventoryId) {
    return await StorefrontInventory.find({ inventoryId })
      .populate(
        "storefrontId",
        "locationName locationCode locationAddress type status"
      )
      .select("storefrontId quantity lastUpdated")
      .exec();
  }

  /**
   * Find multiple storefront inventories by inventory IDs and storefront ID
   * @param {Array<string>} inventoryIds - Array of inventory IDs
   * @param {string} storefrontId - Storefront ID
   * @returns {Promise<Array>} Array of storefront inventory documents
   */
  async findByInventoryIdsAndStorefront(inventoryIds, storefrontId) {
    return await StorefrontInventory.find({
      inventoryId: { $in: inventoryIds },
      storefrontId,
    }).exec();
  }

  /**
   * Update storefront inventory quantity atomically using $inc
   * @param {string} id - Storefront inventory ID
   * @param {number} quantityChange - Quantity change (positive to add, negative to subtract)
   * @param {Object} options - Options including session for transactions
   * @returns {Promise<Object|null>} Updated storefront inventory document or null
   */
  async updateQuantity(id, quantityChange, options = {}) {
    const { session } = options;
    const updateData = {
      $inc: { quantity: quantityChange },
      $set: { lastUpdated: new Date() },
    };

    const updateOptions = {
      new: true,
      runValidators: true,
      ...(session && { session }),
    };

    const updated = await StorefrontInventory.findByIdAndUpdate(
      id,
      updateData,
      updateOptions
    );

    if (updated) {
      // Populate related fields
      await updated.populate(
        "inventoryId",
        "productName productCode SKU category barcode"
      );
      await updated.populate("storefrontId", "locationName locationCode");
    }

    return updated;
  }

  /**
   * Find one storefront inventory and update (with upsert support)
   * @param {Object} query - MongoDB query object
   * @param {Object} updateData - Update data
   * @param {Object} options - Options including session, upsert, etc.
   * @returns {Promise<Object|null>} Updated storefront inventory document or null
   */
  async findOneAndUpdate(query, updateData, options = {}) {
    return await StorefrontInventory.findOneAndUpdate(
      query,
      updateData,
      options
    );
  }

  /**
   * Find one storefront inventory with session support
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Options including session
   * @returns {Promise<Object|null>} Storefront inventory document or null
   */
  async findOne(query, options = {}) {
    const { session } = options;
    let queryBuilder = StorefrontInventory.findOne(query);

    if (session) {
      queryBuilder = queryBuilder.session(session);
    }

    return await queryBuilder.exec();
  }

  /**
   * Create storefront inventory with session support
   * @param {Object} data - Storefront inventory data
   * @param {Object} options - Options including session
   * @returns {Promise<Object>} Created storefront inventory document
   */
  async create(data, options = {}) {
    const { session } = options;
    if (session) {
      return await StorefrontInventory.create([data], { session }).then(
        (records) => records[0]
      );
    }
    return await StorefrontInventory.create(data);
  }
}

export default StorefrontInventoryRepository;
