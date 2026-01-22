import mongoose from "mongoose";
import validator from "validator";
import {
  LOCATION_TYPE,
  LOCATION_STATUS,
  LOCATION_PROFILE_DEFAULTS,
  getValidLocationTypes,
  getValidStatuses,
} from "../types/locationProfile.types.js";
// Import constraints from validators to ensure consistency
import { VALIDATION_CONSTRAINTS } from "../validators/locationProfile.common.js";
import { mongooseSchemaOptions } from "../shared/utils/mongooseTransform.utils.js";

const locationProfileSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: {
        values: getValidLocationTypes(), // ✅ Uses types for enum values
        message: `Type must be ${LOCATION_TYPE.WAREHOUSE} or ${LOCATION_TYPE.STOREFRONT}`,
      },
      required: [true, "Location type is required"],
    },
    locationCode: {
      type: String,
      required: [true, "Location code is required"],
      trim: true,
      uppercase: true,
      maxlength: [
        VALIDATION_CONSTRAINTS.LOCATION_CODE.MAX_LENGTH,
        `Location code cannot exceed ${VALIDATION_CONSTRAINTS.LOCATION_CODE.MAX_LENGTH} characters`,
      ],
    },
    locationName: {
      type: String,
      required: [true, "Location name is required"],
      trim: true,
      maxlength: [
        VALIDATION_CONSTRAINTS.LOCATION_NAME.MAX_LENGTH,
        `Location name cannot exceed ${VALIDATION_CONSTRAINTS.LOCATION_NAME.MAX_LENGTH} characters`,
      ],
    },
    locationAddress: {
      type: String,
      required: [true, "Location address is required"],
      trim: true,
      maxlength: [
        VALIDATION_CONSTRAINTS.LOCATION_ADDRESS.MAX_LENGTH,
        `Location address cannot exceed ${VALIDATION_CONSTRAINTS.LOCATION_ADDRESS.MAX_LENGTH} characters`,
      ],
    },
    locationPhone: {
      type: String,
      required: [true, "Location phone is required"],
      trim: true,
      maxlength: [
        VALIDATION_CONSTRAINTS.LOCATION_PHONE.MAX_LENGTH,
        `Location phone cannot exceed ${VALIDATION_CONSTRAINTS.LOCATION_PHONE.MAX_LENGTH} characters`,
      ],
      // Phone validation is handled at controller level using phoneValidation.utils.js
    },
    locationEmail: {
      type: String,
      default: LOCATION_PROFILE_DEFAULTS.LOCATION_EMAIL, // ✅ Uses types for default
      sparse: true,
      trim: true,
      lowercase: true,
      maxlength: [
        VALIDATION_CONSTRAINTS.LOCATION_EMAIL.MAX_LENGTH,
        `Location email cannot exceed ${VALIDATION_CONSTRAINTS.LOCATION_EMAIL.MAX_LENGTH} characters`,
      ],
      validate: {
        validator: function (value) {
          if (!value) return true; // Allow null/empty
          return validator.isEmail(value);
        },
        message: "Invalid email format",
      },
    },
    managerName: {
      type: String,
      default: LOCATION_PROFILE_DEFAULTS.MANAGER_NAME, // ✅ Uses types for default
      trim: true,
      maxlength: [
        VALIDATION_CONSTRAINTS.MANAGER_NAME.MAX_LENGTH,
        `Manager name cannot exceed ${VALIDATION_CONSTRAINTS.MANAGER_NAME.MAX_LENGTH} characters`,
      ],
    },
    status: {
      type: String,
      enum: {
        values: getValidStatuses(), // ✅ Uses types for enum values
        message: `Status must be ${LOCATION_STATUS.ACTIVE} or ${LOCATION_STATUS.INACTIVE}`,
      },
      default: LOCATION_STATUS.ACTIVE, // ✅ Uses types for default
    },
    description: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH,
        `Description cannot exceed ${VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH} characters`,
      ],
      default: LOCATION_PROFILE_DEFAULTS.DESCRIPTION, // ✅ Uses types for default
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH,
        `Notes cannot exceed ${VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH} characters`,
      ],
      default: LOCATION_PROFILE_DEFAULTS.NOTES, // ✅ Uses types for default
    },
    isDeleted: {
      type: Boolean,
      default: LOCATION_PROFILE_DEFAULTS.IS_DELETED, // ✅ Uses types for default
    },
    deletedAt: {
      type: Date,
      default: LOCATION_PROFILE_DEFAULTS.DELETED_AT, // ✅ Uses types for default
    },
  },
  {
    timestamps: true,
    id: false,
    ...mongooseSchemaOptions,
  }
);

// Compound unique indexes - locationCode and locationName must be unique per type
locationProfileSchema.index({ type: 1, locationCode: 1 }, { unique: true });
locationProfileSchema.index({ type: 1, locationName: 1 }, { unique: true });

// Indexes for better query performance
locationProfileSchema.index({ type: 1 });
locationProfileSchema.index({ status: 1 });
locationProfileSchema.index({ isDeleted: 1 }); // For soft delete queries
locationProfileSchema.index({ type: 1, status: 1, isDeleted: 1 }); // Compound index for active, non-deleted queries by type
locationProfileSchema.index({ type: 1, locationCode: 1, status: 1 }); // Compound index

const LocationProfile = mongoose.model(
  "LocationProfile",
  locationProfileSchema
);

export default LocationProfile;
