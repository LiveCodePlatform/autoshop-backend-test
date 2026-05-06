import mongoose from "mongoose";
import OnlineStorefront from "../models/onlineStorefront.model.js";
import OnlineStorefrontInventory from "../models/onlineStorefrontInventory.model.js";
import WarehouseStock from "../models/warehouse.model.js";
import Inventory from "../models/inventory.model.js";
import LocationProfile from "../models/locationProfile.model.js";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import {
  createStockAuditLog,
  determineActionType,
} from "../services/stockAuditLog.service.js";

// GET the singleton online storefront
export const getOnlineStorefront = asyncErrorHandler(async (req, res, next) => {
  const storefront = await OnlineStorefront.findOne({
    singletonKey: "default",
    isDeleted: false,
  });

  if (!storefront) {
    return next(new CustomError(404, "Online storefront not found"));
  }

  res.status(200).json({
    success: true,
    message: "Online storefront retrieved successfully",
    data: storefront,
  });
});

// UPDATE the singleton online storefront
export const updateOnlineStorefront = asyncErrorHandler(async (req, res, next) => {
  const { name, description, status, contactEmail, contactPhone } = req.body;

  const storefront = await OnlineStorefront.findOne({
    singletonKey: "default",
    isDeleted: false,
  });

  if (!storefront) {
    return next(new CustomError(404, "Online storefront not found"));
  }

  if (name !== undefined) storefront.name = name.trim();
  if (description !== undefined) storefront.description = description.trim();
  if (status !== undefined) storefront.status = status;
  if (contactEmail !== undefined) storefront.contactEmail = contactEmail.trim().toLowerCase();
  if (contactPhone !== undefined) storefront.contactPhone = contactPhone.trim();

  const updated = await storefront.save();

  res.status(200).json({
    success: true,
    message: "Online storefront updated successfully",
    data: updated,
  });
});

// GET all online storefront inventory with filtering, pagination, sorting
export const getAllOnlineStorefrontInventory = asyncErrorHandler(
  async (req, res, next) => {
    const {
      page,
      limit,
      inventoryId,
      isLowStock,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const storefront = await OnlineStorefront.findOne({
      singletonKey: "default",
      isDeleted: false,
    });
    if (!storefront) {
      return next(new CustomError(404, "Online storefront not found"));
    }

    const query = { onlineStorefrontId: storefront._id };

    if (inventoryId) {
      if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
        return next(new CustomError(400, "Invalid inventory ID format"));
      }
      query.inventoryId = inventoryId;
    }

    if (isLowStock !== undefined) {
      query.isLowStock = isLowStock === "true";
    }

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    let queryChain = OnlineStorefrontInventory.find(query)
      .populate(
        "inventoryId",
        "productName productCode SKU category sellingPrice barcode buyingPrice"
      )
      .sort(sort);

    const usePagination = page !== undefined || limit !== undefined;
    let paginationInfo = null;

    if (usePagination) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      queryChain = queryChain.skip(skip).limit(limitNum);

      const total = await OnlineStorefrontInventory.countDocuments(query);
      paginationInfo = {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      };
    }

    const stock = await queryChain;

    const response = {
      success: true,
      message: "Online storefront inventory retrieved successfully",
      data: stock,
    };

    if (paginationInfo) {
      response.pagination = paginationInfo;
    }

    res.status(200).json(response);
  }
);

// GET online storefront inventory by ID
export const getOnlineStorefrontInventoryById = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid online storefront inventory ID format"));
    }

    const stock = await OnlineStorefrontInventory.findById(id)
      .populate(
        "inventoryId",
        "productName productCode SKU category buyingPrice sellingPrice barcode"
      )
      .populate("onlineStorefrontId", "name status");

    if (!stock) {
      return next(new CustomError(404, "Online storefront inventory not found"));
    }

    res.status(200).json({
      success: true,
      message: "Online storefront inventory retrieved successfully",
      data: stock,
    });
  }
);

