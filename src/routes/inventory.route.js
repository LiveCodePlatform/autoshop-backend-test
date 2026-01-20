import { Router } from "express";
import {
  createInventory,
  getAllInventory,
  getInventoryById,
} from "../controllers/inventory.controller.js";
import { validateCreateInventory } from "../validators/inventory.validator.js";

const router = Router();

// Get all inventory items with pagination and filters
router.get("/inventory", getAllInventory);

// Get inventory item by ID with stock availability
router.get("/inventory/:id", getInventoryById);

// Create new inventory item (with validation middleware)
router.post("/inventory", validateCreateInventory, createInventory);

export default router;
