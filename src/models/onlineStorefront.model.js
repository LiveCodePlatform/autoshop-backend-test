import mongoose from "mongoose";
import validator from "validator";

const onlineStorefrontSchema = new mongoose.Schema(
  {
    // Singleton key — only one online storefront can ever exist
    singletonKey: {
      type: String,
      default: "default",
      unique: true,
      immutable: true,
    },
    name: {
      type: String,
      required: [true, "Online storefront name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
      default: "Online Storefront",
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "Default online storefront",
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Status must be active or inactive",
      },
      default: "active",
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [200, "Email cannot exceed 200 characters"],
      validate: {
        validator: function (value) {
          if (!value) return true;
          return validator.isEmail(value);
        },
        message: "Invalid email format",
      },
    },
    contactPhone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone cannot exceed 20 characters"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Static method to get or create the singleton online storefront
onlineStorefrontSchema.statics.getOrCreateDefault = async function () {
  let storefront = await this.findOne({ singletonKey: "default", isDeleted: false });

  if (!storefront) {
    storefront = await this.create({
      singletonKey: "default",
      name: "Online Storefront",
      description: "Default online storefront",
      status: "active",
    });
  }

  return storefront;
};

// Static method to get the singleton ID (used by inventory model)
onlineStorefrontSchema.statics.getSingletonId = async function () {
  const storefront = await this.getOrCreateDefault();
  return storefront._id;
};

const OnlineStorefront = mongoose.model("OnlineStorefront", onlineStorefrontSchema);
export default OnlineStorefront;
