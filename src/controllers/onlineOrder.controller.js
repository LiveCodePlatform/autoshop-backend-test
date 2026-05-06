import mongoose from "mongoose";
import OnlineOrder from "../models/onlineOrder.model.js";
import OnlineStorefrontInventory from "../models/onlineStorefrontInventory.model.js";
import OnlineStorefront from "../models/onlineStorefront.model.js";
import Inventory from "../models/inventory.model.js";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import { createStockAuditLog } from "../services/stockAuditLog.service.js";

// Create new online order
export const createOnlineOrder = asyncErrorHandler(async (req, res, next) => {
  const {
    customerName,
    customerPhone,
    customerAddress,
    ordersProducts,
    subTotal,
    tax = 0,
    discount = 0,
    finalAmount,
    paymentMethod = "cash_on_delivery",
    notes,
  } = req.body;

  // Validate required fields
  if (!customerName || !customerPhone || !customerAddress) {
    return next(
      new CustomError(
        400,
        "Customer details (name, phone, address) are required",
      ),
    );
  }

  if (
    !ordersProducts ||
    !Array.isArray(ordersProducts) ||
    ordersProducts.length === 0
  ) {
    return next(new CustomError(400, "Order must have at least one product"));
  }

  // Start MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get the online storefront ID (singleton)
    const onlineStorefront = await OnlineStorefront.getOrCreateDefault();
    const onlineStorefrontId = onlineStorefront._id;

    // 2. Validate all products and check stock availability
    const validatedProducts = [];
    const inventoryIds = ordersProducts.map((p) => p.inventoryId);
    const inventoryItems = await Inventory.find({
      _id: { $in: inventoryIds },
    }).session(session);

    if (inventoryItems.length !== inventoryIds.length) {
      throw new CustomError(404, "One or more products not found in inventory");
    }

    const inventoryMap = new Map(
      inventoryItems.map((item) => [item._id.toString(), item]),
    );

    for (const product of ordersProducts) {
      const inventoryItem = inventoryMap.get(product.inventoryId);

      // Check stock in OnlineStorefrontInventory
      const stockRecord = await OnlineStorefrontInventory.findOne({
        inventoryId: product.inventoryId,
        onlineStorefrontId,
      }).session(session);

      if (!stockRecord || stockRecord.quantity < product.quantity) {
        throw new CustomError(
          400,
          `Insufficient stock for product: ${inventoryItem.productName}. Available: ${stockRecord?.quantity || 0}`,
        );
      }

      validatedProducts.push({
        inventoryId: product.inventoryId,
        quantity: product.quantity,
        unitPrice: inventoryItem.sellingPrice,
      });

      // Deduct stock
      stockRecord.quantity -= product.quantity;
      stockRecord.lastUpdated = new Date();
      await stockRecord.save({ session });

      // Audit Log for online sale
      await createStockAuditLog({
        inventoryId: product.inventoryId,
        adminId: req.user?._id || onlineStorefrontId, // Use system ID if public checkout
        locationId: onlineStorefrontId,
        locationType: "onlineStorefront",
        stockRecordId: stockRecord._id,
        beforeQuantity: stockRecord.quantity + product.quantity,
        afterQuantity: stockRecord.quantity,
        quantityChange: -product.quantity,
        action: "remove",
        reason: `Online Order Checkout - ${customerName}`,
        session,
      });
    }

    // 3. Generate Order Number
    const orderNumber = await OnlineOrder.generateOrderNumber();

    // 4. Create Online Order
    const orderData = {
      orderNumber,
      onlineStorefrontId,
      customerName,
      customerPhone,
      customerAddress,
      ordersProducts: validatedProducts,
      subTotal,
      tax,
      discount,
      finalAmount,
      paymentMethod,
      notes,
      orderStatus: "pending",
    };

    const [newOrder] = await OnlineOrder.create([orderData], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Online order placed successfully",
      data: newOrder,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(
      error instanceof CustomError
        ? error
        : new CustomError(500, error.message),
    );
  }
});

// Get all online orders
export const getAllOnlineOrders = asyncErrorHandler(async (req, res, next) => {
  const { status, search } = req.query;
  const filter = { isDeleted: false };

  if (status) filter.orderStatus = status;
  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
      { customerPhone: { $regex: search, $options: "i" } },
    ];
  }

  const orders = await OnlineOrder.find(filter)
    .populate(
      "ordersProducts.inventoryId",
      "productName productCode SKU images",
    )
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// Get online order by ID
export const getOnlineOrderById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid order ID format"));
  }

  const order = await OnlineOrder.findOne({ _id: id, isDeleted: false })
    .populate(
      "ordersProducts.inventoryId",
      "productName productCode SKU images",
    )
    .populate("onlineStorefrontId", "name contactEmail contactPhone");

  if (!order) {
    return next(new CustomError(404, "Online order not found"));
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

// Update online order status
export const updateOnlineOrderStatus = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return next(new CustomError(400, "Invalid status"));
    }

    const order = await OnlineOrder.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { orderStatus: status },
      { new: true, runValidators: true },
    );

    if (!order) {
      return next(new CustomError(404, "Online order not found"));
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  },
);

