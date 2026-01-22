/**
 * Admin Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getAdminService } from "../loaders/services.loader.js";

class AdminController {
  /**
   * @param {AdminService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getAdminService();
  }

  /**
   * Signup - Create new admin account
   * POST /api/admin/signup
   */
  signup = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.signup(req.body);

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Login - Authenticate admin and return token
   * POST /api/admin/login
   */
  login = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.login(req.body);

    res.status(200).json({
      success: true,
      message: "Admin Dashboard",
      data: result.toJSON(),
    });
  });

  /**
   * Get all accounts
   * GET /api/admin
   */
  getAllAccounts = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.getAllAccounts();

    res.status(200).json({
      success: true,
      message: "Accounts retrieved successfully",
      data: result,
    });
  });

  /**
   * Get admin by ID
   * GET /api/admin/:accountId
   */
  getAccountById = asyncErrorHandler(async (req, res, next) => {
    const { accountId } = req.params;
    const result = await this.service.getAccountById(accountId);

    res.status(200).json({
      success: true,
      message: "Account retrieved successfully",
      data: result,
    });
  });

  /**
   * Get admin by ID (alias)
   * GET /api/admin/:id
   */
  getAdminById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.getAdminById(id);

    res.status(200).json({
      success: true,
      message: "Admin retrieved successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Update admin
   * PATCH /api/admin/:accountId
   */
  updateUser = asyncErrorHandler(async (req, res, next) => {
    const { accountId } = req.params;
    const result = await this.service.updateUser(accountId, req.body);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result,
    });
  });

  /**
   * Update admin (alias)
   * PATCH /api/admin/:id
   */
  updateAdmin = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.updateAdmin(id, req.body);

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Update password
   * PATCH /api/admin/update-password/:accountId
   */
  updatePassword = asyncErrorHandler(async (req, res, next) => {
    const { accountId } = req.params;
    const result = await this.service.updatePassword(accountId, req.body);

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      data: result,
    });
  });

  /**
   * Soft delete admin
   * PATCH /api/admin/soft-delete/:accountId
   */
  userSoftDelete = asyncErrorHandler(async (req, res, next) => {
    const { accountId } = req.params;
    const result = await this.service.userSoftDelete(accountId);

    res.status(200).json({
      success: true,
      message: "User soft deleted successfully",
      data: result,
    });
  });

  /**
   * Restore soft deleted admin
   * PATCH /api/admin/restore/:accountId
   */
  userRestore = asyncErrorHandler(async (req, res, next) => {
    const { accountId } = req.params;
    const result = await this.service.userRestore(accountId);

    res.status(200).json({
      success: true,
      message: "User restored successfully",
      data: result,
    });
  });

  /**
   * Delete admin permanently
   * DELETE /api/admin/:accountId
   */
  userDelete = asyncErrorHandler(async (req, res, next) => {
    const { accountId } = req.params;
    const result = await this.service.userDelete(accountId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: result,
    });
  });
}

// Export instance
const adminController = new AdminController();
export const {
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
} = adminController;

export default adminController;
