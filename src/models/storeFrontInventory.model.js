import mongoose from "mongoose";
import { STOREFRONT_INVENTORY_DEFAULTS } from "../types/storefrontInventory.types.js";
// Import constraints from validators to ensure consistency
import { VALIDATION_CONSTRAINTS } from "../validators/storefrontInventory.validator.js";
import { mongooseSchemaOptions } from "../shared/utils/mongooseTransform.utils.js";

const storefrontInventorySchema = new mongoose.Schema(
  {
    storefrontId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LocationProfile",
      required: [true, "Storefront is required"],
    },
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: [true, "Product is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [VALIDATION_CONSTRAINTS.QUANTITY.MIN, "Quantity cannot be negative"],
      default: STOREFRONT_INVENTORY_DEFAULTS.QUANTITY, // ✅ Uses types for default
    },
    // Low stock alert flag (calculated based on Inventory reorderPoint)
    isLowStock: {
      type: Boolean,
      default: STOREFRONT_INVENTORY_DEFAULTS.IS_LOW_STOCK, // ✅ Uses types for default
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    id: false,
    ...mongooseSchemaOptions,
  }
);

// Compound unique index: One stock record per product per storefront
storefrontInventorySchema.index(
  { inventoryId: 1, storefrontId: 1 },
  { unique: true }
);

// Indexes for better query performance
storefrontInventorySchema.index({ storefrontId: 1 });
storefrontInventorySchema.index({ inventoryId: 1 });
storefrontInventorySchema.index({ storefrontId: 1, isLowStock: 1 }); // For low stock queries per storefront
storefrontInventorySchema.index({ quantity: 1 }); // For sorting by quantity

// Virtual for available quantity (same as quantity since we don't track reservations here)
storefrontInventorySchema.virtual("availableQuantity").get(function () {
  return this.quantity;
});

// Static method to find or create stock record
storefrontInventorySchema.statics.findOrCreateStock = async function (
  inventoryId,
  storefrontId
) {
  let stock = await this.findOne({ inventoryId, storefrontId });

  if (!stock) {
    stock = await this.create({
      inventoryId,
      storefrontId,
      quantity: 0,
    });
  }

  return stock;
};

// Instance method to add stock (for transfers/receiving)
storefrontInventorySchema.methods.addStock = function (amount) {
  if (amount < 0) {
    throw new Error("Amount must be positive");
  }
  this.quantity += amount;
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to remove stock (for sales/adjustments)
storefrontInventorySchema.methods.removeStock = function (amount) {
  if (amount < 0) {
    throw new Error("Amount must be positive");
  }
  if (this.quantity < amount) {
    throw new Error("Insufficient stock");
  }
  this.quantity -= amount;
  this.lastUpdated = new Date();
  return this.save();
};

const StorefrontInventory = mongoose.model(
  "StorefrontInventory",
  storefrontInventorySchema
);
export default StorefrontInventory;
