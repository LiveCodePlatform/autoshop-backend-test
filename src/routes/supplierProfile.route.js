/**
 * Supplier Profile Routes
 * API endpoint definitions for supplier profile operations
 */

import { Router } from "express";
import {
  createSupplierProfile,
  getAllSupplierProfiles,
  getSupplierProfileById,
  updateSupplierProfile,
  softDeleteSupplierProfile,
  restoreSupplierProfile,
  deleteSupplierProfile,
} from "../controllers/supplierProfile.controller.js";
import {
  validateCreateSupplierProfile,
  validateUpdateSupplierProfile,
} from "../validators/supplierProfile.validator.js";

const router = Router();

/**
 * @route   GET /api/v2/supplier-profile
 * @desc    Get all supplier profiles with pagination and filters
 * @access  Public (add protect middleware if needed)
 */
router.get("/supplier-profile", getAllSupplierProfiles);

/**
 * @route   GET /api/v2/supplier-profile/:id
 * @desc    Get supplier profile by ID
 * @access  Public (add protect middleware if needed)
 */
router.get("/supplier-profile/:id", getSupplierProfileById);

/**
 * @route   POST /api/v2/supplier-profile
 * @desc    Create new supplier profile
 * @access  Public (add protect middleware if needed)
 */
router.post(
  "/supplier-profile",
  validateCreateSupplierProfile,
  createSupplierProfile
);

/**
 * @route   PATCH /api/v2/supplier-profile/:id
 * @desc    Update supplier profile
 * @access  Public (add protect middleware if needed)
 */
router.patch(
  "/supplier-profile/:id",
  validateUpdateSupplierProfile,
  updateSupplierProfile
);

/**
 * @route   PATCH /api/v2/supplier-profile/:id/soft-delete
 * @desc    Soft delete supplier profile
 * @access  Public (add protect middleware if needed)
 */
router.patch("/supplier-profile/:id/soft-delete", softDeleteSupplierProfile);

/**
 * @route   PATCH /api/v2/supplier-profile/:id/restore
 * @desc    Restore soft deleted supplier profile
 * @access  Public (add protect middleware if needed)
 */
router.patch("/supplier-profile/:id/restore", restoreSupplierProfile);

/**
 * @route   DELETE /api/v2/supplier-profile/:id
 * @desc    Hard delete supplier profile
 * @access  Public (add protect middleware if needed)
 */
router.delete("/supplier-profile/:id", deleteSupplierProfile);

export default router;
