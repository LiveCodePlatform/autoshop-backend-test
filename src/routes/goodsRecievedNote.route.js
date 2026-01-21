/**
 * Goods Received Note (GRN) Routes
 * API endpoint definitions for GRN operations
 */

import { Router } from "express";
import {
  createGRN,
  getAllGRN,
  getGRNById,
  updateGRNStatus,
  updateGRNLineItems,
} from "../controllers/goodsRecievedNote.controller.js";
import {
  validateCreateGRN,
  validateUpdateGRNStatus,
  validateUpdateGRNLineItems,
} from "../validators/goodsRecievedNote.validator.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route   POST /api/v2/grn
 * @desc    Create new GRN (Supports Partial GRN)
 * @access  Private (requires authentication)
 */
router.post("/grn", protect, validateCreateGRN, createGRN);

/**
 * @route   GET /api/v2/grn
 * @desc    Get all GRNs with pagination and filters
 * @access  Private (requires authentication)
 */
router.get("/grn", protect, getAllGRN);

/**
 * @route   GET /api/v2/grn/:id
 * @desc    Get GRN by ID
 * @access  Private (requires authentication)
 */
router.get("/grn/:id", protect, getGRNById);

/**
 * @route   PATCH /api/v2/grn/:id/status
 * @desc    Update GRN status
 * @access  Private (requires authentication)
 */
router.patch("/grn/:id/status", protect, validateUpdateGRNStatus, updateGRNStatus);

/**
 * @route   PATCH /api/v2/grn/:id/line-items
 * @desc    Update GRN line items (goodQuantity and badQuantity)
 * @access  Private (requires authentication)
 */
router.patch("/grn/:id/line-items", protect, validateUpdateGRNLineItems, updateGRNLineItems);

export default router;
