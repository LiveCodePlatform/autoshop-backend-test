import { Router } from "express";
import {
  createWarehouseInventory,
  getAllWarehouseInventory,
  getWarehouseInventoryById,
  updateWarehouseInventoryQuantity,
} from "../controllers/warehouseInventory.controller.js";
import {
  validateCreateWarehouseInventory,
  validateGetWarehouseInventoryQuery,
  validateUpdateWarehouseInventoryQuantity,
} from "../validators/warehouseInventory.validator.js";
// Authentication & Authorization middleware examples (uncomment to use):
import { protect } from "../middlewares/auth.middleware.js";
import {
  permissionGranted,
  ownerOnly,
} from "../middlewares/authorization.middleware.js";

const router = Router();

// Create warehouse inventory records for multiple inventory items (with validation middleware)
router.post(
  "/warehouse",
  protect,
  validateCreateWarehouseInventory,
  createWarehouseInventory
);
// Get all warehouse inventory records with pagination and filters (with query validation)
router.get(
  "/warehouse",
  validateGetWarehouseInventoryQuery,
  getAllWarehouseInventory
);

// Get warehouse inventory by ID
router.get("/warehouse/:id", getWarehouseInventoryById);

// Update warehouse inventory quantity with ACID compliance (with validation middleware)
// Requires authentication to get adminId from req.user
router.patch(
  "/warehouse/:id/quantity",
  protect,
  validateUpdateWarehouseInventoryQuantity,
  updateWarehouseInventoryQuantity
);

export default router;
