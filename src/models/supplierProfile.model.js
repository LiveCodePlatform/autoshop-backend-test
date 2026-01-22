import mongoose from "mongoose";
import { SUPPLIER_PROFILE_DEFAULTS } from "../types/supplierProfile.types.js";
// Import constraints from validators to ensure consistency
import { VALIDATION_CONSTRAINTS } from "../validators/supplierProfile.validator.js";
import { mongooseSchemaOptions } from "../shared/utils/mongooseTransform.utils.js";

const supplierProfileSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
      minlength: [
        VALIDATION_CONSTRAINTS.SUPPLIER_NAME.MIN_LENGTH,
        `Supplier name must be at least ${VALIDATION_CONSTRAINTS.SUPPLIER_NAME.MIN_LENGTH} character`,
      ],
      maxlength: [
        VALIDATION_CONSTRAINTS.SUPPLIER_NAME.MAX_LENGTH,
        `Supplier name cannot exceed ${VALIDATION_CONSTRAINTS.SUPPLIER_NAME.MAX_LENGTH} characters`,
      ],
    },
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
      minlength: [
        VALIDATION_CONSTRAINTS.CONTACT_NUMBER.MIN_LENGTH,
        `Contact number must be at least ${VALIDATION_CONSTRAINTS.CONTACT_NUMBER.MIN_LENGTH} character`,
      ],
      maxlength: [
        VALIDATION_CONSTRAINTS.CONTACT_NUMBER.MAX_LENGTH,
        `Contact number cannot exceed ${VALIDATION_CONSTRAINTS.CONTACT_NUMBER.MAX_LENGTH} characters`,
      ],
    },
    isDeleted: {
      type: Boolean,
      default: SUPPLIER_PROFILE_DEFAULTS.IS_DELETED, // ✅ Uses types for default
    },
    deletedAt: {
      type: Date,
      default: SUPPLIER_PROFILE_DEFAULTS.DELETED_AT, // ✅ Uses types for default
    },
  },
  {
    timestamps: true,
    id: false,
    ...mongooseSchemaOptions,
  }
);

const SupplierProfile = mongoose.model(
  "SupplierProfile",
  supplierProfileSchema
);

export default SupplierProfile;
