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
   * Get admin by ID
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
}

// Export instance
const adminController = new AdminController();
export const { signup, login, getAdminById, updateAdmin } = adminController;

export default adminController;
