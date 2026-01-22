/**
 * Location Profile Routes
 * API endpoint definitions for location profile operations (unified for both warehouse and storefront)
 */

import { Router } from "express";
import {
  getAllLocationProfiles,
  getLocationProfileById,
} from "../controllers/locationProfile.controller.js";

const router = Router();

/**
 * @route   GET /api/v2/location-profile
 * @desc    Get all location profiles with pagination and filters (supports type filter for warehouse/storefront)
 * @access  Public (add protect middleware if needed)
 */
router.get("/location-profile", getAllLocationProfiles);

/**
 * @route   GET /api/v2/location-profile/:id
 * @desc    Get location profile by ID
 * @access  Public (add protect middleware if needed)
 */
router.get("/location-profile/:id", getLocationProfileById);

export default router;
