/**
 * Supplier Profile Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getSupplierProfileService } from "../loaders/services.loader.js";

class SupplierProfileController {
  /**
   * @param {SupplierProfileService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getSupplierProfileService();
  }

  /**
   * Create new supplier profile
   * POST /api/supplier-profiles
   */
  createSupplierProfile = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.createSupplierProfile(req.body);

    res.status(201).json({
      success: true,
      message: "Supplier profile created successfully",
      data: result,
    });
  });

  /**
   * Get all supplier profiles with pagination and filters
   * GET /api/supplier-profiles
   */
  getAllSupplierProfiles = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.getAllSupplierProfiles(req.query);
    const response = result;

    res.status(200).json({
      ...response,
      message: "Supplier profiles retrieved successfully",
    });
  });

  /**
   * Get supplier profile by ID
   * GET /api/supplier-profiles/:id
   */
  getSupplierProfileById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.getSupplierProfileById(id);

    res.status(200).json({
      success: true,
      message: "Supplier profile retrieved successfully",
      data: result,
    });
  });

  /**
   * Update supplier profile
   * PATCH /api/supplier-profiles/:id
   */
  updateSupplierProfile = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.updateSupplierProfile(id, req.body);

    res.status(200).json({
      success: true,
      message: "Supplier profile updated successfully",
      data: result,
    });
  });

  /**
   * Soft delete supplier profile
   * DELETE /api/supplier-profiles/:id/soft
   */
  softDeleteSupplierProfile = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.softDeleteSupplierProfile(id);

    res.status(200).json({
      success: true,
      message: "Supplier profile soft deleted successfully",
      data: result,
    });
  });

  /**
   * Restore soft deleted supplier profile
   * POST /api/supplier-profiles/:id/restore
   */
  restoreSupplierProfile = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.restoreSupplierProfile(id);

    res.status(200).json({
      success: true,
      message: "Supplier profile restored successfully",
      data: result,
    });
  });

  /**
   * Hard delete supplier profile
   * DELETE /api/supplier-profiles/:id
   */
  deleteSupplierProfile = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.deleteSupplierProfile(id);

    res.status(200).json({
      success: true,
      message: "Supplier profile deleted successfully",
      data: result,
    });
  });
}

// Export instance
const supplierProfileController = new SupplierProfileController();
export const {
  createSupplierProfile,
  getAllSupplierProfiles,
  getSupplierProfileById,
  updateSupplierProfile,
  softDeleteSupplierProfile,
  restoreSupplierProfile,
  deleteSupplierProfile,
} = supplierProfileController;

export default supplierProfileController;
