/**
 * Transfer Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getTransferService } from "../loaders/services.loader.js";
import { UnauthorizedError } from "../errors/errorTypes.js";

class TransferController {
  /**
   * @param {TransferService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getTransferService();
  }

  /**
   * Create new transfer (supports both GRN → Warehouse and Warehouse → Storefront)
   * POST /api/transfers
   */
  createTransfer = asyncErrorHandler(async (req, res, next) => {
    if (!req.user || !req.user._id) {
      return next(
        new UnauthorizedError("Authentication required. Admin account ID is missing.")
      );
    }

    const result = await this.service.createTransfer(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Transfer created and stock transferred successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Get all transfers
   * GET /api/transfers
   */
  getTransfers = asyncErrorHandler(async (req, res, next) => {
    const transfers = await this.service.getAllTransfers(req.query);
    const transfersData = transfers.map((transfer) => transfer.toJSON());

    res.status(200).json({
      success: true,
      message: "Transfers fetched successfully",
      data: transfersData,
    });
  });

  /**
   * Get transfer by ID
   * GET /api/transfers/:id
   */
  getTransferById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.getTransferById(id);

    res.status(200).json({
      success: true,
      message: "Transfer fetched successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Update transfer status
   * PATCH /api/transfers/:id/status
   */
  updateTransferStatus = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    const result = await this.service.updateTransferStatus(id, status);

    res.status(200).json({
      success: true,
      message: "Transfer status updated successfully",
      data: result.toJSON(),
    });
  });
}

// Export instance
const transferController = new TransferController();
export const {
  createTransfer,
  getTransfers,
  getTransferById,
  updateTransferStatus,
} = transferController;

export default transferController;
