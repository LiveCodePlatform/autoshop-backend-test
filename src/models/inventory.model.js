import mongoose from "mongoose";
import {
  INVENTORY_STATUS,
  INVENTORY_DEFAULTS,
  getValidStatuses,
  getValidUnitsOfMeasure,
} from "../types/inventory.types.js";
// Import constraints from validators to ensure consistency
import { VALIDATION_CONSTRAINTS } from "../validators/inventory.validator.js";
import { mongooseSchemaOptions } from "../shared/utils/mongooseTransform.utils.js";

const inventorySchema = new mongoose.Schema(
  {
    // Field names: String literals (readable and stable)
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [
        VALIDATION_CONSTRAINTS.PRODUCT_NAME.MAX_LENGTH,
        `Product name cannot exceed ${VALIDATION_CONSTRAINTS.PRODUCT_NAME.MAX_LENGTH} characters`,
      ],
    },
    productCode: {
      type: String,
      required: [true, "Product code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    saleCode: {
      type: String,
      unique: true,
      sparse: true, // Optional field - allows multiple nulls, enforces uniqueness when provided
      trim: true,
      uppercase: true,
    },
    SKU: {
      type: String,
      sparse: true, // Optional field - allows multiple nulls, enforces uniqueness when provided
      unique: true,
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values but enforces uniqueness for non-null
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      default: INVENTORY_DEFAULTS.CATEGORY,
    },
    subCategory: {
      type: String,
      trim: true,
      default: INVENTORY_DEFAULTS.SUB_CATEGORY,
    },
    brand: {
      type: String,
      trim: true,
      default: INVENTORY_DEFAULTS.BRAND,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH,
        `Description cannot exceed ${VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH} characters`,
      ],
      default: INVENTORY_DEFAULTS.DESCRIPTION,
    },
    buyingPrice: {
      type: Number,
      required: [true, "Buying price is required"],
      min: [
        VALIDATION_CONSTRAINTS.BUYING_PRICE.MIN,
        "Buying price cannot be negative",
      ],
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [
        VALIDATION_CONSTRAINTS.SELLING_PRICE.MIN,
        "Selling price cannot be negative",
      ],
      validate: {
        validator: function (value) {
          // Selling price should typically be >= buying price
          return value >= this.buyingPrice;
        },
        message:
          "Selling price should be greater than or equal to buying price",
      },
    },
    unitOfMeasure: {
      type: String,
      required: [true, "Unit of measure is required"],
      enum: {
        values: getValidUnitsOfMeasure(), // ✅ Uses types for enum values
        message: "Invalid unit of measure",
      },
      default: INVENTORY_DEFAULTS.UNIT_OF_MEASURE,
    },
    reorderPoint: {
      type: Number,
      min: [
        VALIDATION_CONSTRAINTS.REORDER_POINT.MIN,
        "Reorder point cannot be negative",
      ],
      default: INVENTORY_DEFAULTS.REORDER_POINT,
    },
    reorderQuantity: {
      type: Number,
      min: [
        VALIDATION_CONSTRAINTS.REORDER_QUANTITY.MIN,
        "Reorder quantity cannot be negative",
      ],
      default: INVENTORY_DEFAULTS.REORDER_QUANTITY,
    },
    taxRate: {
      type: Number,
      min: [VALIDATION_CONSTRAINTS.TAX_RATE.MIN, "Tax rate cannot be negative"],
      max: [VALIDATION_CONSTRAINTS.TAX_RATE.MAX, "Tax rate cannot exceed 100%"],
      default: INVENTORY_DEFAULTS.TAX_RATE,
    },
    status: {
      type: String,
      enum: {
        values: getValidStatuses(), // ✅ Uses types for enum values
        message: "Status must be active, inactive, or discontinued",
      },
      default: INVENTORY_STATUS.ACTIVE, // ✅ Uses types for default
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    // createdBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    // },
    // updatedBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    // },
  },
  {
    timestamps: true,
    ...mongooseSchemaOptions,
  }
);

// Indexes for better query performance
// Note: productCode, SKU, saleCode, and barcode already have indexes from unique: true
// Only add indexes for fields that don't have unique: true
// ✅ Readable field names (string literals)
inventorySchema.index({ category: 1, subCategory: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ productName: "text", description: "text" }); // Text search index

// Virtual for profit margin
// ✅ Readable property access (string literals)
inventorySchema.virtual("profitMargin").get(function () {
  if (this.buyingPrice === 0) return 0;
  return ((this.sellingPrice - this.buyingPrice) / this.buyingPrice) * 100;
});

// Virtual for profit amount
inventorySchema.virtual("profitAmount").get(function () {
  return this.sellingPrice - this.buyingPrice;
});

// Pre-save middleware to ensure only one primary image
// TODO: Uncomment when images field is added
// inventorySchema.pre("save", function (next) {
//   if (this.images && this.images.length > 0) {
//     const primaryImages = this.images.filter((img) => img.primary);
//     if (primaryImages.length > 1) {
//       // Keep only the first one as primary
//       this.images.forEach((img, index) => {
//         if (index > 0) img.primary = false;
//       });
//     }
//     if (primaryImages.length === 0) {
//       // Set first image as primary if none is set
//       this.images[0].primary = true;
//     }
//   }
//   next();
// });

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;
