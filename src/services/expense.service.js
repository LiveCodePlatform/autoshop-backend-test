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
import {
  NotFoundError,
  CastError,
  ValidationError,
} from "../errors/errorTypes.js";
import { EXPENSE_FIELDS } from "../types/expense.types.js";
import { ADMIN_ROLE } from "../types/admin.types.js";
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
   * @param {Object} data - Request data (category, amount, date, notes, locationId)
   * @param {Object} user - Authenticated user object (contains _id, locationId, and role)
   * @returns {Promise<ExpenseResponseDTO>} Created expense DTO
   * @throws {CastError} If invalid locationId or adminId format
   * @throws {ValidationError} If locationId is required but missing for cashier role
   */
  async createExpense(data, user) {
    const {
      category,
      amount,
      date,
      notes,
      locationId: requestLocationId,
    } = data;

    // Get adminId and userRole from authenticated user
    const adminId = user._id;
    const userRole = user.role;
    const userLocationId = user.locationId;

    // Validate adminId format
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw new CastError("Invalid admin ID format", "adminId");
    }

    // Determine which locationId to use:
    // - Admin/Owner: Can use manually provided locationId from request, or their own, or null
    // - Cashier: Must use their own locationId (cannot override)
    let finalLocationId = null;

    if (userRole === ADMIN_ROLE.CASHIER) {
      // Cashier must use their own locationId
      finalLocationId = userLocationId;
      if (!finalLocationId) {
        throw new ValidationError(
          "Location ID is required for cashier accounts",
          "locationId"
        );
      }
    } else {
      // Admin/Owner: Prefer manually provided locationId, fallback to user's locationId
      finalLocationId =
        requestLocationId !== undefined ? requestLocationId : userLocationId;
    }

    // Validate locationId format if provided
    if (finalLocationId !== null && finalLocationId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(finalLocationId)) {
        throw new CastError("Invalid location ID format", "locationId");
      }
    }

    // Create expense data object
    const expenseData = {
      category,
      amount,
      date,
      notes,
      adminId,
    };

    // Only include locationId if it's provided (not null/undefined)
    if (finalLocationId !== null && finalLocationId !== undefined) {
      expenseData.locationId = finalLocationId;
    }

    // Create expense
    const expense = await this.repository.create(expenseData);

    // Return DTO
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

    // Update expense with populate (matches legacy exactly - no existence check before, direct update)
    const expense = await this.repository.findByIdAndUpdate(
      id,
      { category, amount, date, notes, adminId },
      { new: true, runValidators: true },
      {
        locationId: "type locationName locationCode locationAddress",
        adminId: "name role",
      }
    );

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

    // Delete expense with populate (matches legacy exactly)
    const expense = await this.repository.findByIdAndDelete(id, {
      locationId: "type locationName locationCode locationAddress",
      adminId: "name role",
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
