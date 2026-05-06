import mongoose from "mongoose";

const orderProductsSchema = new mongoose.Schema({
  inventoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    required: [true, "Inventory ID is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  unitPrice: {
    type: Number,
    required: [true, "Unit price is required"],
    min: [0, "Unit price cannot be negative"],
  },
});

const onlineOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    onlineStorefrontId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OnlineStorefront",
      required: [true, "Online storefront is required"],
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, "Customer phone is required"],
      trim: true,
    },
    customerAddress: {
      type: String,
      required: [true, "Customer address is required"],
      trim: true,
    },
    ordersProducts: {
      type: [orderProductsSchema],
      default: [],
    },
    subTotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, "Tax cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    finalAmount: {
      type: Number,
      required: [true, "Final amount is required"],
      min: [0, "Final amount cannot be negative"],
    },
    orderStatus: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
        message: "Status must be pending, confirmed, shipped, delivered, or cancelled",
      },
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "partially_paid"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      default: "cash_on_delivery",
    },
    notes: {
      type: String,
      trim: true,
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

// Static method to generate order number
onlineOrderSchema.statics.generateOrderNumber = async function () {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const prefix = `ONL-${year}-${month}-${day}-`;

  const latestOrder = await this.findOne({
    orderNumber: new RegExp(
      `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`
    ),
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .select("orderNumber");

  let sequence = 1;
  if (latestOrder && latestOrder.orderNumber) {
    const parts = latestOrder.orderNumber.split("-");
    if (parts.length === 5) {
      const latestSequence = parseInt(parts[4], 10);
      if (!isNaN(latestSequence)) {
        sequence = latestSequence + 1;
      }
    }
  }

  if (sequence > 999999) {
    throw new Error(`Daily order limit reached.`);
  }

  return `${prefix}${sequence.toString().padStart(6, "0")}`;
};

// Indexes
onlineOrderSchema.index({ onlineStorefrontId: 1 });
onlineOrderSchema.index({ orderStatus: 1 });
onlineOrderSchema.index({ createdAt: -1 });
onlineOrderSchema.index({ customerPhone: 1 });
onlineOrderSchema.index({ orderNumber: 1 }, { unique: true });

const OnlineOrder = mongoose.model("OnlineOrder", onlineOrderSchema);

export default OnlineOrder;
