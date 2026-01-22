/**
 * Order Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getOrderService } from "../loaders/services.loader.js";

class OrderController {
  /**
   * @param {OrderService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getOrderService();
  }

  /**
   * Create new order
   * POST /api/orders
   */
  createOrder = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.createOrder(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Get all orders with optional date filtering
   * GET /api/orders
   */
  getAllOrders = asyncErrorHandler(async (req, res, next) => {
    const results = await this.service.getAllOrders(req.query);
    const orders = results.map((order) => order.toJSON());

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  });

  /**
   * Get order by ID
   * GET /api/orders/:orderId
   */
  getOrder = asyncErrorHandler(async (req, res, next) => {
    const { orderId } = req.params;
    const result = await this.service.getOrderById(orderId);

    res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Update credit person ID for an order
   * PATCH /api/orders/:orderId/credit-person
   */
  updateOrderCreditPersonId = asyncErrorHandler(async (req, res, next) => {
    const { orderId } = req.params;
    const { creditPersonId } = req.body;
    const result = await this.service.updateOrderCreditPersonId(
      orderId,
      creditPersonId
    );

    res.status(200).json({
      success: true,
      message: "Credit person ID updated successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Get orders by storefront ID
   * GET /api/orders/storefront/:storefrontId
   */
  getOrdersByStorefrontId = asyncErrorHandler(async (req, res, next) => {
    const { storefrontId } = req.params;
    const results = await this.service.getOrdersByStorefrontId(storefrontId);
    const orders = results.map((order) => order.toJSON());

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: {
        count: orders.length,
        orders,
      },
    });
  });

  /**
   * Add items to existing order
   * POST /api/orders/:orderId/items
   */
  addOrderItems = asyncErrorHandler(async (req, res, next) => {
    const { orderId } = req.params;
    const result = await this.service.addOrderItems(orderId, req.body);

    res.status(200).json({
      success: true,
      message: "Order items added successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Remove items from existing order
   * DELETE /api/orders/:orderId/items
   */
  removeOrderItems = asyncErrorHandler(async (req, res, next) => {
    const { orderId } = req.params;
    const result = await this.service.removeOrderItems(orderId, req.body);

    res.status(200).json({
      success: true,
      message: "Order items removed successfully",
      data: result.toJSON(),
    });
  });
}

// Export instance
const orderController = new OrderController();
export const {
  createOrder,
  getAllOrders,
  getOrder,
  updateOrderCreditPersonId,
  getOrdersByStorefrontId,
  addOrderItems,
  removeOrderItems,
} = orderController;

export default orderController;
