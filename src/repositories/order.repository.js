/**
 * Order Repository
 * Data access layer for Order model
 * No business logic - only database queries
 */

import Order from "../models/orders.model.js";

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
    const { sort, skip, limit, populate, session } = options;
    let queryBuilder = Order.find(query);

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
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const prefix = `ORD-${year}-${month}-${day}-`;

    // Find the latest order for this date (excluding deleted)
    const latestOrder = await Order.findOne({
      orderNumber: new RegExp(
        `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`
      ),
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .select("orderNumber");

    let sequence = 1;
    if (latestOrder && latestOrder.orderNumber) {
      // Extract sequence number from format: ORD-YYYY-MM-DD-NNNNNN
      const parts = latestOrder.orderNumber.split("-");
      if (parts.length === 5) {
        // Format: ["ORD", "YYYY", "MM", "DD", "NNNNNN"]
        const latestSequence = parseInt(parts[4], 10);
        if (!isNaN(latestSequence)) {
          sequence = latestSequence + 1;
        }
      }
    }

    // Validate sequence doesn't exceed daily limit
    if (sequence > 999999) {
      throw new Error(
        `Daily order limit reached. Maximum 999,999 orders per day allowed.`
      );
    }

    // Format: ORD-YYYY-MM-DD-NNNNNN (e.g., ORD-2024-01-15-000001)
    return `${prefix}${sequence.toString().padStart(6, "0")}`;
  }
}

export default OrderRepository;
