/**
 * Credit Record Routes
 * API endpoint definitions for credit record operations
 */

import { Router } from "express";
import {
  createCreditPayment,
  getCreditRecordsByOrderId,
  getAllCreditRecords,
  getCreditRecordById,
  getCreditRecordsByCreditPersonId,
} from "../controllers/creditRecord.controller.js";
import { validateCreateCreditRecord } from "../validators/creditRecord.validator.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route   POST /api/v2/credit-record
 * @desc    Create credit payment for an order
 * @access  Private (requires authentication)
 */
router.post(
  "/credit-record",
  protect,
  validateCreateCreditRecord,
  createCreditPayment
);

/**
 * @route   GET /api/v2/credit-record
 * @desc    Get all credit records (with optional filtering)
 * @access  Public (add protect middleware if needed)
 */
router.get("/credit-record", getAllCreditRecords);

/**
 * @route   GET /api/v2/credit-record/:id
 * @desc    Get credit record by ID
 * @access  Public (add protect middleware if needed)
 */
router.get("/credit-record/:id", getCreditRecordById);

/**
 * @route   GET /api/v2/order/:orderId/credit-records
 * @desc    Get all credit records for a specific order
 * @access  Public (add protect middleware if needed)
 */
router.get("/order/:orderId/credit-records", getCreditRecordsByOrderId);

/**
 * @route   GET /api/v2/credit-persona/:creditPersonId/credit-records
 * @desc    Get all credit records for a specific credit person
 * @access  Public (add protect middleware if needed)
 */
router.get(
  "/credit-persona/:creditPersonId/credit-records",
  getCreditRecordsByCreditPersonId
);

export default router;
