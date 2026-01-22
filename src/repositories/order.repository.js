/**
 * Order Repository
 * Data access layer for Order model
 * No business logic - only database queries
 */

import Order from "../models/orders.model.js";
import { generateSequentialNumber } from "../shared/utils/generateSequentialNumber.utils.js";

export class OrderRepository {
  async create(data, options = {}) {
    const { session } = options;
    // Handle both single object and array
    if (Array.isArray(data)) {
      if (session) {
        return await Order.create(data, { session });
      }
      return await Order.create(data);
    } else {
      if (session) {
        return await Order.create([data], { session });
      }
      return await Order.create(data);
    }
  }

  async findById(id, options = {}) {
    const { session, populate } = options;
    let query = Order.findById(id);

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

  async findOne(query, options = {}) {
    const { session, populate } = options;
    let queryBuilder = Order.findOne(query);

    if (session) {
      queryBuilder = queryBuilder.session(session);
    }

    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((pop) => {
          queryBuilder = queryBuilder.populate(pop.path, pop.select);
        });
      } else {
        queryBuilder = queryBuilder.populate(populate.path, populate.select);
      }
    }

    return await queryBuilder.exec();
  }

  async find(query, options = {}) {
    const { sort, skip, limit, populate, session, select } = options;
    let queryBuilder = Order.find(query);

    if (session) {
      queryBuilder = queryBuilder.session(session);
    }

    if (select) {
      queryBuilder = queryBuilder.select(select);
    }

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

  async countDocuments(query) {
    return await Order.countDocuments(query);
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    return await Order.findByIdAndUpdate(id, updateData, options);
  }

  /**
   * Generate unique order number
   * Format: ORD-YYYY-MM-DD-NNNNNN (e.g., ORD-2024-01-15-000001)
   * This format supports up to 999,999 orders per day
   * @returns {Promise<string>} Generated order number
   */
  async generateOrderNumber() {
    return generateSequentialNumber({
      queryFn: async (query, options) => {
        return await Order.findOne(query)
          .sort(options.sort)
          .select("orderNumber");
      },
      prefix: "ORD",
      fieldName: "orderNumber",
      sequencePadding: 6,
      dateFormat: "daily",
      additionalFilters: { isDeleted: false },
      maxSequence: 999999,
      maxSequenceError:
        "Daily order limit reached. Maximum 999,999 orders per day allowed.",
    });
  }

  /**
   * Aggregate orders using MongoDB aggregation pipeline
   * @param {Array} pipeline - MongoDB aggregation pipeline
   * @returns {Promise<Array>} Aggregation results
   */
  async aggregate(pipeline) {
    return await Order.aggregate(pipeline);
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

export default OrderRepository;
