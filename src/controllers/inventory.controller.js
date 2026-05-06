import mongoose from "mongoose";
import Inventory from "../models/inventory.model.js";
import WarehouseStock from "../models/warehouse.model.js";
import StorefrontInventory from "../models/storefrontInventory.model.js";
import OnlineStorefrontInventory from "../models/onlineStorefrontInventory.model.js";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import {
  uploadImageToR2,
  deleteImageFromR2,
} from "../shared/utils/cloudflareR2.utils.js";

// Create new inventory item
export const createInventory = asyncErrorHandler(async (req, res, next) => {
  const inventoryData = { ...req.body };

  // Handle image uploads if files are provided
  if (req.files && req.files.length > 0) {
    const images = [];
    for (const file of req.files) {
      const { url, spaceKey } = await uploadImageToR2(file, "inventory");
      images.push({
        url,
        key: spaceKey,
        isPrimary: images.length === 0, // Set first image as primary
      });
    }
    inventoryData.images = images;
  }

  // Check if productCode already exists
  if (inventoryData.productCode) {
    const existingProduct = await Inventory.findOne({
      productCode: inventoryData.productCode.toUpperCase(),
    });
    if (existingProduct) {
      return next(new CustomError(400, "Product code already exists"));
    }
  }

  // Check if SKU already exists
  if (inventoryData.SKU) {
    const existingSKU = await Inventory.findOne({
      SKU: inventoryData.SKU.toUpperCase(),
    });
    if (existingSKU) {
      return next(new CustomError(400, "SKU already exists"));
    }
  }

  // Check if barcode already exists (if provided)
  if (inventoryData.barcode) {
    const existingBarcode = await Inventory.findOne({
      barcode: inventoryData.barcode,
    });
    if (existingBarcode) {
      return next(new CustomError(400, "Barcode already exists"));
    }
  }

  // Check if saleCode already exists (if provided)
  if (inventoryData.saleCode) {
    const existingSaleCode = await Inventory.findOne({
      saleCode: inventoryData.saleCode.toUpperCase(),
    });
    if (existingSaleCode) {
      return next(new CustomError(400, "Sale code already exists"));
    }
  }

  const newInventory = await Inventory.create(inventoryData);

  res.status(201).json({
    success: true,
    message: "Inventory item created successfully",
    data: newInventory,
  });
});

// Get all inventory items
export const getAllInventory = asyncErrorHandler(async (req, res, next) => {
  const {
    page,
    limit,
    category,
    status,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build query
  const query = {};

  if (category) {
    query.category = category;
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: "i" } },
      { productCode: { $regex: search, $options: "i" } },
      { SKU: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
    ];
  }

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  // Build query chain
  let queryChain = Inventory.find(query).sort(sort);

  // Apply pagination only if page or limit is provided
  const usePagination = page !== undefined || limit !== undefined;
  let paginationInfo = null;

  if (usePagination) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    queryChain = queryChain.skip(skip).limit(limitNum);

    // Get total count for pagination
    const total = await Inventory.countDocuments(query);

    paginationInfo = {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
    };
  }

  // Execute query
  const inventory = await queryChain;

  // Aggregate stock counts for each inventory item
  const inventoryWithStock = await Promise.all(
    inventory.map(async (item) => {
      const itemObj = item.toObject();

      // Get warehouse stock
      const warehouseStocks = await WarehouseStock.find({
        inventoryId: item._id,
      });
      itemObj.stockWarehouse = warehouseStocks.reduce(
        (sum, s) => sum + (s.quantity || 0),
        0,
      );

      // Get storefront stock
      const storefrontStocks = await StorefrontInventory.find({
        inventoryId: item._id,
      });
      itemObj.stockShop = storefrontStocks.reduce(
        (sum, s) => sum + (s.quantity || 0),
        0,
      );

      // Get online storefront stock
      const onlineStocks = await OnlineStorefrontInventory.find({
        inventoryId: item._id,
      });
      itemObj.stockOnline = onlineStocks.reduce(
        (sum, s) => sum + (s.quantity || 0),
        0,
      );

      return itemObj;
    }),
  );

  const response = {
    success: true,
    message: "Inventory items retrieved successfully",
    data: inventoryWithStock,
  };

  // Only include pagination info if pagination was applied
  if (paginationInfo) {
    response.pagination = paginationInfo;
  }

  res.status(200).json(response);
});

