/**
 * Credit Record Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getCreditRecordService } from "../loaders/services.loader.js";

class CreditRecordController {
  /**
   * @param {CreditRecordService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getCreditRecordService();
  }

  /**
   * Create credit payment (for partial/full payment on credit orders)
   * POST /api/credit-records
   */
  createCreditPayment = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.createCreditPayment(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Credit payment recorded successfully",
      data: result,
    });
  });

  /**
   * Get all credit records for an order
   * GET /api/credit-records/order/:orderId
   */
  getCreditRecordsByOrderId = asyncErrorHandler(async (req, res, next) => {
    const { orderId } = req.params;
    const result = await this.service.getCreditRecordsByOrderId(orderId);

    res.status(200).json({
      success: true,
      message: "Credit records retrieved successfully",
      data: result,
    });
  });

  /**
   * Get all credit records (with filtering)
   * GET /api/credit-records
   */
  getAllCreditRecords = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.getAllCreditRecords(req.query);

    res.status(200).json({
      success: true,
      message: "Credit records retrieved successfully",
      data: result.creditRecords,
      pagination: result.pagination,
    });
  });

  /**
   * Get credit record by ID
   * GET /api/credit-records/:id
   */
  getCreditRecordById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.getCreditRecordById(id);

    res.status(200).json({
      success: true,
      message: "Credit record retrieved successfully",
      data: result,
    });
  });

  /**
   * Get all credit records for a specific credit person
   * GET /api/credit-records/credit-person/:creditPersonId
   */
  getCreditRecordsByCreditPersonId = asyncErrorHandler(
    async (req, res, next) => {
      const { creditPersonId } = req.params;
      const result = await this.service.getCreditRecordsByCreditPersonId(
        creditPersonId,
        req.query
      );

      // Handle empty result case
      if (result.creditRecords.count === 0 && result.orders.length === 0) {
        res.status(200).json({
          success: true,
          message: "No credit records found for this credit person",
          data: {
            creditPerson: result.creditPerson,
            orders: result.orders,
            creditRecords: result.creditRecords,
            summary: result.summary,
          },
          pagination: result.pagination,
        });
      } else {
        res.status(200).json({
          success: true,
          message: "Credit records retrieved successfully",
          data: {
            creditPerson: result.creditPerson,
            orders: result.orders,
            creditRecords: result.creditRecords,
            summary: result.summary,
          },
          pagination: result.pagination,
        });
      }
    }
  );
}

// Export instance
const creditRecordController = new CreditRecordController();
export const {
  createCreditPayment,
  getCreditRecordsByOrderId,
  getAllCreditRecords,
  getCreditRecordById,
  getCreditRecordsByCreditPersonId,
} = creditRecordController;

export default creditRecordController;
