/**
 * Stock Audit Log Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getStockAuditLogService } from "../loaders/services.loader.js";

class StockAuditLogController {
  /**
   * @param {StockAuditLogService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getStockAuditLogService();
  }

  /**
   * Create new stock audit log entry
   * POST /api/stock-audit-logs
   */
  createStockAuditLog = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.createStockAuditLog(req.body);

    res.status(201).json({
      success: true,
      message: "Stock audit log created successfully",
      data: result,
    });
  });

  /**
   * Get all stock audit logs with pagination and filters
   * GET /api/stock-audit-logs
   */
  getAllStockAuditLogs = asyncErrorHandler(async (req, res, next) => {
    // Use validated query if available, otherwise fallback to original query
    const queryParams = req.validatedQuery || req.query;
    const result = await this.service.getAllStockAuditLogs(queryParams);

    res.status(200).json(result.toJSON());
  });

  /**
   * Get stock audit log by ID
   * GET /api/stock-audit-logs/:id
   */
  getStockAuditLogById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.getStockAuditLogById(id);

    res.status(200).json({
      success: true,
      message: "Stock audit log retrieved successfully",
      data: result,
    });
  });
}

// Export instance
const stockAuditLogController = new StockAuditLogController();
export const {
  createStockAuditLog,
  getAllStockAuditLogs,
  getStockAuditLogById,
} = stockAuditLogController;

export default stockAuditLogController;