// Get inventory item by ID
export const getInventoryById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid inventory ID format"));
  }

  const inventory = await Inventory.findById(id);

  if (!inventory) {
    return next(new CustomError(404, "Inventory item not found"));
  }

  // Get stock availability for all warehouses
  const warehouseStocks = await WarehouseStock.find({
    inventoryId: id,
  })
    .populate(
      "warehouseId",
      "locationName locationCode locationAddress type status",
    )
    .select("warehouseId quantity lastUpdated");

  // Get stock availability for all storefronts
  const storefrontStocks = await StorefrontInventory.find({
    inventoryId: id,
  })
    .populate(
      "storefrontId",
      "locationName locationCode locationAddress type status",
    )
    .select("storefrontId quantity lastUpdated");

  // Get stock availability for online storefront
  const onlineStocks = await OnlineStorefrontInventory.find({
    inventoryId: id,
  })
    .populate("onlineStorefrontId", "name status")
    .select("onlineStorefrontId quantity lastUpdated");

  // Format warehouse stock data - filter out null warehouseId (deleted locations)
  const warehouseStockAvailability = warehouseStocks
    .filter(
      (stock) => stock.warehouseId !== null && stock.warehouseId !== undefined,
    )
    .map((stock) => ({
      locationId: stock.warehouseId._id,
      locationName: stock.warehouseId.locationName,
      locationCode: stock.warehouseId.locationCode,
      locationAddress: stock.warehouseId.locationAddress,
      locationType: stock.warehouseId.type,
      status: stock.warehouseId.status,
      quantity: stock.quantity,
      lastUpdated: stock.lastUpdated,
    }));

  // Format storefront stock data - filter out null storefrontId (deleted locations)
  const storefrontStockAvailability = storefrontStocks
    .filter(
      (stock) =>
        stock.storefrontId !== null && stock.storefrontId !== undefined,
    )
    .map((stock) => ({
      locationId: stock.storefrontId._id,
      locationName: stock.storefrontId.locationName,
      locationCode: stock.storefrontId.locationCode,
      locationAddress: stock.storefrontId.locationAddress,
      locationType: stock.storefrontId.type,
      status: stock.storefrontId.status,
      quantity: stock.quantity,
      lastUpdated: stock.lastUpdated,
    }));

  // Format online stock data
  const onlineStockAvailability = onlineStocks
    .filter((stock) => stock.onlineStorefrontId !== null)
    .map((stock) => ({
      locationId: stock.onlineStorefrontId._id,
      locationName: stock.onlineStorefrontId.name,
      status: stock.onlineStorefrontId.status,
      quantity: stock.quantity,
      lastUpdated: stock.lastUpdated,
    }));

  // Calculate total quantities - only count stocks with valid locations
  const totalWarehouseQuantity = warehouseStocks
    .filter(
      (stock) => stock.warehouseId !== null && stock.warehouseId !== undefined,
    )
    .reduce((sum, stock) => sum + (stock.quantity || 0), 0);
  const totalStorefrontQuantity = storefrontStocks
    .filter(
      (stock) =>
        stock.storefrontId !== null && stock.storefrontId !== undefined,
    )
    .reduce((sum, stock) => sum + (stock.quantity || 0), 0);
  const totalOnlineQuantity = onlineStocks.reduce(
    (sum, stock) => sum + (stock.quantity || 0),
    0,
  );
  const totalQuantity =
    totalWarehouseQuantity + totalStorefrontQuantity + totalOnlineQuantity;

  res.status(200).json({
    success: true,
    message: "Inventory item retrieved successfully",
    data: {
      ...inventory.toObject(),
      stockAvailability: {
        warehouses: {
          count: warehouseStockAvailability.length,
          locations: warehouseStockAvailability,
          totalQuantity: totalWarehouseQuantity,
        },
        storefronts: {
          count: storefrontStockAvailability.length,
          locations: storefrontStockAvailability,
          totalQuantity: totalStorefrontQuantity,
        },
        online: {
          count: onlineStockAvailability.length,
          locations: onlineStockAvailability,
          totalQuantity: totalOnlineQuantity,
        },
        totalQuantity: totalQuantity,
      },
    },
  });
});

