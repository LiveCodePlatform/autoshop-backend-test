/**
 * Social Media Sale Inventory Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getSocialMediaSaleInventoryService } from "../loaders/services.loader.js";

class SocialMediaSaleInventoryController {
  /**
   * @param {SocialMediaSaleInventoryService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getSocialMediaSaleInventoryService();
  }

  /**
   * Create social media sale inventory records for multiple inventory items
   * POST /api/v2/social-inventory
   */
  createSocialMediaSaleInventory = asyncErrorHandler(async (req, res, next) => {
    const validatedData = req.validatedData || req.body;
    const result = await this.service.createSocialMediaSaleInventory(
      validatedData
    );

    res.status(201).json({
      success: true,
      message: `Processed ${validatedData.inventoryIds.length} inventory record(s)`,
      data: result,
    });
  });

  /**
   * Get all social media sale inventory with pagination and filters
   * GET /api/v2/social-inventory
   */
  getAllSocialMediaSaleInventory = asyncErrorHandler(async (req, res, next) => {
    const queryParams = req.validatedQuery || req.query;
    const result = await this.service.getAllSocialMediaSaleInventory(
      queryParams
    );
    const response = result;

    res.status(200).json({
      ...response,
      message: "Social media sale inventory retrieved successfully",
    });
  });

  /**
   * Get social media sale inventory by ID
   * GET /api/v2/social-inventory/:id
   */
  getSocialMediaSaleInventoryById = asyncErrorHandler(
    async (req, res, next) => {
      const { id } = req.params;
      const result = await this.service.getSocialMediaSaleInventoryById(id);

      res.status(200).json({
        success: true,
        message: "Social media sale inventory retrieved successfully",
        data: result,
      });
    }
  );

  /**
   * Update social media sale inventory quantity
   * PUT /api/v2/social-inventory/:id
   */
  updateSocialMediaSaleInventoryQuantity = asyncErrorHandler(
    async (req, res, next) => {
      const { id } = req.params;
      const validatedData = req.validatedData || req.body;
      const { quantityChange, reason } = validatedData;

      // Get admin ID from authenticated user
      const adminId = req.user?._id;
      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required. Admin ID not found.",
        });
      }

      const result = await this.service.updateSocialMediaSaleInventoryQuantity(
        id,
        quantityChange,
        reason,
        adminId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        operation: result.operation,
      });
    }
  );
}

// Export instance
const socialMediaSaleInventoryController =
  new SocialMediaSaleInventoryController();
export const {
  createSocialMediaSaleInventory,
  getAllSocialMediaSaleInventory,
  getSocialMediaSaleInventoryById,
  updateSocialMediaSaleInventoryQuantity,
} = socialMediaSaleInventoryController;

export default socialMediaSaleInventoryController;
