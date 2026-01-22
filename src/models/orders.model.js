import mongoose from "mongoose";
import { generateSequentialNumber } from "../shared/utils/generateSequentialNumber.utils.js";
import {
  ORDER_STATUS,
  ORDER_DEFAULTS,
  PAYMENT_TYPE,
  PAYMENT_METHOD,
  getValidOrderStatuses,
  getValidPaymentTypes,
  getValidPaymentMethods,
} from "../types/order.types.js";
// Import constraints from validators to ensure consistency
import { VALIDATION_CONSTRAINTS } from "../validators/order.validator.js";
import { mongooseSchemaOptions } from "../shared/utils/mongooseTransform.utils.js";

const orderProductsSchema = new mongoose.Schema({
  inventoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    required: [true, "Inventory ID is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [
      VALIDATION_CONSTRAINTS.QUANTITY.MIN,
      `Quantity must be at least ${VALIDATION_CONSTRAINTS.QUANTITY.MIN}`,
    ],
  },
  unitPrice: {
    type: Number,
    required: [true, "Unit price is required"],
    min: [
      VALIDATION_CONSTRAINTS.UNIT_PRICE.MIN,
      "Unit price cannot be negative",
    ],
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      sparse: true, // Allows null values during creation before orderNumber is assigned
      trim: true,
      uppercase: true,
    },
    storefrontId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LocationProfile",
      required: [true, "Storefront is required"],
    },
    ordersProducts: {
      type: [orderProductsSchema],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "Order must have at least one product",
      },
    },
    creditPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreditPerson",
      default: ORDER_DEFAULTS.CREDIT_PERSON_ID, // ✅ Uses types for default
    },
    subTotal: {
      type: Number,
      default: ORDER_DEFAULTS.SUB_TOTAL,
      min: [
        VALIDATION_CONSTRAINTS.SUB_TOTAL.MIN,
        "Subtotal cannot be negative",
      ],
    },
    tax: {
      type: Number,
      default: ORDER_DEFAULTS.TAX,
      min: [VALIDATION_CONSTRAINTS.TAX.MIN, "Tax cannot be negative"],
    },
    discount: {
      type: Number,
      default: ORDER_DEFAULTS.DISCOUNT,
      min: [VALIDATION_CONSTRAINTS.DISCOUNT.MIN, "Discount cannot be negative"],
    },
    finalAmount: {
      type: Number,
      required: [true, "Final amount is required"],
      min: [
        VALIDATION_CONSTRAINTS.FINAL_AMOUNT.MIN,
        "Final amount cannot be negative",
      ],
    },
    paidAmount: {
      type: Number,
      required: [true, "Paid amount is required"],
      min: [
        VALIDATION_CONSTRAINTS.PAID_AMOUNT.MIN,
        "Paid amount cannot be negative",
      ],
    },
    extraChange: {
      type: Number,
      default: ORDER_DEFAULTS.EXTRA_CHANGE,
      min: [
        VALIDATION_CONSTRAINTS.EXTRA_CHANGE.MIN,
        "Extra change cannot be negative",
      ],
    },
    orderStatus: {
      type: String,
      enum: {
        values: getValidOrderStatuses(), // ✅ Uses types for enum values
        message: "Order status must be pending, completed, or cancelled",
      },
      default: ORDER_DEFAULTS.ORDER_STATUS, // ✅ Uses types for default
    },
    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Sold by is required"],
    },
    isDeleted: {
      type: Boolean,
      default: ORDER_DEFAULTS.IS_DELETED, // ✅ Uses types for default
    },
    deletedAt: {
      type: Date,
      default: ORDER_DEFAULTS.DELETED_AT, // ✅ Uses types for default
    },
    paymentType: {
      type: String,
      enum: {
        values: getValidPaymentTypes(), // ✅ Uses types for enum values
        message: `Payment type must be ${PAYMENT_TYPE.CREDIT} or ${PAYMENT_TYPE.PAID}`,
      },
      default: ORDER_DEFAULTS.PAYMENT_TYPE, // ✅ Uses types for default
    },
    paymentMethod: {
      type: String,
      enum: {
        values: getValidPaymentMethods(), // ✅ Uses types for enum values
        message: "Invalid payment method",
      },
      default: ORDER_DEFAULTS.PAYMENT_METHOD, // ✅ Uses types for default
    },
  },
  {
    timestamps: true,
    id: false,
    ...mongooseSchemaOptions,
  }
);

