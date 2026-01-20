/**
 * Expense Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getExpenseService } from "../loaders/services.loader.js";

class ExpenseController {
  /**
   * @param {ExpenseService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getExpenseService();
  }

  /**
   * Create new expense
   * POST /api/expenses
   */
  createExpense = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.createExpense(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Get all expenses with pagination and filters
   * GET /api/expenses
   */
  getExpenses = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.getExpenses(req.query);
    const response = result.toJSON();

    res.status(200).json({
      ...response,
      message: "Expenses fetched successfully",
    });
  });

  /**
   * Get expense by ID
   * GET /api/expenses/:id
   */
  getExpenseById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.getExpenseById(id);

    res.status(200).json({
      success: true,
      message: "Expense fetched successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Update expense
   * PATCH /api/expenses/:id
   */
  updateExpense = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.updateExpense(id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Delete expense
   * DELETE /api/expenses/:id
   */
  deleteExpense = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.deleteExpense(id);

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
      data: result.toJSON(),
    });
  });
}

// Export instance
const expenseController = new ExpenseController();
export const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = expenseController;

export default expenseController;
