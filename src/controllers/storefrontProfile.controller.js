/**
 * Storefront Profile Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getStorefrontProfileService } from "../loaders/services.loader.js";

class StorefrontProfileController {
  /**
   * @param {StorefrontProfileService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getStorefrontProfileService();
  }

  /**
   * Create new storefront profile
   * POST /api/v2/storefront-profile
   */
  createStorefrontProfile = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.createStorefrontProfile(req.body);

    res.status(201).json({
      success: true,
      message: "Storefront profile created successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Get all storefront profiles with pagination and filters
   * GET /api/v2/storefront-profile
   */
  getAllStorefrontProfiles = asyncErrorHandler(async (req, res, next) => {
    const queryParams = req.validatedQuery || req.query;
    const result = await this.service.getAllStorefrontProfiles(queryParams);

    res.status(200).json(result.toJSON());
  });

  /**
   * Get storefront profile by ID
   * GET /api/v2/storefront-profile/:id
   */
  getStorefrontProfileById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.getStorefrontProfileById(id);

    res.status(200).json({
      success: true,
      message: "Storefront profile retrieved successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Update storefront profile
   * PATCH /api/v2/storefront-profile/:id
   */
  updateStorefrontProfile = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.updateStorefrontProfile(id, req.body);

    res.status(200).json({
      success: true,
      message: "Storefront profile updated successfully",
      data: result.toJSON(),
    });
  });
}

// Export instance
const storefrontProfileController = new StorefrontProfileController();
export const {
  createStorefrontProfile,
  getAllStorefrontProfiles,
  getStorefrontProfileById,
  updateStorefrontProfile,
} = storefrontProfileController;

export default storefrontProfileController;
