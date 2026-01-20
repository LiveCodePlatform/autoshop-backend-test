import { Router } from "express";
import {
  createWarehouseProfile,
  getAllWarehouseProfiles,
  getWarehouseProfileById,
  updateWarehouseProfile,
} from "../controllers/warehouseProfile.controller.js";
import {
  validateCreateWarehouseProfile,
  validateUpdateWarehouseProfile,
  validateGetWarehouseProfilesQuery,
} from "../validators/warehouseProfile.validator.js";

const router = Router();

// Get all warehouse profiles with pagination and filters
router.get(
  "/warehouse-profile",
  validateGetWarehouseProfilesQuery,
  getAllWarehouseProfiles
);

// Get warehouse profile by ID
router.get("/warehouse-profile/:id", getWarehouseProfileById);

// Create new warehouse profile (with validation middleware)
router.post(
  "/warehouse-profile",
  validateCreateWarehouseProfile,
  createWarehouseProfile
);

// Update warehouse profile (with validation middleware)
router.patch(
  "/warehouse-profile/:id",
  validateUpdateWarehouseProfile,
  updateWarehouseProfile
);

export default router;
