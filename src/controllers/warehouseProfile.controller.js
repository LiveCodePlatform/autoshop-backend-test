/**
 * Warehouse Profile Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getWarehouseProfileService } from "../loaders/services.loader.js";

class WarehouseProfileController {
  /**
   * @param {WarehouseProfileService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getWarehouseProfileService();
  }

  /**
   * Create new warehouse profile
   * POST /api/v2/warehouse-profile
   */
  createWarehouseProfile = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.createWarehouseProfile(req.body);

    res.status(201).json({
      success: true,
      message: "Warehouse profile created successfully",
      data: result,
    });
  });

  /**
   * Get all warehouse profiles with pagination and filters
   * GET /api/v2/warehouse-profile
   */
  getAllWarehouseProfiles = asyncErrorHandler(async (req, res, next) => {
    const queryParams = req.validatedQuery || req.query;
    const result = await this.service.getAllWarehouseProfiles(queryParams);

    res.status(200).json(result.toJSON());
  });

  /**
   * Get warehouse profile by ID
   * GET /api/v2/warehouse-profile/:id
   */
  getWarehouseProfileById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.getWarehouseProfileById(id);

    res.status(200).json({
      success: true,
      message: "Warehouse profile retrieved successfully",
      data: result,
    });
  });

  /**
   * Update warehouse profile
   * PATCH /api/v2/warehouse-profile/:id
   */
  updateWarehouseProfile = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.updateWarehouseProfile(id, req.body);

    res.status(200).json({
      success: true,
      message: "Warehouse profile updated successfully",
      data: result,
    });
  });
}

// Export instance
const warehouseProfileController = new WarehouseProfileController();
export const {
  createWarehouseProfile,
  getAllWarehouseProfiles,
  getWarehouseProfileById,
  updateWarehouseProfile,
} = warehouseProfileController;

export default warehouseProfileController;