// Pre-save middleware to calculate extraChange if paidAmount or finalAmount changed
orderSchema.pre("save", async function () {
  // Auto-calculate extraChange if paidAmount and finalAmount are both set
  // This ensures extraChange = paidAmount - finalAmount (when positive)
  if (
    this.paidAmount != null &&
    this.finalAmount != null &&
    (this.isModified("paidAmount") ||
      this.isModified("finalAmount") ||
      this.isNew)
  ) {
    this.extraChange = Math.max(0, this.paidAmount - this.finalAmount);
  }
});

// Virtual for total paid amount (initial + all credit records)
// Note: This requires CreditRecords to be populated or calculated separately
orderSchema.virtual("totalPaidAmount").get(async function () {
  // This virtual won't work with async in getter
  // Use instance method instead for async calculation
  return null;
});

// Instance method to calculate total paid amount (including CreditRecords)
// Note: order.paidAmount is now updated when credit payments are recorded,
// so this method returns order.paidAmount directly.
// This denormalizes the data for better query performance.
// DEPRECATED: This method has been moved to OrderService.calculateTotalPaidAmount()
// Kept here for backward compatibility with legacy code
orderSchema.methods.calculateTotalPaidAmount = async function (session = null) {
  // Since order.paidAmount is updated when credit payments are recorded,
  // it already includes the initial payment + all credit record payments
  return this.paidAmount || 0;
};

// Instance method to calculate remaining balance accurately
// DEPRECATED: This method has been moved to OrderService.calculateRemainingBalance()
// Kept here for backward compatibility with legacy code
orderSchema.methods.calculateRemainingBalance = async function () {
  const totalPaid = await this.calculateTotalPaidAmount();
  if (this.finalAmount == null) {
    return null;
  }
  return Math.max(0, this.finalAmount - totalPaid);
};

// Virtual for remaining balance (synchronous - only uses initial paidAmount)
// For accurate calculation with CreditRecords, use calculateRemainingBalance() method
orderSchema.virtual("remainingBalance").get(function () {
  if (this.finalAmount == null || this.paidAmount == null) {
    return null;
  }
  // Note: This only considers initial payment, not CreditRecords
  // Use calculateRemainingBalance() method for accurate calculation
  return Math.max(0, this.finalAmount - this.paidAmount);
});

// Static method to generate order number
// Format: ORD-YYYY-MM-DD-NNNNNN (e.g., ORD-2024-01-15-000001)
// This format supports up to 999,999 orders per day
// DEPRECATED: This method has been moved to OrderRepository.generateOrderNumber()
// Kept here for backward compatibility with legacy code
orderSchema.statics.generateOrderNumber = async function () {
  return generateSequentialNumber({
    queryFn: async (query, options) => {
      return await this.findOne(query).sort(options.sort).select("orderNumber");
    },
    prefix: "ORD",
    fieldName: "orderNumber",
    sequencePadding: 6,
    dateFormat: "daily",
    additionalFilters: { isDeleted: false },
    maxSequence: 999999,
    maxSequenceError:
      "Daily order limit reached. Maximum 999,999 orders per day allowed.",
  });
};

// Indexes for better query performance
orderSchema.index({ storefrontId: 1 });
orderSchema.index({ isDeleted: 1 });
orderSchema.index({ createdAt: -1 }); // For recent orders
// Note: orderNumber index is automatically created by unique: true in schema
orderSchema.index({ storefrontId: 1, isDeleted: 1 }); // Compound index for common queries
orderSchema.index({ orderStatus: 1 }); // For status filtering
orderSchema.index({ creditPersonId: 1 }); // For credit person queries
orderSchema.index({ paymentType: 1 }); // For filtering by payment type

// Performance indexes for orderNumber queries (used in generateOrderNumber)
orderSchema.index({ orderNumber: 1, isDeleted: 1 }); // For finding latest order by date prefix
orderSchema.index({ orderNumber: 1, createdAt: -1 }); // For sorting by orderNumber and date

const Order = mongoose.model("Order", orderSchema);

export default Order;
