/**
 * Order Routes
 * API endpoint definitions for order operations
 */

import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getOrder,
  updateOrderCreditPersonId,
  getOrdersByStorefrontId,
  addOrderItems,
  removeOrderItems,
} from "../controllers/order.controller.js";
import { validateCreateOrder } from "../validators/order.validator.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route   POST /api/v2/order
 * @desc    Create new order
 * @access  Private (requires authentication)
 */
router.post("/order", protect, validateCreateOrder, createOrder);

/**
 * @route   GET /api/v2/order
 * @desc    Get all orders with optional date filtering
 * @access  Public (add protect middleware if needed)
 */
router.get("/order", getAllOrders);

/**
 * @route   GET /api/v2/order/:orderId
 * @desc    Get order by ID
 * @access  Public (add protect middleware if needed)
 */
router.get("/order/:orderId", getOrder);

/**
 * @route   GET /api/v2/order/storefront/:storefrontId
 * @desc    Get all orders for a specific storefront
 * @access  Public (add protect middleware if needed)
 */
router.get("/order/storefront/:storefrontId", getOrdersByStorefrontId);

/**
 * @route   PATCH /api/v2/order/:orderId/credit-person
 * @desc    Update/add credit person ID to an order
 * @access  Private (requires authentication)
 */
router.patch(
  "/order/:orderId/credit-person",
  protect,
  updateOrderCreditPersonId
);

/**
 * @route   PATCH /api/v2/order/:orderId/items/add
 * @desc    Add order items to existing order
 * @access  Private (requires authentication)
 */
router.patch("/order/:orderId/items/add", protect, addOrderItems);

/**
 * @route   PATCH /api/v2/order/:orderId/items/remove
 * @desc    Remove order items from existing order
 * @access  Private (requires authentication)
 */
router.patch("/order/:orderId/items/remove", protect, removeOrderItems);

export default router;
