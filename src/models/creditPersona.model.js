import mongoose from "mongoose";
import { CREDIT_PERSONA_DEFAULTS } from "../types/creditPersona.types.js";
// Import constraints from validators to ensure consistency
import { VALIDATION_CONSTRAINTS } from "../validators/creditPersona.validator.js";
import { mongooseSchemaOptions } from "../shared/utils/mongooseTransform.utils.js";

const creditPersonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [
        VALIDATION_CONSTRAINTS.NAME.MIN_LENGTH,
        `Name must be at least ${VALIDATION_CONSTRAINTS.NAME.MIN_LENGTH} character`,
      ],
      maxlength: [
        VALIDATION_CONSTRAINTS.NAME.MAX_LENGTH,
        `Name cannot exceed ${VALIDATION_CONSTRAINTS.NAME.MAX_LENGTH} characters`,
      ],
    },
    phone: {
      type: String,
      trim: true,
      minlength: [
        VALIDATION_CONSTRAINTS.PHONE.MIN_LENGTH,
        `Phone must be at least ${VALIDATION_CONSTRAINTS.PHONE.MIN_LENGTH} character`,
      ],
      maxlength: [
        VALIDATION_CONSTRAINTS.PHONE.MAX_LENGTH,
        `Phone cannot exceed ${VALIDATION_CONSTRAINTS.PHONE.MAX_LENGTH} characters`,
      ],
    },
    blacklist: {
      type: Boolean,
      default: CREDIT_PERSONA_DEFAULTS.BLACKLIST, // ✅ Uses types for default
    },
    blacklistReason: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION_CONSTRAINTS.BLACKLIST_REASON.MAX_LENGTH,
        `Blacklist reason cannot exceed ${VALIDATION_CONSTRAINTS.BLACKLIST_REASON.MAX_LENGTH} characters`,
      ],
      default: CREDIT_PERSONA_DEFAULTS.BLACKLIST_REASON, // ✅ Uses types for default
    },
    blacklistDate: {
      type: Date,
      default: CREDIT_PERSONA_DEFAULTS.BLACKLIST_DATE, // ✅ Uses types for default
    },
  },
  {
    timestamps: true,
    id: false,
    ...mongooseSchemaOptions,
  }
);

const CreditPerson = mongoose.model("CreditPerson", creditPersonSchema);

export default CreditPerson;
