/**
 * Storefront Inventory Repository
 * Data access layer for StorefrontInventory model
 * Used for stock availability queries
 */

import StorefrontInventory from "../legacy/models/storefrontInventory.model.js";

export class StorefrontInventoryRepository {
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
   * Find storefront stocks with query and populate
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of storefront stock documents
   */
  async find(query, options = {}) {
    const { sort, skip, limit, populate } = options;
    let queryBuilder = StorefrontInventory.find(query);

    if (populate) {
      queryBuilder = queryBuilder.populate(populate.path, populate.select);
    }

    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }
}

export default StorefrontInventoryRepository;
