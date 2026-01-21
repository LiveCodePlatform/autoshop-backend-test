import { Router } from "express";
import {
  createStorefrontInventory,
  getAllStorefrontInventory,
  getStorefrontInventoryById,
  updateStorefrontInventoryQuantity,
} from "../controllers/storefrontInventory.controller.js";
import {
  validateCreateStorefrontInventory,
  validateGetStorefrontInventoryQuery,
  validateUpdateStorefrontInventoryQuantity,
} from "../validators/storefrontInventory.validator.js";
// Authentication & Authorization middleware examples (uncomment to use):
import { protect } from "../middlewares/auth.middleware.js";
import {
  permissionGranted,
  ownerOnly,
} from "../middlewares/authorization.middleware.js";

const router = Router();

// Create storefront inventory records for multiple inventory items (with validation middleware)
router.post(
  "/storefront-inventory",
  protect,
  validateCreateStorefrontInventory,
  createStorefrontInventory
);
// Get all storefront inventory records with pagination and filters (with query validation)
router.get(
  "/storefront-inventory",
  validateGetStorefrontInventoryQuery,
  getAllStorefrontInventory
);

// Get storefront inventory by ID
router.get("/storefront-inventory/:id", getStorefrontInventoryById);

// Update storefront inventory quantity with ACID compliance (with validation middleware)
// Requires authentication to get adminId from req.user
router.patch(
  "/storefront-inventory/:id/quantity",
  protect,
  validateUpdateStorefrontInventoryQuantity,
  updateStorefrontInventoryQuantity
);

export default router;