// Update inventory metadata
export const updateInventory = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid inventory ID format"));
  }

  // Check if inventory exists
  const existingInventory = await Inventory.findById(id);
  if (!existingInventory) {
    return next(new CustomError(404, "Inventory item not found"));
  }

  // Handle image uploads if files are provided
  if (req.files && req.files.length > 0) {
    const images = [...(existingInventory.images || [])];
    for (const file of req.files) {
      const { url, spaceKey } = await uploadImageToR2(file, "inventory");
      images.push({
        url,
        key: spaceKey,
        isPrimary: images.length === 0,
      });
    }
    updateData.images = images;
  }

  // Check for uniqueness conflicts if unique fields are being updated
  // productCode is required and unique, so always check if provided
  if (updateData.productCode !== undefined) {
    const trimmedProductCode = String(updateData.productCode).trim();
    if (!trimmedProductCode) {
      return next(new CustomError(400, "Product code cannot be empty"));
    }
    const existingProduct = await Inventory.findOne({
      productCode: trimmedProductCode.toUpperCase(),
      _id: { $ne: id },
    });
    if (existingProduct) {
      return next(new CustomError(400, "Product code already exists"));
    }
  }

  // SKU is optional but unique when provided (sparse unique)
  if (updateData.SKU !== undefined) {
    const trimmedSKU = String(updateData.SKU).trim();
    // Allow empty string/null for sparse unique fields
    if (trimmedSKU) {
      const existingSKU = await Inventory.findOne({
        SKU: trimmedSKU.toUpperCase(),
        _id: { $ne: id },
      });
      if (existingSKU) {
        return next(new CustomError(400, "SKU already exists"));
      }
    }
  }

  // barcode is optional but unique when provided (sparse unique)
  if (updateData.barcode !== undefined) {
    const trimmedBarcode = String(updateData.barcode).trim();
    // Allow empty string/null for sparse unique fields
    if (trimmedBarcode) {
      const existingBarcode = await Inventory.findOne({
        barcode: trimmedBarcode,
        _id: { $ne: id },
      });
      if (existingBarcode) {
        return next(new CustomError(400, "Barcode already exists"));
      }
    }
  }

  // saleCode is optional but unique when provided (sparse unique)
  if (updateData.saleCode !== undefined) {
    const trimmedSaleCode = String(updateData.saleCode).trim();
    // Allow empty string/null for sparse unique fields
    if (trimmedSaleCode) {
      const existingSaleCode = await Inventory.findOne({
        saleCode: trimmedSaleCode.toUpperCase(),
        _id: { $ne: id },
      });
      if (existingSaleCode) {
        return next(new CustomError(400, "Sale code already exists"));
      }
    }
  }

  // Validate sellingPrice >= buyingPrice
  // Merge updateData with existing data to get the final values
  const finalBuyingPrice =
    updateData.buyingPrice !== undefined
      ? updateData.buyingPrice
      : existingInventory.buyingPrice;
  const finalSellingPrice =
    updateData.sellingPrice !== undefined
      ? updateData.sellingPrice
      : existingInventory.sellingPrice;

  if (finalSellingPrice < finalBuyingPrice) {
    return next(
      new CustomError(
        400,
        `Selling price (${finalSellingPrice}) should be greater than or equal to buying price (${finalBuyingPrice})`,
      ),
    );
  }

  // Apply updates to the existing document and save
  // This ensures validators have access to the complete merged document
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) {
      existingInventory[key] = updateData[key];
    }
  });

  // Save the updated inventory (this will run all validators with the complete document)
  const updatedInventory = await existingInventory.save();

  res.status(200).json({
    success: true,
    message: "Inventory item updated successfully",
    data: updatedInventory,
  });
});

// Delete a single image from an inventory item
export const deleteInventoryImage = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const { imageKey } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid inventory ID format"));
    }

    if (!imageKey || typeof imageKey !== "string") {
      return next(new CustomError(400, "imageKey is required"));
    }

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      return next(new CustomError(404, "Inventory item not found"));
    }

    const imageIndex = inventory.images.findIndex(
      (img) => img.key === imageKey,
    );
    if (imageIndex === -1) {
      return next(
        new CustomError(404, "Image not found on this inventory item"),
      );
    }

    const wasPrimary = inventory.images[imageIndex].isPrimary;

    // Remove image from the array
    inventory.images.splice(imageIndex, 1);

    // If deleted image was primary and there are remaining images, set first as primary
    if (wasPrimary && inventory.images.length > 0) {
      inventory.images[0].isPrimary = true;
    }

    await inventory.save();

    // Delete from Cloudflare R2 (non-blocking: don't fail API if storage delete fails)
    try {
      await deleteImageFromR2(imageKey);
    } catch (err) {
      console.error("Failed to delete image from R2:", err.message);
    }

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data: inventory,
    });
  },
);
