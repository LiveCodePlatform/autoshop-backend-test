/**
 * Storefront Inventory Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getStorefrontInventoryService } from "../loaders/services.loader.js";

class StorefrontInventoryController {
  /**
   * @param {StorefrontInventoryService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getStorefrontInventoryService();
  }

  /**
   * Create storefront inventory records for multiple inventory items
   * POST /api/storefront-inventory
   */
  createStorefrontInventory = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.createStorefrontInventory(req.body);

    res.status(201).json({
      success: true,
      message: `Processed ${result.summary.total} inventory record(s)`,
      data: result,
    });
  });

  /**
   * Get all storefront inventory records with pagination and filters
   * GET /api/storefront-inventory
   */
  getAllStorefrontInventory = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.getAllStorefrontInventory(req.query);
    const response = result.toJSON();

    res.status(200).json({
      ...response,
      message: "Storefront inventory retrieved successfully",
    });
  });

  /**
   * Get storefront inventory by ID
   * GET /api/storefront-inventory/:id
   */
  getStorefrontInventoryById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.getStorefrontInventoryById(id);

    res.status(200).json({
      success: true,
      message: "Storefront inventory retrieved successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Update storefront inventory quantity with ACID compliance
   * PATCH /api/storefront-inventory/:id/quantity
   */
  updateStorefrontInventoryQuantity = asyncErrorHandler(
    async (req, res, next) => {
      const { id } = req.params;
      const { quantityChange, reason } = req.body;
      const adminId = req.user?._id;

      const result = await this.service.updateStorefrontInventoryQuantity(
        id,
        quantityChange,
        reason,
        adminId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.storefrontInventory.toJSON(),
        operation: result.operation,
      });
    }
  );
}

// Export instance
const storefrontInventoryController = new StorefrontInventoryController();
export const {
  createStorefrontInventory,
  getAllStorefrontInventory,
  getStorefrontInventoryById,
  updateStorefrontInventoryQuantity,
} = storefrontInventoryController;

export default storefrontInventoryController;
