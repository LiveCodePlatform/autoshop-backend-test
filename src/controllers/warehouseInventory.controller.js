/**
 * Warehouse Inventory Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getWarehouseInventoryService } from "../loaders/services.loader.js";

class WarehouseInventoryController {
  /**
   * @param {WarehouseInventoryService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getWarehouseInventoryService();
  }

  /**
   * Create warehouse inventory records for multiple inventory items
   * POST /api/warehouse-inventory
   */
  createWarehouseInventory = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.createWarehouseInventory(req.body);

    res.status(201).json({
      success: true,
      message: `Processed ${result.summary.total} inventory record(s)`,
      data: result,
    });
  });

  /**
   * Get all warehouse inventory records with pagination and filters
   * GET /api/warehouse-inventory
   */
  getAllWarehouseInventory = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.getAllWarehouseInventory(req.query);

    res.status(200).json(result.toJSON());
  });

  /**
   * Get warehouse inventory by ID
   * GET /api/warehouse-inventory/:id
   */
  getWarehouseInventoryById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.getWarehouseInventoryById(id);

    res.status(200).json({
      success: true,
      message: "Warehouse inventory retrieved successfully",
      data: result,
    });
  });

  /**
   * Update warehouse inventory quantity with ACID compliance
   * PATCH /api/warehouse/:id/quantity
   */
  updateWarehouseInventoryQuantity = asyncErrorHandler(
    async (req, res, next) => {
      const { id } = req.params;
      const { quantityChange, reason } = req.body;
      const adminId = req.user?._id;

      const result = await this.service.updateWarehouseInventoryQuantity(
        id,
        quantityChange,
        reason,
        adminId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.warehouseInventory,
      });
    }
  );
}

// Export instance
const warehouseInventoryController = new WarehouseInventoryController();
export const {
  createWarehouseInventory,
  getAllWarehouseInventory,
  getWarehouseInventoryById,
  updateWarehouseInventoryQuantity,
} = warehouseInventoryController;

export default warehouseInventoryController;
