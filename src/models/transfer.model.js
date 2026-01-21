import mongoose from "mongoose";

// Transfer Line Item Schema
const transferLineItemSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: [true, "Product is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Transfer quantity is required"],
      min: [0, "Transfer quantity cannot be negative"],
    },
    // Optional reference to GRN line item if source is GRN
    grnLineItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoodsRecievedNote.lineItems",
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: null,
    },
  },
  {
    _id: true,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Main Transfer Schema
const transferSchema = new mongoose.Schema(
  {
    transferNumber: {
      type: String,
      required: [true, "Transfer number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    sourceType: {
      type: String,
      enum: {
        values: ["GRN", "Warehouse"],
        message: "Source type must be GRN or Warehouse",
      },
      required: [true, "Source type is required"],
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Source ID is required"],
      // Dynamic reference based on sourceType
      // If sourceType is "GRN", this references GoodsRecievedNote
      // If sourceType is "Warehouse", this references LocationProfile (type: "warehouse")
    },
    destinationWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LocationProfile",
      default: null,
      // Required when sourceType is "GRN" (GRN → Warehouse transfer)
      // Optional when sourceType is "Warehouse" (Warehouse → Storefront transfer)
    },
    destinationStorefrontId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LocationProfile",
      default: null,
      // Required when sourceType is "Warehouse" (Warehouse → Storefront transfer)
      // Optional when sourceType is "GRN" (GRN → Warehouse transfer)
    },
    lineItems: {
      type: [transferLineItemSchema],
      required: [true, "Line items are required"],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: "At least one line item is required",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "in-transit", "completed", "cancelled"],
        message: "Status must be pending, in-transit, completed, or cancelled",
      },
      default: "pending",
    },
    transferDate: {
      type: Date,
      required: [true, "Transfer date is required"],
      default: Date.now,
    },
    receivedDate: {
      type: Date,
      default: null,
      // Set when status changes to "completed"
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Transferred by is required"],
    },
  },
  {
    timestamps: true,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save validation: Ensure correct destination based on sourceType
transferSchema.pre("save", async function () {
  if (this.sourceType === "GRN") {
    if (!this.destinationWarehouseId) {
      throw new Error(
        "destinationWarehouseId is required when sourceType is 'GRN' (GRN → Warehouse transfer)"
      );
    }
  } else if (this.sourceType === "Warehouse") {
    if (!this.destinationStorefrontId) {
      throw new Error(
        "destinationStorefrontId is required when sourceType is 'Warehouse' (Warehouse → Storefront transfer)"
      );
    }
  }
});

// Indexes for better query performance
// Note: transferNumber already has an index from unique: true
transferSchema.index({ sourceType: 1, sourceId: 1 });
transferSchema.index({ destinationWarehouseId: 1 });
transferSchema.index({ destinationStorefrontId: 1 });
transferSchema.index({ status: 1 });
transferSchema.index({ transferDate: 1 });
transferSchema.index({ isDeleted: 1 });
transferSchema.index({ status: 1, isDeleted: 1 }); // Compound index
transferSchema.index({ sourceType: 1, sourceId: 1, status: 1 }); // Compound index for GRN/Warehouse queries
transferSchema.index({ sourceType: 1, destinationStorefrontId: 1 }); // For Warehouse → Storefront queries
transferSchema.index({ transferredBy: 1 }); // Index for admin who created the transfer

// Virtual for total transfer quantity
transferSchema.virtual("totalQuantity").get(function () {
  return this.lineItems.reduce((sum, item) => sum + item.quantity, 0);
});

const Transfer = mongoose.model("Transfer", transferSchema);

export default Transfer;
