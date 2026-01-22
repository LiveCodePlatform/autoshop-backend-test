/**
 * Social Media Sale Inventory Routes
 * API endpoint definitions for social media sale inventory operations
 */

import { Router } from "express";
import {
  createSocialMediaSaleInventory,
  getAllSocialMediaSaleInventory,
  getSocialMediaSaleInventoryById,
  updateSocialMediaSaleInventoryQuantity,
} from "../controllers/socialMediaSaleInventory.controller.js";
import {
  validateCreateSocialMediaSaleInventory,
  validateGetSocialMediaSaleInventoryQuery,
  validateUpdateSocialMediaSaleInventoryQuantity,
} from "../validators/socialMediaSaleInventory.validator.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route   POST /api/v2/social-inventory
 * @desc    Create social media sale inventory records for multiple inventory items
 * @access  Public (add protect middleware if needed)
 */
router.post(
  "/social-inventory",
  validateCreateSocialMediaSaleInventory,
  createSocialMediaSaleInventory
);

/**
 * @route   GET /api/v2/social-inventory
 * @desc    Get all social media sale inventory with pagination and filters
 * @access  Public (add protect middleware if needed)
 */
router.get(
  "/social-inventory",
  validateGetSocialMediaSaleInventoryQuery,
  getAllSocialMediaSaleInventory
);

/**
 * @route   GET /api/v2/social-inventory/:id
 * @desc    Get social media sale inventory by ID
 * @access  Public (add protect middleware if needed)
 */
router.get("/social-inventory/:id", getSocialMediaSaleInventoryById);

/**
 * @route   PUT /api/v2/social-inventory/:id
 * @desc    Update social media sale inventory quantity
 * @access  Private (requires authentication)
 */
router.put(
  "/social-inventory/:id",
  protect,
  validateUpdateSocialMediaSaleInventoryQuantity,
  updateSocialMediaSaleInventoryQuantity
);

export default router;
