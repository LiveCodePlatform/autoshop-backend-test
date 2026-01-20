/**
 * Purchasing Routes
 * API endpoint definitions for purchasing operations
 */

import { Router } from "express";
import {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchaseStatus,
  softDeletePurchase,
  restorePurchase,
} from "../controllers/purchasing.controller.js";
import {
  validateCreatePurchasing,
  validateUpdatePurchasing,
} from "../validators/purchasing.validator.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route   POST /api/v2/purchase
 * @desc    Create new purchasing order
 * @access  Private (requires authentication)
 */
router.post("/purchase", protect, validateCreatePurchasing, createPurchase);

/**
 * @route   GET /api/v2/purchase
 * @desc    Get all purchasing orders with pagination and filters
 * @access  Private (requires authentication)
 */
router.get("/purchase", protect, getAllPurchases);

/**
 * @route   GET /api/v2/purchase/:id
 * @desc    Get purchasing order by ID
 * @access  Private (requires authentication)
 */
router.get("/purchase/:id", protect, getPurchaseById);

/**
 * @route   PATCH /api/v2/purchase/:id/status
 * @desc    Update purchasing order status
 * @access  Private (requires authentication)
 */
router.patch("/purchase/:id/status", protect, updatePurchaseStatus);

/**
 * @route   PATCH /api/v2/purchase/:id/soft-delete
 * @desc    Soft delete purchasing order
 * @access  Private (requires authentication)
 */
router.patch("/purchase/:id/soft-delete", protect, softDeletePurchase);

/**
 * @route   PATCH /api/v2/purchase/:id/restore
 * @desc    Restore soft deleted purchasing order
 * @access  Private (requires authentication)
 */
router.patch("/purchase/:id/restore", protect, restorePurchase);

export default router;
