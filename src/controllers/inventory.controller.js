/**
 * New Inventory Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 *
 * Old controller: controllers/inventory.controller.js (unchanged)
 * New controller: controller/inventory.controller.new.js (this file)
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getInventoryService } from "../loaders/services.loader.js";
import { uploadImageToR2, deleteImageFromR2 } from "../shared/utils/cloudflareR2.utils.js";

class InventoryController {
  /**
   * @param {InventoryService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getInventoryService();
  }

  /**
   * Create new inventory item
   * POST /api/inventory
   */
  createInventory = asyncErrorHandler(async (req, res, next) => {
    const payload = { ...req.body };

    if (req.files && req.files.length > 0) {
      const images = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const uploadedImage = await uploadImageToR2(file, "inventory");
        images.push({
          url: uploadedImage.url,
          key: uploadedImage.spaceKey,
          primary: i === 0,
        });
      }
      payload.images = images;
    }

    const result = await this.service.createInventory(payload);

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Get all inventory items with pagination and filters
   * GET /api/inventory
   */
  getAllInventory = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.getAllInventory(req.query);

    res.status(200).json({
      success: true,
      message: "Inventory items retrieved successfully",
      data: result.inventories,
      pagination: result.pagination,
    });
  });

  /**
   * Get inventory item by ID
   * GET /api/inventory/:id
   */
  getInventoryById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.getInventoryById(id);

    res.status(200).json({
      success: true,
      message: "Inventory item retrieved successfully",
      data: result, // result is already a plain object, no need for .toJSON()
    });
  });

  /**
   * Update inventory item metadata
   * PATCH /api/inventory/:id
   */
  updateInventory = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const payload = { ...req.body };

    if (req.files && req.files.length > 0) {
      const images = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const uploadedImage = await uploadImageToR2(file, "inventory");
        images.push({
          url: uploadedImage.url,
          key: uploadedImage.spaceKey,
          primary: false, // New images will default to not primary unless managed by frontend
        });
      }
      payload.images = images;
    }

    const result = await this.service.updateInventory(id, payload);

    res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      data: result.toJSON(),
    });
  });
}

// Export instance
const inventoryController = new InventoryController();
export const {
  createInventory,
  getAllInventory,
  getInventoryById,
  updateInventory,
} = inventoryController;

export default inventoryController;