// Add items to existing online order
export const addOnlineOrderItems = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { items, subTotal, tax, discount, finalAmount } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid order ID format"));
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(
      new CustomError(400, "Items array is required and must not be empty"),
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await OnlineOrder.findOne({
      _id: id,
      isDeleted: false,
    }).session(session);
    if (!order) {
      throw new CustomError(404, "Online order not found");
    }

    // Only allow editing for pending or confirmed orders
    if (!["pending", "confirmed"].includes(order.orderStatus)) {
      throw new CustomError(
        400,
        `Cannot add items to order with status: ${order.orderStatus}`,
      );
    }

    const onlineStorefrontId = order.onlineStorefrontId;
    const inventoryIds = items.map((item) => item.inventoryId);
    const inventoryItems = await Inventory.find({
      _id: { $in: inventoryIds },
    }).session(session);

    if (inventoryItems.length !== inventoryIds.length) {
      throw new CustomError(404, "One or more products not found in inventory");
    }

    const inventoryMap = new Map(
      inventoryItems.map((item) => [item._id.toString(), item]),
    );

    for (const item of items) {
      const inventoryItem = inventoryMap.get(item.inventoryId);
      const stockRecord = await OnlineStorefrontInventory.findOne({
        inventoryId: item.inventoryId,
        onlineStorefrontId,
      }).session(session);

      if (!stockRecord || stockRecord.quantity < item.quantity) {
        throw new CustomError(
          400,
          `Insufficient stock for product: ${inventoryItem.productName}. Available: ${
            stockRecord?.quantity || 0
          }`,
        );
      }

      // Check if item already exists in order
      const existingItemIndex = order.ordersProducts.findIndex(
        (op) => op.inventoryId.toString() === item.inventoryId,
      );

      if (existingItemIndex !== -1) {
        order.ordersProducts[existingItemIndex].quantity += item.quantity;
      } else {
        order.ordersProducts.push({
          inventoryId: item.inventoryId,
          quantity: item.quantity,
          unitPrice: inventoryItem.sellingPrice,
        });
      }

      // Deduct stock
      stockRecord.quantity -= item.quantity;
      stockRecord.lastUpdated = new Date();
      await stockRecord.save({ session });

      // Audit Log
      await createStockAuditLog({
        inventoryId: item.inventoryId,
        adminId: req.user._id,
        locationId: onlineStorefrontId,
        locationType: "onlineStorefront",
        stockRecordId: stockRecord._id,
        beforeQuantity: stockRecord.quantity + item.quantity,
        afterQuantity: stockRecord.quantity,
        quantityChange: -item.quantity,
        action: "remove",
        reason: `Added to Online Order ${order.orderNumber} (Edit)`,
        session,
      });
    }

    // Update totals
    if (subTotal !== undefined) order.subTotal = subTotal;
    if (tax !== undefined) order.tax = tax;
    if (discount !== undefined) order.discount = discount;
    if (finalAmount !== undefined) order.finalAmount = finalAmount;

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    await order.populate(
      "ordersProducts.inventoryId",
      "productName productCode SKU images",
    );

    res.status(200).json({
      success: true,
      message: "Items added to online order successfully",
      data: order,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(
      error instanceof CustomError
        ? error
        : new CustomError(500, error.message),
    );
  }
});

// Remove items from existing online order
export const removeOnlineOrderItems = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const { items, subTotal, tax, discount, finalAmount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid order ID format"));
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(
        new CustomError(400, "Items array is required and must not be empty"),
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await OnlineOrder.findOne({
        _id: id,
        isDeleted: false,
      }).session(session);
      if (!order) {
        throw new CustomError(404, "Online order not found");
      }

      // Only allow editing for pending or confirmed orders
      if (!["pending", "confirmed"].includes(order.orderStatus)) {
        throw new CustomError(
          400,
          `Cannot remove items from order with status: ${order.orderStatus}`,
        );
      }

      const onlineStorefrontId = order.onlineStorefrontId;

      for (const item of items) {
        const existingItemIndex = order.ordersProducts.findIndex(
          (op) => op.inventoryId.toString() === item.inventoryId,
        );

        if (existingItemIndex === -1) {
          throw new CustomError(
            404,
            `Item with inventoryId ${item.inventoryId} not found in order`,
          );
        }

        const orderItem = order.ordersProducts[existingItemIndex];
        if (orderItem.quantity < item.quantity) {
          throw new CustomError(
            400,
            `Cannot remove ${item.quantity} items. Only ${orderItem.quantity} exist in order.`,
          );
        }

        // Update order product quantity
        orderItem.quantity -= item.quantity;
        if (orderItem.quantity === 0) {
          order.ordersProducts.splice(existingItemIndex, 1);
        }

        // Restore stock
        const stockRecord = await OnlineStorefrontInventory.findOne({
          inventoryId: item.inventoryId,
          onlineStorefrontId,
        }).session(session);

        if (stockRecord) {
          stockRecord.quantity += item.quantity;
          stockRecord.lastUpdated = new Date();
          await stockRecord.save({ session });

          // Audit Log
          await createStockAuditLog({
            inventoryId: item.inventoryId,
            adminId: req.user._id,
            locationId: onlineStorefrontId,
            locationType: "onlineStorefront",
            stockRecordId: stockRecord._id,
            beforeQuantity: stockRecord.quantity - item.quantity,
            afterQuantity: stockRecord.quantity,
            quantityChange: item.quantity,
            action: "add",
            reason: `Removed from Online Order ${order.orderNumber} (Edit)`,
            session,
          });
        }
      }

      // Update totals
      if (subTotal !== undefined) order.subTotal = subTotal;
      if (tax !== undefined) order.tax = tax;
      if (discount !== undefined) order.discount = discount;
      if (finalAmount !== undefined) order.finalAmount = finalAmount;

      await order.save({ session });
      await session.commitTransaction();
      session.endSession();

      await order.populate(
        "ordersProducts.inventoryId",
        "productName productCode SKU images",
      );

      res.status(200).json({
        success: true,
        message: "Items removed from online order successfully",
        data: order,
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return next(
        error instanceof CustomError
          ? error
          : new CustomError(500, error.message),
      );
    }
  },
);
