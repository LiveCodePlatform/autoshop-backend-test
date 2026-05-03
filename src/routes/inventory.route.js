import express from "express";
import {
  createInventory,
  getAllInventory,
  getInventoryById,
  updateInventory,
} from "../controllers/inventory.controller.js";
import { protect, permissionGranted } from "../controllers/administrationPolicy.controller.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

// Create new inventory item
router.post(
  "/inventory",
  protect,
  permissionGranted("owner", "admin"),
  upload.array("images", 5),
  createInventory
);

// Get all inventory items
router.get(
  "/inventory",
  protect,
  permissionGranted("owner", "admin"),
  getAllInventory
);

// Get inventory item by ID
router.get(
  "/inventory/:id",
  protect,
  permissionGranted("owner", "admin"),
  getInventoryById
);

// Update inventory metadata
router.patch(
  "/inventory/:id",
  protect,
  permissionGranted("owner"),
  upload.array("images", 5),
  updateInventory
);

export default router;
