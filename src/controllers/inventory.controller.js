/**
 * New Inventory Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 *
 * Old controller: controllers/inventory.controller.js (unchanged)
 * New controller: controller/inventory.controller.new.js (this file)
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getInventoryService } from "../loaders/services.loader.js";

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
    const result = await this.service.createInventory(req.body);

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
    const response = result.toJSON();

    res.status(200).json({
      ...response,
      message: "Inventory items retrieved successfully",
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
      data: result.toJSON(),
    });
  });
}

// Export instance
const inventoryController = new InventoryController();
export const { createInventory, getAllInventory, getInventoryById } =
  inventoryController;

export default inventoryController;
