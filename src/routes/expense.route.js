/**
 * Expense Routes
 * API endpoint definitions for expense operations
 */

import { Router } from "express";
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from "../controllers/expense.controller.js";
import {
  validateCreateExpense,
  validateUpdateExpense,
} from "../validators/expense.validator.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route   POST /api/v2/expense
 * @desc    Create new expense
 * @access  Private (requires authentication)
 */
router.post("/expense", protect, validateCreateExpense, createExpense);

/**
 * @route   GET /api/v2/expense
 * @desc    Get all expenses with pagination and filters
 * @access  Private (requires authentication)
 */
router.get("/expense", protect, getExpenses);

/**
 * @route   GET /api/v2/expense/:id
 * @desc    Get expense by ID
 * @access  Private (requires authentication)
 */
router.get("/expense/:id", protect, getExpenseById);

/**
 * @route   PATCH /api/v2/expense/:id
 * @desc    Update expense
 * @access  Private (requires authentication)
 */
router.patch("/expense/:id", protect, validateUpdateExpense, updateExpense);

/**
 * @route   DELETE /api/v2/expense/:id
 * @desc    Delete expense
 * @access  Private (requires authentication)
 */
router.delete("/expense/:id", protect, deleteExpense);

export default router;
