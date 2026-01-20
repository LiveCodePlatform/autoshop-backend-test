import { Router } from "express";
import {
  createStorefrontProfile,
  getAllStorefrontProfiles,
  getStorefrontProfileById,
  updateStorefrontProfile,
} from "../controllers/storefrontProfile.controller.js";
import {
  validateCreateStorefrontProfile,
  validateUpdateStorefrontProfile,
  validateGetStorefrontProfilesQuery,
} from "../validators/storefrontProfile.validator.js";

const router = Router();

// Get all storefront profiles with pagination and filters
router.get(
  "/storefront-profile",
  validateGetStorefrontProfilesQuery,
  getAllStorefrontProfiles
);

// Get storefront profile by ID
router.get("/storefront-profile/:id", getStorefrontProfileById);

// Create new storefront profile (with validation middleware)
router.post(
  "/storefront-profile",
  validateCreateStorefrontProfile,
  createStorefrontProfile
);

// Update storefront profile (with validation middleware)
router.patch(
  "/storefront-profile/:id",
  validateUpdateStorefrontProfile,
  updateStorefrontProfile
);

export default router;
