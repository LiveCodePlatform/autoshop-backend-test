import mongoose from "mongoose";
import {
  SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS,
} from "../types/socialMediaSaleInventory.types.js";
// Import constraints from validators to ensure consistency
import { VALIDATION_CONSTRAINTS } from "../validators/socialMediaSaleInventory.validator.js";

const socialMediaSaleInventorySchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: [true, "Inventory is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [
        VALIDATION_CONSTRAINTS.QUANTITY.MIN,
        "Quantity cannot be negative",
      ],
      default: SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS.QUANTITY,
    },
    sellingGuidePrompt: {
      type: String,
      required: false,
      default: SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS.SELLING_GUIDE_PROMPT,
      maxlength: [
        VALIDATION_CONSTRAINTS.SELLING_GUIDE_PROMPT.MAX_LENGTH,
        `Selling guide prompt cannot exceed ${VALIDATION_CONSTRAINTS.SELLING_GUIDE_PROMPT.MAX_LENGTH} characters`,
      ],
    },
    buyingGuidePrompt: {
      type: String,
      required: false,
      default: SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS.BUYING_GUIDE_PROMPT,
      maxlength: [
        VALIDATION_CONSTRAINTS.BUYING_GUIDE_PROMPT.MAX_LENGTH,
        `Buying guide prompt cannot exceed ${VALIDATION_CONSTRAINTS.BUYING_GUIDE_PROMPT.MAX_LENGTH} characters`,
      ],
    },
    isLowStock: {
      type: Boolean,
      default: SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS.IS_LOW_STOCK,
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

// Unique index: One stock record per inventory (also serves as regular index for queries)
socialMediaSaleInventorySchema.index({ inventoryId: 1 }, { unique: true });

// Indexes for better query performance
socialMediaSaleInventorySchema.index({ quantity: 1 });
socialMediaSaleInventorySchema.index({ isLowStock: 1 });

// Static method to find or create stock record
socialMediaSaleInventorySchema.statics.findOrCreateStock = async function (
  inventoryId
) {
  let stock = await this.findOne({ inventoryId });

  if (!stock) {
    stock = await this.create({
      inventoryId,
      quantity: 0,
    });
  }

  return stock;
};

// Instance method to add stock (for transfers/receiving)
socialMediaSaleInventorySchema.methods.addStock = function (amount) {
  if (amount < 0) {
    throw new Error("Amount must be positive");
  }
  this.quantity += amount;
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to remove stock (for sales/adjustments)
socialMediaSaleInventorySchema.methods.removeStock = function (amount) {
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

const SocialMediaSaleInventory = mongoose.model(
  "SocialMediaSaleInventory",
  socialMediaSaleInventorySchema
);

export default SocialMediaSaleInventory;
