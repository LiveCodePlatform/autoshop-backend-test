import { Router } from "express";
import {
  createStockAuditLog,
  getAllStockAuditLogs,
  getStockAuditLogById,
} from "../controllers/stockAuditLog.controller.js";
import {
  validateCreateStockAuditLog,
  validateGetStockAuditLogsQuery,
} from "../validators/stockAuditLog.validator.js";

const router = Router();

// Get all stock audit logs with pagination and filters (with query validation)
router.get(
  "/stock-audit-logs",
  validateGetStockAuditLogsQuery,
  getAllStockAuditLogs
);

// Get stock audit log by ID
router.get("/stock-audit-logs/:id", getStockAuditLogById);

// Create new stock audit log entry (with validation middleware)
router.post(
  "/stock-audit-logs",
  validateCreateStockAuditLog,
  createStockAuditLog
);

export default router;
