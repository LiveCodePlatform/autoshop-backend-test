/**
 * Warehouse Stock Repository
 * Data access layer for WarehouseStock model
 * Used for stock availability queries
 */

import WarehouseStock from "../legacy/models/warehouse.model.js";

export class WarehouseStockRepository {
  /**
   * Find warehouse stocks by inventory ID with populated warehouse details
   * @param {string} inventoryId - Inventory ID
   * @returns {Promise<Array>} Array of warehouse stock documents with populated warehouseId
   */
  async findByInventoryId(inventoryId) {
    return await WarehouseStock.find({ inventoryId })
      .populate(
        "warehouseId",
        "locationName locationCode locationAddress type status"
      )
      .select("warehouseId quantity lastUpdated")
      .exec();
  }

  /**
   * Find warehouse stocks with query and populate
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of warehouse stock documents
   */
  async find(query, options = {}) {
    const { sort, skip, limit, populate } = options;
    let queryBuilder = WarehouseStock.find(query);

    if (populate) {
      queryBuilder = queryBuilder.populate(populate.path, populate.select);
    }

    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }
}

export default WarehouseStockRepository;
