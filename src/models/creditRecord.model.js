import mongoose from "mongoose";
import {
  CREDIT_RECORD_DEFAULTS,
  PAYMENT_METHOD,
  getValidPaymentMethods,
} from "../types/creditRecord.types.js";
// Import constraints from validators to ensure consistency
import { VALIDATION_CONSTRAINTS } from "../validators/creditRecord.validator.js";

const creditRecordSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order ID is required"],
    },
    creditPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreditPerson",
      default: null, // Optional field - no default in types
    },
    paidAmount: {
      type: Number,
      required: [true, "Paid amount is required"],
      min: [
        VALIDATION_CONSTRAINTS.PAID_AMOUNT.MIN,
        "Paid amount cannot be negative",
      ],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      required: [true, "Payment date is required"],
    },
    paymentMethod: {
      type: String,
      enum: {
        values: getValidPaymentMethods(), // ✅ Uses types for enum values
        message: "Invalid payment method",
      },
      default: CREDIT_RECORD_DEFAULTS.PAYMENT_METHOD, // ✅ Uses types for default
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH,
        `Notes cannot exceed ${VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH} characters`,
      ],
      default: CREDIT_RECORD_DEFAULTS.NOTES, // ✅ Uses types for default
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Added by is required"],
    },
    isDeleted: {
      type: Boolean,
      default: CREDIT_RECORD_DEFAULTS.IS_DELETED, // ✅ Uses types for default
    },
    deletedAt: {
      type: Date,
      default: CREDIT_RECORD_DEFAULTS.DELETED_AT, // ✅ Uses types for default
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
creditRecordSchema.index({ orderId: 1 });
creditRecordSchema.index({ creditPersonId: 1 }); // For querying by credit person
creditRecordSchema.index({ orderId: 1, isDeleted: 1 }); // Compound index for active records
creditRecordSchema.index({ creditPersonId: 1, isDeleted: 1 }); // Compound index for credit person queries
creditRecordSchema.index({ paymentDate: -1 }); // For sorting by payment date

const CreditRecord = mongoose.model("CreditRecord", creditRecordSchema);

export default CreditRecord;
