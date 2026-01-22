/**
 * Goods Received Note (GRN) Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getGoodsRecievedNoteService } from "../loaders/services.loader.js";

class GoodsRecievedNoteController {
  /**
   * @param {GoodsRecievedNoteService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getGoodsRecievedNoteService();
  }

  /**
   * Create new GRN (Supports Partial GRN - Can receive one or more items from PO)
   * POST /api/grns
   */
  createGRN = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.createGRN(req.body);

    res.status(201).json({
      success: true,
      message: "GRN created successfully",
      data: result,
    });
  });

  /**
   * Get all GRNs with pagination and filters
   * GET /api/grns
   */
  getAllGRN = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.getAllGRN(req.query);
    const response = result;

    res.status(200).json({
      ...response,
      message: "GRNs retrieved successfully",
    });
  });

  /**
   * Get GRN by ID
   * GET /api/grns/:id
   */
  getGRNById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.getGRNById(id);

    res.status(200).json({
      success: true,
      message: "GRN retrieved successfully",
      data: result,
    });
  });

  /**
   * Update GRN status
   * PATCH /api/grns/:id/status
   */
  updateGRNStatus = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    const result = await this.service.updateGRNStatus(id, status);

    res.status(200).json({
      success: true,
      message: "GRN status updated successfully",
      data: result,
    });
  });

  /**
   * Update GRN lineItems (goodQuantity and badQuantity)
   * PATCH /api/grns/:id/line-items
   */
  updateGRNLineItems = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { lineItems } = req.body;

    const result = await this.service.updateGRNLineItems(id, lineItems);

    res.status(200).json({
      success: true,
      message: "GRN line items updated successfully",
      data: result,
    });
  });
}

// Export instance
const goodsRecievedNoteController = new GoodsRecievedNoteController();
export const {
  createGRN,
  getAllGRN,
  getGRNById,
  updateGRNStatus,
  updateGRNLineItems,
} = goodsRecievedNoteController;

export default goodsRecievedNoteController;
