import mongoose from "mongoose";
import { generateSequentialNumber } from "../shared/utils/generateSequentialNumber.utils.js";
import {
  PURCHASING_STATUS,
  PRODUCT_STATUS,
  PURCHASING_DEFAULTS,
  PRODUCT_DEFAULTS,
} from "../types/purchasing.types.js";
// Import constraints from validators to ensure consistency
import { VALIDATION_CONSTRAINTS } from "../validators/purchasing.validator.js";
import { mongooseSchemaOptions } from "../shared/utils/mongooseTransform.utils.js";

const productSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    productStatus: {
      type: String,
      enum: {
        values: Object.values(PRODUCT_STATUS), // ✅ Uses types for enum values
        message: `Product status must be ${PRODUCT_STATUS.PENDING} or ${PRODUCT_STATUS.SEPERATED}`,
      },
      default: PRODUCT_DEFAULTS.PRODUCT_STATUS, // ✅ Uses types for default
    },
    productName: {
      type: String,
      required: true,
    },
    buyingPrice: {
      type: Number,
      required: true,
    },
    purchaseQuantity: {
      type: Number,
      required: true,
      // Original order quantity - never modified, preserved for record keeping
    },
    receivedQuantity: {
      type: Number,
      default: PRODUCT_DEFAULTS.RECEIVED_QUANTITY, // ✅ Uses types for default
      min: [
        VALIDATION_CONSTRAINTS.RECEIVED_QUANTITY.MIN,
        "Received quantity cannot be negative",
      ],
      // Tracks total received quantity from all GRNs
      // remainingQuantity = purchaseQuantity - receivedQuantity
    },
    productCode: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: PRODUCT_DEFAULTS.IS_DELETED, // ✅ Uses types for default
    },
    deletedAt: {
      type: Date,
      default: PRODUCT_DEFAULTS.DELETED_AT, // ✅ Uses types for default
    },
  },
  {
    timestamps: true,
    id: false,
    ...mongooseSchemaOptions,
  }
);

// Virtual for remaining quantity (purchaseQuantity - receivedQuantity)
productSchema.virtual("remainingQuantity").get(function () {
  const purchaseQty = this.purchaseQuantity || 0;
  const receivedQty = this.receivedQuantity || 0;
  return Math.max(0, purchaseQty - receivedQty);
});

const PurchasingSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: [true, "PO number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupplierProfile",
      required: true,
    },
    products: [productSchema],
    status: {
      type: String,
      enum: {
        values: Object.values(PURCHASING_STATUS), // ✅ Uses types for enum values
        message: "Invalid purchasing status",
      },
      default: PURCHASING_DEFAULTS.STATUS, // ✅ Uses types for default
    },
    note: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION_CONSTRAINTS.NOTE.MAX_LENGTH,
        `Note cannot exceed ${VALIDATION_CONSTRAINTS.NOTE.MAX_LENGTH} characters`,
      ],
      default: PURCHASING_DEFAULTS.NOTE, // ✅ Uses types for default
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [
        VALIDATION_CONSTRAINTS.TOTAL_AMOUNT.MIN,
        "Total amount cannot be negative",
      ],
    },
    purchasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Purchased by is required"],
    },
    isDeleted: {
      type: Boolean,
      default: PURCHASING_DEFAULTS.IS_DELETED, // ✅ Uses types for default
    },
    deletedAt: {
      type: Date,
      default: PURCHASING_DEFAULTS.DELETED_AT, // ✅ Uses types for default
    },
  },
  {
    timestamps: true,
    id: false,
    ...mongooseSchemaOptions,
  }
);

// Static method to generate PO number
// Format: PO-YYYY-MM-DD-NNNNNN (e.g., PO-2024-01-14-000001)
PurchasingSchema.statics.generatePONumber = async function () {
  return generateSequentialNumber({
    queryFn: async (query, options) => {
      return await this.findOne(query).sort(options.sort).select("poNumber");
    },
    prefix: "PO",
    fieldName: "poNumber",
    sequencePadding: 6,
    dateFormat: "daily",
    additionalFilters: {},
  });
};

// Indexes for better query performance
// Note: poNumber already has an index from unique: true, so we don't need to index it again
PurchasingSchema.index({ status: 1 });
PurchasingSchema.index({ supplierId: 1 });
PurchasingSchema.index({ createdAt: -1 });
PurchasingSchema.index({ isDeleted: 1 });
PurchasingSchema.index({ status: 1, isDeleted: 1 }); // Compound index for common queries

const Purchasing = mongoose.model("Purchasing", PurchasingSchema);

export default Purchasing;
