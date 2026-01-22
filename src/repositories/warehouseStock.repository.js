/**
 * Warehouse Inventory Repository
 * Data access layer for WarehouseInventory model
 * No business logic - only database queries
 */

import WarehouseInventory from "../models/warehouseInventory.model.js";

export class WarehouseInventoryRepository {
  /**
   * Create warehouse inventory record
   * @param {Object} data - Warehouse inventory data
   * @returns {Promise<Object>} Created warehouse inventory document
   */
  async create(data) {
    return await WarehouseInventory.create(data);
  }

  /**
   * Find warehouse inventory by ID
   * @param {string} id - Warehouse inventory ID
   * @param {Object} options - Options including session for transactions
   * @returns {Promise<Object|null>} Warehouse inventory document or null
   */
  async findById(id, options = {}) {
    const { session, populate } = options;
    let query = WarehouseInventory.findById(id);
    
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
   * Find one warehouse inventory record
   * @param {Object} query - MongoDB query object
   * @returns {Promise<Object|null>} Warehouse inventory document or null
   */
  async findOne(query) {
    return await WarehouseInventory.findOne(query);
  }

  /**
   * Find warehouse inventories with query and options
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Query options (sort, skip, limit, populate)
   * @returns {Promise<Array>} Array of warehouse inventory documents
   */
  async find(query, options = {}) {
    const { sort, skip, limit, populate } = options;
    let queryBuilder = WarehouseInventory.find(query);

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
    return await WarehouseInventory.countDocuments(query);
  }

  /**
   * Find warehouse stocks by inventory ID with populated warehouse details
   * @param {string} inventoryId - Inventory ID
   * @returns {Promise<Array>} Array of warehouse stock documents with populated warehouseId
   */
  async findByInventoryId(inventoryId) {
    return await WarehouseInventory.find({ inventoryId })
      .populate(
        "warehouseId",
        "locationName locationCode locationAddress type status"
      )
      .select("warehouseId quantity lastUpdated")
      .exec();
  }

  /**
   * Find multiple warehouse inventories by inventory IDs and warehouse ID
   * @param {Array<string>} inventoryIds - Array of inventory IDs
   * @param {string} warehouseId - Warehouse ID
   * @returns {Promise<Array>} Array of warehouse inventory documents
   */
  async findByInventoryIdsAndWarehouse(inventoryIds, warehouseId) {
    return await WarehouseInventory.find({
      inventoryId: { $in: inventoryIds },
      warehouseId,
    }).exec();
  }

  /**
   * Update warehouse inventory quantity atomically using $inc
   * @param {string} id - Warehouse inventory ID
   * @param {number} quantityChange - Quantity change (positive to add, negative to subtract)
   * @param {Object} options - Options including session for transactions
   * @returns {Promise<Object|null>} Updated warehouse inventory document or null
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
    
    const updated = await WarehouseInventory.findByIdAndUpdate(
      id,
      updateData,
      updateOptions
    );
    
    if (updated) {
      // Populate related fields
      await updated.populate("inventoryId", "productName productCode SKU category barcode");
      await updated.populate("warehouseId", "locationName locationCode");
    }
    
    return updated;
  }

  /**
   * Find one warehouse inventory and update (with upsert support)
   * @param {Object} query - MongoDB query object
   * @param {Object} updateData - Update data
   * @param {Object} options - Options including session, upsert, etc.
   * @returns {Promise<Object|null>} Updated warehouse inventory document or null
   */
  async findOneAndUpdate(query, updateData, options = {}) {
    return await WarehouseInventory.findOneAndUpdate(query, updateData, options);
  }

  /**
   * Find one warehouse inventory with session support
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Options including session
   * @returns {Promise<Object|null>} Warehouse inventory document or null
   */
  async findOne(query, options = {}) {
    const { session } = options;
    let queryBuilder = WarehouseInventory.findOne(query);
    
    if (session) {
      queryBuilder = queryBuilder.session(session);
    }
    
    return await queryBuilder.exec();
  }

  /**
   * Create warehouse inventory with session support
   * @param {Object} data - Warehouse inventory data
   * @param {Object} options - Options including session
   * @returns {Promise<Object>} Created warehouse inventory document
   */
  async create(data, options = {}) {
    const { session } = options;
    if (session) {
      return await WarehouseInventory.create([data], { session }).then(
        (records) => records[0]
      );
    }
    return await WarehouseInventory.create(data);
  }
}

export default WarehouseInventoryRepository;
