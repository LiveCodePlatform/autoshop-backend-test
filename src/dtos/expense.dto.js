/**
 * Expense DTOs (Data Transfer Objects)
 * Transforms data between layers using types from types/expense.types.js
 */

import {
  EXPENSE_FIELDS,
  EXPENSE_DEFAULTS,
} from "../types/expense.types.js";

/**
 * Create Expense DTO
 * Transforms request data for creating expense
 */
export class CreateExpenseDTO {
  constructor(data) {
    this.category = data[EXPENSE_FIELDS.CATEGORY];
    this.amount = data[EXPENSE_FIELDS.AMOUNT];
    this.date = data[EXPENSE_FIELDS.DATE];
    this.notes = data[EXPENSE_FIELDS.NOTES] || EXPENSE_DEFAULTS.NOTES;
    this.locationId = data[EXPENSE_FIELDS.LOCATION_ID];
    this.adminId = data[EXPENSE_FIELDS.ADMIN_ID];
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      [EXPENSE_FIELDS.CATEGORY]: this.category,
      [EXPENSE_FIELDS.AMOUNT]: this.amount,
      [EXPENSE_FIELDS.DATE]: this.date,
      [EXPENSE_FIELDS.NOTES]: this.notes,
      [EXPENSE_FIELDS.LOCATION_ID]: this.locationId,
      [EXPENSE_FIELDS.ADMIN_ID]: this.adminId,
    };
  }

  /**
   * Get safe object (exclude sensitive data if any)
   * @returns {Object}
   */
  toSafeObject() {
    return this.toModel();
  }
}

/**
 * Update Expense DTO
 * Transforms request data for updating expense
 */
export class UpdateExpenseDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[EXPENSE_FIELDS.CATEGORY] !== undefined)
      this.category = data[EXPENSE_FIELDS.CATEGORY];
    if (data[EXPENSE_FIELDS.AMOUNT] !== undefined)
      this.amount = data[EXPENSE_FIELDS.AMOUNT];
    if (data[EXPENSE_FIELDS.DATE] !== undefined)
      this.date = data[EXPENSE_FIELDS.DATE];
    if (data[EXPENSE_FIELDS.NOTES] !== undefined)
      this.notes = data[EXPENSE_FIELDS.NOTES] || EXPENSE_DEFAULTS.NOTES;
    if (data[EXPENSE_FIELDS.LOCATION_ID] !== undefined)
      this.locationId = data[EXPENSE_FIELDS.LOCATION_ID];
    if (data[EXPENSE_FIELDS.ADMIN_ID] !== undefined)
      this.adminId = data[EXPENSE_FIELDS.ADMIN_ID];
  }

  /**
   * Convert to database update format
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.category !== undefined)
      updateData[EXPENSE_FIELDS.CATEGORY] = this.category;
    if (this.amount !== undefined)
      updateData[EXPENSE_FIELDS.AMOUNT] = this.amount;
    if (this.date !== undefined)
      updateData[EXPENSE_FIELDS.DATE] = this.date;
    if (this.notes !== undefined)
      updateData[EXPENSE_FIELDS.NOTES] = this.notes;
    if (this.locationId !== undefined)
      updateData[EXPENSE_FIELDS.LOCATION_ID] = this.locationId;
    if (this.adminId !== undefined)
      updateData[EXPENSE_FIELDS.ADMIN_ID] = this.adminId;

    return updateData;
  }
}

/**
 * Expense Response DTO
 * Transforms database model to API response format
 */
export class ExpenseResponseDTO {
  constructor(expenseModel) {
    this.id = expenseModel._id || expenseModel.id;
    this.category = expenseModel[EXPENSE_FIELDS.CATEGORY];
    this.amount = expenseModel[EXPENSE_FIELDS.AMOUNT];
    this.date = expenseModel[EXPENSE_FIELDS.DATE];
    this.notes =
      expenseModel[EXPENSE_FIELDS.NOTES] || EXPENSE_DEFAULTS.NOTES;
    this.locationId = expenseModel[EXPENSE_FIELDS.LOCATION_ID];
    this.adminId = expenseModel[EXPENSE_FIELDS.ADMIN_ID];
    this.createdAt = expenseModel[EXPENSE_FIELDS.CREATED_AT];
    this.updatedAt = expenseModel[EXPENSE_FIELDS.UPDATED_AT];
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      category: this.category,
      amount: this.amount,
      date: this.date,
      notes: this.notes,
      locationId: this.locationId,
      adminId: this.adminId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convert to public format (exclude sensitive data if any)
   * @returns {Object}
   */
  toPublicJSON() {
    return this.toJSON(); // All fields are public for expense
  }

  /**
   * Static method to convert array of expenses
   * @param {Array} expenses
   * @returns {Array}
   */
  static fromArray(expenses) {
    return expenses.map(
      (expense) => new ExpenseResponseDTO(expense).toJSON()
    );
  }
}

/**
 * Expense List Response DTO (with pagination)
 */
export class ExpenseListResponseDTO {
  constructor(expenses, pagination) {
    this.expenses = ExpenseResponseDTO.fromArray(expenses);
    this.pagination = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    };
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      success: true,
      data: this.expenses,
      pagination: this.pagination,
    };
  }
}

export default {
  CreateExpenseDTO,
  UpdateExpenseDTO,
  ExpenseResponseDTO,
  ExpenseListResponseDTO,
};
