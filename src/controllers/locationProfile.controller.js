/**
 * Location Profile Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getLocationProfileService } from "../loaders/services.loader.js";

class LocationProfileController {
  /**
   * @param {LocationProfileService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getLocationProfileService();
  }

  /**
   * Get all location profiles with pagination and filters
   * GET /api/v2/location-profile
   */
  getAllLocationProfiles = asyncErrorHandler(async (req, res, next) => {
    const queryParams = req.query;
    const result = await this.service.getAllLocationProfiles(queryParams);

    res.status(200).json(result.toJSON());
  });

  /**
   * Get location profile by ID
   * GET /api/v2/location-profile/:id
   */
  getLocationProfileById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.getLocationProfileById(id);

    res.status(200).json({
      success: true,
      message: "Location profile retrieved successfully",
      data: result,
    });
  });
}

// Export instance
const locationProfileController = new LocationProfileController();
export const { getAllLocationProfiles, getLocationProfileById } =
  locationProfileController;

export default locationProfileController;
