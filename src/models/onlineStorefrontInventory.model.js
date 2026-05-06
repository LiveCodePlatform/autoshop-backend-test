import mongoose from "mongoose";

const onlineStorefrontInventorySchema = new mongoose.Schema(
  {
    onlineStorefrontId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OnlineStorefront",
      required: [true, "Online storefront is required"],
    },
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: [true, "Product is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    isLowStock: {
      type: Boolean,
      default: false,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index: One stock record per product per online storefront
onlineStorefrontInventorySchema.index(
  { inventoryId: 1, onlineStorefrontId: 1 },
  { unique: true }
);

// Indexes for better query performance
onlineStorefrontInventorySchema.index({ onlineStorefrontId: 1 });
onlineStorefrontInventorySchema.index({ inventoryId: 1 });
onlineStorefrontInventorySchema.index({ onlineStorefrontId: 1, isLowStock: 1 });
onlineStorefrontInventorySchema.index({ quantity: 1 });

// Virtual for available quantity
onlineStorefrontInventorySchema.virtual("availableQuantity").get(function () {
  return this.quantity;
});

// Static method to find or create stock record
onlineStorefrontInventorySchema.statics.findOrCreateStock = async function (
  inventoryId,
  onlineStorefrontId
) {
  let stock = await this.findOne({ inventoryId, onlineStorefrontId });

  if (!stock) {
    stock = await this.create({
      inventoryId,
      onlineStorefrontId,
      quantity: 0,
    });
  }

  return stock;
};

// Instance method to add stock (for transfers/receiving)
onlineStorefrontInventorySchema.methods.addStock = function (amount) {
  if (amount < 0) {
    throw new Error("Amount must be positive");
  }
  this.quantity += amount;
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to remove stock (for sales/adjustments)
onlineStorefrontInventorySchema.methods.removeStock = function (amount) {
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

const OnlineStorefrontInventory = mongoose.model(
  "OnlineStorefrontInventory",
  onlineStorefrontInventorySchema
);
export default OnlineStorefrontInventory;
