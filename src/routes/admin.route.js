/**
 * Admin Routes
 * API endpoint definitions for admin operations
 */

import { Router } from "express";
import {
  signup,
  login,
  getAdminById,
  updateAdmin,
} from "../controllers/admin.controller.js";
import {
  validateCreateAdmin,
  validateLogin,
  validateUpdateAdmin,
} from "../validators/admin.validator.js";

const router = Router();

/**
 * @route   POST /api/admin/signup
 * @desc    Create new admin account
 * @access  Public
 */
router.post("/admin/signup", validateCreateAdmin, signup);

/**
 * @route   POST /api/admin/login
 * @desc    Authenticate admin and return token
 * @access  Public
 */
router.post("/admin/login", validateLogin, login);

/**
 * @route   GET /api/admin/:id
 * @desc    Get admin by ID
 * @access  Private (add protect middleware if needed)
 */
router.get("/admin/:id", getAdminById);

/**
 * @route   PATCH /api/admin/:id
 * @desc    Update admin
 * @access  Private (add protect middleware if needed)
 */
router.patch("/admin/:id", validateUpdateAdmin, updateAdmin);

export default router;
