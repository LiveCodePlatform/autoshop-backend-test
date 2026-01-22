import mongoose from "mongoose";
import {
  LOCATION_TYPE,
  STOCK_AUDIT_ACTION,
  RELATED_TRANSACTION_TYPE,
  STOCK_AUDIT_LOG_DEFAULTS,
  getValidLocationTypes,
  getValidActions,
  getValidRelatedTransactionTypesWithNull,
} from "../types/stockAuditLog.types.js";
// Import constraints from validators to ensure consistency
import { VALIDATION_CONSTRAINTS } from "../validators/stockAuditLog.validator.js";
import { mongooseSchemaOptions } from "../shared/utils/mongooseTransform.utils.js";
const Schema = mongoose.Schema;

const stockLogSchema = new Schema(
  {
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
      required: [true, "Please provide the inventory ID for the log"],
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Please provide the admin ID for the log"],
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "LocationProfile",
      required: [true, "Please provide the location ID for the log"],
    },
    locationType: {
      type: String,
      enum: {
        values: getValidLocationTypes(), // ✅ Uses types for enum values
        message: "Location type must be warehouse or storefront",
      },
      required: [true, "Please provide the location type for the log"],
    },
    // Reference to the actual stock record (WarehouseInventory or StorefrontInventory)
    stockRecordId: {
      type: Schema.Types.ObjectId,
      required: [true, "Please provide the stock record ID for the log"],
      // Note: This can reference either WarehouseInventory or StorefrontInventory
      // We use a generic reference since we can't use ref with conditional models
    },
    // Stock quantity tracking fields
    beforeQuantity: {
      type: Number,
      required: [true, "Please provide the stock quantity before the change"],
      min: [
        VALIDATION_CONSTRAINTS.QUANTITY.MIN,
        "Stock quantity cannot be negative",
      ],
    },
    afterQuantity: {
      type: Number,
      required: [true, "Please provide the stock quantity after the change"],
      min: [
        VALIDATION_CONSTRAINTS.QUANTITY.MIN,
        "Stock quantity cannot be negative",
      ],
    },
    quantityChange: {
      type: Number,
      required: [true, "Please provide the quantity change"],
      // Positive for additions, negative for removals
    },
    action: {
      type: String,
      enum: {
        values: getValidActions(), // ✅ Uses types for enum values
        message: "Action must be one of: add, remove, adjust, create",
      },
      required: [true, "Please provide the action for the log"],
    },
    // Optional reason/notes for the stock change (useful for audit trail)
    reason: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION_CONSTRAINTS.REASON.MAX_LENGTH,
        `Reason cannot exceed ${VALIDATION_CONSTRAINTS.REASON.MAX_LENGTH} characters`,
      ],
      default: STOCK_AUDIT_LOG_DEFAULTS.REASON, // ✅ Uses types for default
    },
    // Reference to related transaction if applicable (e.g., GRN ID, Order ID)
    // Note: Transfers have their own audit trail in transfer.model.js, so not tracked here
    relatedTransactionId: {
      type: Schema.Types.ObjectId,
      default: STOCK_AUDIT_LOG_DEFAULTS.RELATED_TRANSACTION_ID, // ✅ Uses types for default
      // Can reference GRN, Order, Purchase, Expense, etc.
    },
    relatedTransactionType: {
      type: String,
      enum: {
        values: getValidRelatedTransactionTypesWithNull(), // ✅ Uses types for enum values
        message:
          "Related transaction type must be one of: grn, order, purchase, expense",
      },
      default: STOCK_AUDIT_LOG_DEFAULTS.RELATED_TRANSACTION_TYPE, // ✅ Uses types for default
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    id: false,
    ...mongooseSchemaOptions,
  }
);

// Indexes for better query performance
stockLogSchema.index({ inventoryId: 1, locationId: 1 }); // Query by product and location
stockLogSchema.index({ locationId: 1, locationType: 1 }); // Query by location
stockLogSchema.index({ adminId: 1 }); // Query by admin who made the change
stockLogSchema.index({ action: 1 }); // Query by action type
stockLogSchema.index({ createdAt: -1 }); // Query by date (most recent first)
stockLogSchema.index({ stockRecordId: 1 }); // Query by stock record
stockLogSchema.index({ relatedTransactionId: 1, relatedTransactionType: 1 }); // Query by related transaction
stockLogSchema.index({ inventoryId: 1, createdAt: -1 }); // Product history
stockLogSchema.index({ locationId: 1, createdAt: -1 }); // Location history

// Compound index for common queries
stockLogSchema.index({ locationId: 1, locationType: 1, createdAt: -1 });

// Virtual to calculate if this was an increase or decrease
stockLogSchema.virtual("isIncrease").get(function () {
  return this.quantityChange > 0;
});

stockLogSchema.virtual("isDecrease").get(function () {
  return this.quantityChange < 0;
});

const StockAuditLog = mongoose.model("StockAuditLog", stockLogSchema);
export default StockAuditLog;
