/**
 * Transfer Routes
 * API endpoint definitions for transfer operations
 */

import { Router } from "express";
import {
  createTransfer,
  getTransfers,
  getTransferById,
  updateTransferStatus,
} from "../controllers/transfer.controller.js";
import {
  validateCreateTransfer,
  validateUpdateTransferStatus,
} from "../validators/transfer.validator.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route   POST /api/v2/transfer
 * @desc    Create new transfer (supports both GRN → Warehouse and Warehouse → Storefront)
 * @access  Private (requires authentication)
 */
router.post("/transfer", protect, validateCreateTransfer, createTransfer);

/**
 * @route   GET /api/v2/transfer
 * @desc    Get all transfers
 * @access  Private (requires authentication)
 */
router.get("/transfer", protect, getTransfers);

/**
 * @route   GET /api/v2/transfer/:id
 * @desc    Get transfer by ID
 * @access  Private (requires authentication)
 */
router.get("/transfer/:id", protect, getTransferById);

/**
 * @route   PATCH /api/v2/transfer/:id
 * @desc    Update transfer status
 * @access  Private (requires authentication)
 */
router.patch("/transfer/:id", protect, validateUpdateTransferStatus, updateTransferStatus);

export default router;