// TRANSFER stock from warehouse to online storefront
export const transferToOnlineStorefront = asyncErrorHandler(async (req, res, next) => {
  const { sourceWarehouseId, lineItems, notes } = req.body;
  const transferredBy = req.user?._id;

  if (!transferredBy) {
    return next(new CustomError(401, "Authentication required."));
  }

  if (!mongoose.Types.ObjectId.isValid(sourceWarehouseId)) {
    return next(new CustomError(400, "Invalid source warehouse ID format"));
  }

  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return next(new CustomError(400, "lineItems must be a non-empty array"));
  }

  // Validate source warehouse
  const sourceWarehouse = await LocationProfile.findOne({
    _id: sourceWarehouseId,
    type: "warehouse",
  });
  if (!sourceWarehouse) {
    return next(new CustomError(404, "Source warehouse not found"));
  }
  if (sourceWarehouse.isDeleted) {
    return next(new CustomError(400, "Cannot transfer from deleted warehouse"));
  }

  // Get singleton online storefront
  const onlineStorefront = await OnlineStorefront.findOne({
    singletonKey: "default",
    isDeleted: false,
  });
  if (!onlineStorefront) {
    return next(new CustomError(404, "Online storefront not found"));
  }

  // Validate line items
  const validatedLineItems = [];
  for (const item of lineItems) {
    if (!item.productCode) {
      return next(new CustomError(400, "Each line item must have productCode"));
    }
    if (typeof item.quantity !== "number" || item.quantity <= 0) {
      return next(new CustomError(400, "Transfer quantity must be a positive number"));
    }

    const inventory = await Inventory.findOne({
      productCode: item.productCode.toUpperCase(),
    });
    if (!inventory) {
      return next(new CustomError(404, `Product with code '${item.productCode}' not found`));
    }

    // Check warehouse stock
    const warehouseStock = await WarehouseStock.findOne({
      inventoryId: inventory._id,
      warehouseId: sourceWarehouseId,
    });
    if (!warehouseStock || warehouseStock.quantity < item.quantity) {
      return next(
        new CustomError(
          400,
          `Insufficient stock in warehouse for product '${item.productCode}'. Available: ${warehouseStock?.quantity || 0}, Requested: ${item.quantity}`
        )
      );
    }

    validatedLineItems.push({
      inventoryId: inventory._id,
      productCode: item.productCode.toUpperCase(),
      quantity: item.quantity,
      notes: item.notes || null,
    });
  }

  // Ensure online storefront inventory records exist
  for (const item of validatedLineItems) {
    const existing = await OnlineStorefrontInventory.findOne({
      inventoryId: item.inventoryId,
      onlineStorefrontId: onlineStorefront._id,
    });
    if (!existing) {
      await OnlineStorefrontInventory.create({
        inventoryId: item.inventoryId,
        onlineStorefrontId: onlineStorefront._id,
        quantity: 0,
      });
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transferResults = [];

    for (const item of validatedLineItems) {
      // Decrement warehouse stock
      const warehouseStock = await WarehouseStock.findOneAndUpdate(
        { inventoryId: item.inventoryId, warehouseId: sourceWarehouseId },
        { $inc: { quantity: -item.quantity }, $set: { lastUpdated: new Date() } },
        { new: true, session }
      );

      // Increment online storefront stock
      const onlineStock = await OnlineStorefrontInventory.findOneAndUpdate(
        { inventoryId: item.inventoryId, onlineStorefrontId: onlineStorefront._id },
        { $inc: { quantity: item.quantity }, $set: { lastUpdated: new Date() } },
        { new: true, session }
      );

      // Audit log for warehouse (remove)
      await createStockAuditLog({
        inventoryId: item.inventoryId,
        adminId: transferredBy,
        locationId: sourceWarehouseId,
        locationType: "warehouse",
        stockRecordId: warehouseStock._id,
        beforeQuantity: warehouseStock.quantity + item.quantity,
        afterQuantity: warehouseStock.quantity,
        quantityChange: -item.quantity,
        action: "remove",
        reason: notes || `Transfer to online storefront`,
        session,
      });

      // Audit log for online storefront (add)
      await createStockAuditLog({
        inventoryId: item.inventoryId,
        adminId: transferredBy,
        locationId: onlineStorefront._id,
        locationType: "onlineStorefront",
        stockRecordId: onlineStock._id,
        beforeQuantity: onlineStock.quantity - item.quantity,
        afterQuantity: onlineStock.quantity,
        quantityChange: item.quantity,
        action: "add",
        reason: notes || `Transfer from warehouse ${sourceWarehouse.locationCode}`,
        session,
      });

      transferResults.push({
        inventoryId: item.inventoryId,
        productCode: item.productCode,
        quantity: item.quantity,
        warehouseRemaining: warehouseStock.quantity,
        onlineRemaining: onlineStock.quantity,
      });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Stock transferred to online storefront successfully",
      data: {
        sourceWarehouseId,
        onlineStorefrontId: onlineStorefront._id,
        transferredItems: transferResults,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(new CustomError(500, `Transfer failed: ${error.message}`));
  }
});

// UPDATE online storefront inventory quantity (add/remove)
export const updateOnlineStorefrontQuantity = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const { quantityChange, reason } = req.body;
    const adminId = req.user?._id;

    if (!adminId) {
      return next(new CustomError(401, "Authentication required."));
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid online storefront inventory ID format"));
    }

    if (
      typeof quantityChange !== "number" ||
      quantityChange === 0 ||
      !Number.isFinite(quantityChange)
    ) {
      return next(
        new CustomError(
          400,
          "A valid non-zero numeric 'quantityChange' is required. Use positive number to add, negative number to subtract."
        )
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const stockToUpdate = await OnlineStorefrontInventory.findById(id)
        .populate("inventoryId", "productName productCode SKU")
        .populate("onlineStorefrontId", "name status")
        .session(session);

      if (!stockToUpdate) {
        await session.abortTransaction();
        session.endSession();
        return next(new CustomError(404, "Online storefront inventory not found"));
      }

      const beforeQuantity = stockToUpdate.quantity || 0;
      const afterQuantity = beforeQuantity + quantityChange;

      if (afterQuantity < 0) {
        await session.abortTransaction();
        session.endSession();
        return next(
          new CustomError(
            400,
            `Cannot update quantity. Current: ${beforeQuantity}, change: ${quantityChange}, result: ${afterQuantity} (negative).`
          )
        );
      }

      const updatedStock = await OnlineStorefrontInventory.findByIdAndUpdate(
        id,
        {
          $inc: { quantity: quantityChange },
          $set: { lastUpdated: new Date() },
        },
        { new: true, runValidators: true, session }
      )
        .populate("inventoryId", "productName productCode SKU category barcode")
        .populate("onlineStorefrontId", "name status");

      const action = determineActionType(quantityChange, false);
      await createStockAuditLog({
        inventoryId: stockToUpdate.inventoryId._id,
        adminId,
        locationId: stockToUpdate.onlineStorefrontId._id,
        locationType: "onlineStorefront",
        stockRecordId: id,
        beforeQuantity,
        afterQuantity,
        quantityChange,
        action,
        reason: reason || null,
        session,
      });

      await session.commitTransaction();
      session.endSession();

      const actionMessage =
        quantityChange > 0
          ? `increased by ${Math.abs(quantityChange)}`
          : `decreased by ${Math.abs(quantityChange)}`;

      res.status(200).json({
        success: true,
        message: `Online storefront inventory quantity ${actionMessage}. New quantity: ${updatedStock.quantity}`,
        data: updatedStock,
        operation: {
          type: quantityChange > 0 ? "add" : "remove",
          previousQuantity: beforeQuantity,
          newQuantity: updatedStock.quantity,
          quantityChange,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return next(new CustomError(500, `Failed to update quantity: ${error.message}`));
    }
  }
);

// ADD products to online storefront inventory (initial assignment, quantity 0)
export const addProductsToOnlineStorefront = asyncErrorHandler(async (req, res, next) => {
  const { inventoryIds } = req.body;

  if (!Array.isArray(inventoryIds) || inventoryIds.length === 0) {
    return next(new CustomError(400, "inventoryIds must be a non-empty array"));
  }

  const invalidIds = inventoryIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    return next(new CustomError(400, `Invalid inventory ID format(s): ${invalidIds.join(", ")}`));
  }

  const onlineStorefront = await OnlineStorefront.findOne({
    singletonKey: "default",
    isDeleted: false,
  });
  if (!onlineStorefront) {
    return next(new CustomError(404, "Online storefront not found"));
  }

  const inventories = await Inventory.find({ _id: { $in: inventoryIds } });
  const foundIds = inventories.map((inv) => inv._id.toString());
  const missingIds = inventoryIds.filter((id) => !foundIds.includes(id.toString()));
  if (missingIds.length > 0) {
    return next(new CustomError(404, `Inventory not found for ID(s): ${missingIds.join(", ")}`));
  }

  const existingRecords = await OnlineStorefrontInventory.find({
    inventoryId: { $in: inventoryIds },
    onlineStorefrontId: onlineStorefront._id,
  });

  const existingInventoryIds = existingRecords.map((r) => r.inventoryId.toString());
  const newInventoryIds = inventoryIds.filter((id) => !existingInventoryIds.includes(id.toString()));

  const createdRecords = [];
  for (const inventoryId of newInventoryIds) {
    const record = await OnlineStorefrontInventory.create({
      inventoryId,
      onlineStorefrontId: onlineStorefront._id,
      quantity: 0,
    });
    await record.populate("inventoryId", "productName productCode SKU");
    createdRecords.push(record);
  }

  res.status(201).json({
    success: true,
    message: `Processed ${inventoryIds.length} product(s)`,
    data: {
      created: createdRecords,
      alreadyExists: existingRecords,
      summary: {
        total: inventoryIds.length,
        created: createdRecords.length,
        alreadyExists: existingRecords.length,
      },
    },
  });
});
