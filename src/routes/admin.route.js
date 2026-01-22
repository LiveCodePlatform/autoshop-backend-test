/**
 * Admin Routes
 * API endpoint definitions for admin operations
 */

import { Router } from "express";
import {
  signup,
  login,
  getAllAccounts,
  getAccountById,
  getAdminById,
  updateUser,
  updateAdmin,
  updatePassword,
  userSoftDelete,
  userRestore,
  userDelete,
} from "../controllers/admin.controller.js";
import {
  validateCreateAdmin,
  validateLogin,
  validateUpdateAdmin,
  validateUpdatePassword,
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
 * @route   GET /api/admin
 * @desc    Get all accounts
 * @access  Public (add protect middleware if needed)
 */
router.get("/admin", getAllAccounts);

/**
 * @route   GET /api/admin/:accountId
 * @desc    Get admin by ID (legacy route - matches legacy URL naming)
 * @access  Public (add protect middleware if needed)
 */
router.get("/admin/:accountId", getAccountById);

/**
 * @route   PATCH /api/admin/:accountId
 * @desc    Update admin (legacy route - matches legacy URL naming)
 * @access  Private (add protect middleware if needed)
 */
router.patch("/admin/:accountId", validateUpdateAdmin, updateUser);

/**
 * @route   PATCH /api/admin/update-password/:accountId
 * @desc    Update admin password
 * @access  Private (add protect middleware if needed)
 */
router.patch(
  "/admin/update-password/:accountId",
  validateUpdatePassword,
  updatePassword
);

/**
 * @route   PATCH /api/admin/soft-delete/:accountId
 * @desc    Soft delete admin
 * @access  Private (add protect middleware if needed)
 */
router.patch("/admin/soft-delete/:accountId", userSoftDelete);

/**
 * @route   PATCH /api/admin/restore/:accountId
 * @desc    Restore soft deleted admin
 * @access  Private (add protect middleware if needed)
 */
router.patch("/admin/restore/:accountId", userRestore);

/**
 * @route   DELETE /api/admin/:accountId
 * @desc    Delete admin permanently
 * @access  Private (add protect middleware if needed)
 */
router.delete("/admin/:accountId", userDelete);

export default router;
