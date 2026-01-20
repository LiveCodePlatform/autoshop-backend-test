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
   * @param {Object} data - Request data
   * @param {Object} user - Authenticated user object (contains _id and locationId)
   * @returns {Promise<ExpenseResponseDTO>} Created expense DTO
   * @throws {CastError} If invalid locationId or adminId format
   */
  async createExpense(data, user) {
    // Get locationId and adminId from authenticated user
    const locationId = user.locationId;
    const adminId = user._id;

    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      throw new CastError("Invalid location ID format", "locationId");
    }
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw new CastError("Invalid admin ID format", "adminId");
    }

    // Add locationId and adminId to data
    const expenseData = {
      ...data,
      [EXPENSE_FIELDS.LOCATION_ID]: locationId,
      [EXPENSE_FIELDS.ADMIN_ID]: adminId,
    };

    // Transform data using DTO
    const dto = new CreateExpenseDTO(expenseData);
    const modelData = dto.toModel();

    // Create expense
    const newExpense = await this.repository.create(modelData);

    // Fetch with populated fields for response
    const populatedExpense = await this.repository.findById(newExpense._id, {
      locationId: "type locationName locationCode locationAddress",
      adminId: "name role",
    });

    // Return DTO
    return new ExpenseResponseDTO(populatedExpense);
  }

  /**
   * Get all expenses with pagination and filters
   * @param {Object} queryParams - Query parameters (page, limit, startDate, endDate, sortBy, sortOrder)
   * @returns {Promise<ExpenseListResponseDTO>} List of expense DTOs with pagination
   */
  async getExpenses(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      sortBy = "date",
      sortOrder = "desc",
    } = queryParams;

    // Build query filter
    const query = {};

    // Add date range filter using dateFilter utility
    // Filter by the 'date' field (expense date) rather than createdAt
    try {
      const dateFilter = createDateFilter(
        { startDate, endDate },
        "date",
        false
      );
      Object.assign(query, dateFilter);
    } catch (error) {
      // If it's a CustomError, convert to ValidationError
      if (error instanceof CustomError) {
        throw new ValidationError(error.message);
      }
      // For other errors, wrap and throw
      throw new ValidationError(error.message || "Invalid date filter");
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Populate options
    const populate = {
      locationId: "type locationName locationCode locationAddress",
      adminId: "name role",
    };

    // Execute query
    const expenses = await this.repository.find(query, {
      sort,
      skip,
      limit: limitNum,
      populate,
    });

    // Get total count for pagination
    const total = await this.repository.countDocuments(query);

    // Return list DTO with pagination (DTO expects raw models, transforms internally)
    return new ExpenseListResponseDTO(expenses, {
      page: pageNum,
      limit: limitNum,
      total,
    });
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
   * @param {string} id - Expense ID
   * @param {Object} data - Update data
   * @param {Object} user - Authenticated user object (contains _id)
   * @returns {Promise<ExpenseResponseDTO>} Updated expense DTO
   * @throws {CastError} If invalid ID format or invalid adminId format
   * @throws {NotFoundError} If expense not found
   */
  async updateExpense(id, data, user) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid expense ID format", "id");
    }

    // Get adminId from authenticated user
    const adminId = user._id;
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw new CastError("Invalid admin ID format", "adminId");
    }

    // Check if expense exists
    const existingExpense = await this.repository.findById(id);
    if (!existingExpense) {
      throw new NotFoundError("Expense", id);
    }

    // Transform data using DTO
    const dto = new UpdateExpenseDTO(data);
    const updateData = dto.toUpdateModel();

    // Add adminId to update data (to track who updated it)
    updateData[EXPENSE_FIELDS.ADMIN_ID] = adminId;

    // Update expense
    const updatedExpense = await this.repository.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      throw new NotFoundError("Expense", id);
    }

    // Fetch with populated fields for response
    const populatedExpense = await this.repository.findById(updatedExpense._id, {
      locationId: "type locationName locationCode locationAddress",
      adminId: "name role",
    });

    // Return DTO
    return new ExpenseResponseDTO(populatedExpense);
  }

  /**
   * Delete expense
   * @param {string} id - Expense ID
   * @returns {Promise<ExpenseResponseDTO>} Deleted expense DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If expense not found
   */
  async deleteExpense(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid expense ID format", "id");
    }

    // Find expense with populated fields before deletion
    const expense = await this.repository.findById(id, {
      locationId: "type locationName locationCode locationAddress",
      adminId: "name role",
    });

    if (!expense) {
      throw new NotFoundError("Expense", id);
    }

    // Delete expense
    await this.repository.findByIdAndDelete(id);

    // Return DTO of deleted expense
    return new ExpenseResponseDTO(expense);
  }
}

export default ExpenseService;
