import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  ADMIN_ROLE,
  ADMIN_DEFAULTS,
  getValidRoles,
} from "../types/admin.types.js";
// Import constraints from validators to ensure consistency
import { VALIDATION_CONSTRAINTS } from "../validators/admin.validator.js";
import { mongooseSchemaOptions } from "../shared/utils/mongooseTransform.utils.js";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      unique: true,
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
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [
        VALIDATION_CONSTRAINTS.PASSWORD.MIN_LENGTH,
        `Password must be at least ${VALIDATION_CONSTRAINTS.PASSWORD.MIN_LENGTH} characters long`,
      ],
      maxlength: [
        VALIDATION_CONSTRAINTS.PASSWORD.MAX_LENGTH,
        `Password cannot exceed ${VALIDATION_CONSTRAINTS.PASSWORD.MAX_LENGTH} characters`,
      ],
      select: false,
    },
    confirmPassword: {
      type: String,
      validate: {
        validator: function (val) {
          return val == this.password;
        },
        message: "Password Doesn't Match.",
      },
    },
    role: {
      type: String,
      enum: {
        values: getValidRoles(), // ✅ Uses types for enum values
        message: `Role must be ${ADMIN_ROLE.OWNER} or ${ADMIN_ROLE.CASHIER}`,
      },
      default: ADMIN_DEFAULTS.ROLE, // ✅ Uses types for default
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LocationProfile",
      default: ADMIN_DEFAULTS.LOCATION_ID, // ✅ Uses types for default
    },
    lastActiveAt: {
      type: Date,
      default: ADMIN_DEFAULTS.LAST_ACTIVE_AT, // ✅ Uses types for default
    },

    softDeleted: {
      type: Boolean,
      default: ADMIN_DEFAULTS.SOFT_DELETED, // ✅ Uses types for default
    },
    deletedAt: {
      type: Date,
      default: ADMIN_DEFAULTS.DELETED_AT, // ✅ Uses types for default
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    ...mongooseSchemaOptions,
  }
);

adminSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
  }
});

adminSchema.methods.comparePasswordInDb = async (pswd, pswdDB) => {
  return await bcrypt.compare(pswd, pswdDB);
};

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
