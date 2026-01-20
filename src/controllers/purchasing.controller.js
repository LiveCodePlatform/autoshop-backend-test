/**
 * Purchasing Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getPurchasingService } from "../loaders/services.loader.js";

class PurchasingController {
  /**
   * @param {PurchasingService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getPurchasingService();
  }

  /**
   * Create new purchasing order
   * POST /api/purchases
   */
  createPurchase = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.createPurchase(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Get all purchasing orders with pagination and filters
   * GET /api/purchases
   */
  getAllPurchases = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.getAllPurchases(req.query);

    res.status(200).json({
      success: true,
      message: "All purchases retrieved successfully",
      data: result.purchases,
      pagination: result.pagination,
    });
  });

  /**
   * Get purchasing order by ID
   * GET /api/purchases/:id
   */
  getPurchaseById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const includeDeleted = req.query.includeDeleted === "true";
    const result = await this.service.getPurchaseById(id, { includeDeleted });

    res.status(200).json({
      success: true,
      message: "Purchase retrieved successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Update purchasing order status
   * PATCH /api/purchases/:id/status
   */
  updatePurchaseStatus = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await this.service.updatePurchaseStatus(id, status);

    res.status(200).json({
      success: true,
      message: "Purchase status updated successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Soft delete purchasing order
   * PATCH /api/purchases/:id/soft-delete
   */
  softDeletePurchase = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.softDeletePurchase(id);

    res.status(200).json({
      success: true,
      message: "Purchase order soft deleted successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Restore soft deleted purchasing order
   * PATCH /api/purchases/:id/restore
   */
  restorePurchase = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.restorePurchase(id);

    res.status(200).json({
      success: true,
      message: "Purchase order restored successfully",
      data: result.toJSON(),
    });
  });
}

// Export instance
const purchasingController = new PurchasingController();
export const {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchaseStatus,
  softDeletePurchase,
  restorePurchase,
} = purchasingController;

export default purchasingController;
