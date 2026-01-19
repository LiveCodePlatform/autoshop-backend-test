/**
 * New Inventory Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 *
 * Old controller: controllers/inventory.controller.js (unchanged)
 * New controller: controller/inventory.controller.new.js (this file)
 */

import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import { InventoryService } from "../service/inventory.service.js";
import { HTTP_STATUS } from "../constants/statusCodes.js";
import { SUCCESS_MESSAGES } from "../constants/messages.js";

class InventoryController {
  constructor() {
    this.service = new InventoryService();
  }

  /**
   * Create new inventory item
   * POST /api/inventory
   */
  createInventory = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.createInventory(req.body);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.CREATED("Inventory item"),
      data: result.toJSON(),
    });
  });
}

// Export instance
const inventoryController = new InventoryController();
export const { createInventory } = inventoryController;

export default inventoryController;
