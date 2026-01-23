import mongoose from "mongoose";
import { EXPENSE_DEFAULTS } from "../types/expense.types.js";
// Import constraints from validators to ensure consistency
import { VALIDATION_CONSTRAINTS } from "../validators/expense.validator.js";
import { mongooseSchemaOptions } from "../shared/utils/mongooseTransform.utils.js";

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      minlength: [
        VALIDATION_CONSTRAINTS.CATEGORY.MIN_LENGTH,
        `Category must be at least ${VALIDATION_CONSTRAINTS.CATEGORY.MIN_LENGTH} character`,
      ],
      maxlength: [
        VALIDATION_CONSTRAINTS.CATEGORY.MAX_LENGTH,
        `Category cannot exceed ${VALIDATION_CONSTRAINTS.CATEGORY.MAX_LENGTH} characters`,
      ],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [VALIDATION_CONSTRAINTS.AMOUNT.MIN, "Amount cannot be negative"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH,
        `Notes cannot exceed ${VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH} characters`,
      ],
      default: EXPENSE_DEFAULTS.NOTES, // ✅ Uses types for default
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LocationProfile",
      required: false, // Optional: owner and admin accounts may not have locationId
      default: null,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Admin is required"],
    },
  },
  {
    timestamps: true,
    id: false,
    ...mongooseSchemaOptions,
  }
);

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
