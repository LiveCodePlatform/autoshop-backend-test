import { Router } from "express";
import {
  createInventory,
  getAllInventory,
  getInventoryById,
  updateInventory,
} from "../controllers/inventory.controller.js";
import {
  validateCreateInventory,
  validateUpdateInventory,
} from "../validators/inventory.validator.js";
import { uploadImage } from "../middlewares/upload.middleware.js";

const router = Router();

// Get all inventory items with pagination and filters
router.get("/inventory", getAllInventory);

// Get inventory item by ID with stock availability
router.get("/inventory/:id", getInventoryById);

// Create new inventory item (with validation middleware)
router.post(
  "/inventory",
  uploadImage.array("images", 5),
  validateCreateInventory,
  createInventory
);

// Update inventory item metadata (with validation middleware)
router.patch(
  "/inventory/:id",
  uploadImage.array("images", 5),
  validateUpdateInventory,
  updateInventory
);

export default router;
