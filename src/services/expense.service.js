/**
 * Expense Service
 * Business logic layer for Expense operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { ExpenseRepository } from "../repositories/expense.repository.js";
import {
  CreateExpenseDTO,
  UpdateExpenseDTO,
  ExpenseResponseDTO,
  ExpenseListResponseDTO,
} from "../dtos/expense.dto.js";
import { NotFoundError, CastError, ValidationError } from "../errors/errorTypes.js";
import { EXPENSE_FIELDS } from "../types/expense.types.js";
import mongoose from "mongoose";
import { createDateFilter } from "../shared/utils/dateFilter.utils.js";
import CustomError from "../shared/utils/customError.js";
export class ExpenseService {
  /**
   * @param {ExpenseRepository} repository - Injected repository instance (optional, fallback creates new instance)
   */
  constructor(repository) {
    this.repository = repository || new ExpenseRepository();
  }

  /**
   * Create new expense
   * Matches legacy logic exactly
   * @param {Object} data - Request data (category, amount, date, notes)
   * @param {Object} user - Authenticated user object (contains _id and locationId)
   * @returns {Promise<ExpenseResponseDTO>} Created expense DTO
   * @throws {CastError} If invalid locationId or adminId format
   */
  async createExpense(data, user) {
    const { category, amount, date, notes } = data;

    // Get locationId and adminId from authenticated user (matches legacy exactly)
    const locationId = user.locationId;
    const adminId = user._id;

    // Validate ObjectId formats (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      throw new CastError("Invalid location ID format", "locationId");
    }
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw new CastError("Invalid admin ID format", "adminId");
    }

    // Create expense (matches legacy exactly - no DTO transformation, direct creation)
    const expense = await this.repository.create({
      category,
      amount,
      date,
      notes,
      locationId,
      adminId,
    });

    // Return DTO (matches legacy structure - no population after creation)
    return new ExpenseResponseDTO(expense);
  }

  /**
   * Get all expenses
   * Matches legacy logic exactly - no pagination, just date filter
   * @param {Object} queryParams - Query parameters (startDate, endDate)
   * @returns {Promise<Array>} Array of expense DTOs
   */
  async getExpenses(queryParams = {}) {
    // Build query filter (matches legacy exactly)
    const filter = {};

    // Add date range filter using dateFilter utility
    // Filter by the 'date' field (expense date) rather than createdAt (matches legacy exactly)
    try {
      const dateFilter = createDateFilter(queryParams, "date", false);
      Object.assign(filter, dateFilter);
    } catch (error) {
      // If it's a CustomError, pass it through (matches legacy exactly)
      if (error instanceof CustomError) {
        throw error;
      }
      // For other errors, wrap and throw (matches legacy exactly)
      throw new ValidationError(error.message || "Invalid date filter");
    }

    // Find all expenses with populate (matches legacy exactly - no pagination, no sorting)
    const expenses = await this.repository.find(filter, {
      populate: {
        locationId: "type locationName locationCode locationAddress",
        adminId: "name role",
      },
    });

    // Return array of DTOs (matches legacy structure)
    return expenses.map((expense) => new ExpenseResponseDTO(expense));
  }

  /**
   * Get expense by ID
   * @param {string} id - Expense ID
   * @returns {Promise<ExpenseResponseDTO>} Expense DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If expense not found
   */
  async getExpenseById(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid expense ID format", "id");
    }

    // Find expense with populated fields
    const expense = await this.repository.findById(id, {
      locationId: "type locationName locationCode locationAddress",
      adminId: "name role",
    });

    if (!expense) {
      throw new NotFoundError("Expense", id);
    }

    // Return DTO
    return new ExpenseResponseDTO(expense);
  }

  /**
   * Update expense
   * Matches legacy logic exactly
   * @param {string} id - Expense ID
   * @param {Object} data - Update data (category, amount, date, notes)
   * @param {Object} user - Authenticated user object (contains _id)
   * @returns {Promise<ExpenseResponseDTO>} Updated expense DTO
   * @throws {CastError} If invalid ID format or invalid adminId format
   * @throws {NotFoundError} If expense not found
   */
  async updateExpense(id, data, user) {
    const { category, amount, date, notes } = data;

    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid expense ID format", "id");
    }

    // Get adminId from authenticated user (matches legacy exactly)
    const adminId = user._id;
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw new CastError("Invalid admin ID format", "adminId");
    }

    // Update expense with populate in same chain (matches legacy exactly - no existence check before, direct update)
    const expense = await this.repository.findByIdAndUpdate(
      id,
      { category, amount, date, notes, adminId },
      { new: true, runValidators: true }
    )
      .populate({
        path: "locationId",
        select: "type locationName locationCode locationAddress",
      })
      .populate({
        path: "adminId",
        select: "name role",
      });

    // Check if not found (matches legacy exactly)
    if (!expense) {
      throw new NotFoundError("Expense not found", id);
    }

    // Return DTO
    return new ExpenseResponseDTO(expense);
  }

  /**
   * Delete expense
   * Matches legacy logic exactly
   * @param {string} id - Expense ID
   * @returns {Promise<ExpenseResponseDTO>} Deleted expense DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If expense not found
   */
  async deleteExpense(id) {
    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid expense ID format", "id");
    }

    // Delete expense with populate in same chain (matches legacy exactly)
    const expense = await this.repository.findByIdAndDelete(id)
      .populate({
        path: "locationId",
        select: "type locationName locationCode locationAddress",
      })
      .populate({
        path: "adminId",
        select: "name role",
      });

    // Check if not found (matches legacy exactly)
    if (!expense) {
      throw new NotFoundError("Expense not found", id);
    }

    // Return DTO
    return new ExpenseResponseDTO(expense);
  }
}

export default ExpenseService;
