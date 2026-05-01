/**
 * Inventory Service
 * Business logic layer for Inventory operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { InventoryRepository } from "../repositories/inventory.repository.js";
import { WarehouseInventoryRepository } from "../repositories/warehouseStock.repository.js";
import { StorefrontInventoryRepository } from "../repositories/storefrontInventory.repository.js";
import {
  CreateInventoryDTO,
  UpdateInventoryDTO,
  InventoryResponseDTO,
  InventoryListResponseDTO,
} from "../dtos/inventory.dto.js";
import {
  ValidationError,
  NotFoundError,
  CastError,
} from "../errors/errorTypes.js";
import { INVENTORY_FIELDS } from "../types/inventory.types.js";
import mongoose from "mongoose";

export class InventoryService {
  /**
   * @param {InventoryRepository} repository - Injected repository instance (optional, fallback creates new instance)
   * @param {WarehouseInventoryRepository} warehouseInventoryRepository - Injected warehouse inventory repository instance
   * @param {StorefrontInventoryRepository} storefrontInventoryRepository - Injected storefront inventory repository instance
   */
  constructor(
    repository,
    warehouseInventoryRepository,
    storefrontInventoryRepository,
  ) {
    this.repository = repository || new InventoryRepository();
    this.warehouseInventoryRepository =
      warehouseInventoryRepository || new WarehouseInventoryRepository();
    this.storefrontInventoryRepository =
      storefrontInventoryRepository || new StorefrontInventoryRepository();
  }

  /**
   * Create new inventory item
   * Matches legacy logic exactly
   * @param {Object} data - Request data
   * @returns {Promise<InventoryResponseDTO>} Created inventory DTO
   * @throws {ValidationError} If uniqueness check fails
   */
  async createInventory(data) {
    // Transform input data using DTO
    const dto = new CreateInventoryDTO(data);
    const inventoryData = dto.toModel();

    // Check if productCode already exists (matches legacy exactly)
    if (inventoryData[INVENTORY_FIELDS.PRODUCT_CODE]) {
      const existingProduct = await this.repository.findOne({
        [INVENTORY_FIELDS.PRODUCT_CODE]:
          inventoryData[INVENTORY_FIELDS.PRODUCT_CODE].toUpperCase(),
      });
      if (existingProduct) {
        throw new ValidationError(
          "Product code already exists",
          INVENTORY_FIELDS.PRODUCT_CODE,
        );
      }
    }

    // Check if SKU already exists (matches legacy exactly)
    if (inventoryData[INVENTORY_FIELDS.SKU]) {
      const existingSKU = await this.repository.findOne({
        [INVENTORY_FIELDS.SKU]:
          inventoryData[INVENTORY_FIELDS.SKU].toUpperCase(),
      });
      if (existingSKU) {
        throw new ValidationError("SKU already exists", INVENTORY_FIELDS.SKU);
      }
    }

    // Check if barcode already exists (if provided) (matches legacy exactly)
    if (inventoryData[INVENTORY_FIELDS.BARCODE]) {
      const existingBarcode = await this.repository.findOne({
        [INVENTORY_FIELDS.BARCODE]: inventoryData[INVENTORY_FIELDS.BARCODE],
      });
      if (existingBarcode) {
        throw new ValidationError(
          "Barcode already exists",
          INVENTORY_FIELDS.BARCODE,
        );
      }
    }

    // Check if saleCode already exists (if provided) (matches legacy exactly)
    if (inventoryData[INVENTORY_FIELDS.SALE_CODE]) {
      const existingSaleCode = await this.repository.findOne({
        [INVENTORY_FIELDS.SALE_CODE]:
          inventoryData[INVENTORY_FIELDS.SALE_CODE].toUpperCase(),
      });
      if (existingSaleCode) {
        throw new ValidationError(
          "Sale code already exists",
          INVENTORY_FIELDS.SALE_CODE,
        );
      }
    }

    // Create inventory
    const newInventory = await this.repository.create(inventoryData);

    // Return DTO
    return new InventoryResponseDTO(newInventory);
  }

  /**
   * Get all inventory items with pagination and filters
   * @param {Object} queryParams - Query parameters (page, limit, category, status, search, sortBy, sortOrder)
   * @returns {Promise<InventoryListResponseDTO>} List of inventory DTOs with pagination
   */
  async getAllInventory(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = queryParams;

    // Build query
    const query = {};

    if (category) {
      query[INVENTORY_FIELDS.CATEGORY] = category;
    }

    if (status) {
      query[INVENTORY_FIELDS.STATUS] = status;
    }

    if (search) {
      query.$or = [
        { [INVENTORY_FIELDS.PRODUCT_NAME]: { $regex: search, $options: "i" } },
        { [INVENTORY_FIELDS.PRODUCT_CODE]: { $regex: search, $options: "i" } },
        { [INVENTORY_FIELDS.SKU]: { $regex: search, $options: "i" } },
        { [INVENTORY_FIELDS.BARCODE]: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const inventories = await this.repository.find(query, {
      sort,
      skip,
      limit: limitNum,
    });

    // Get total count for pagination
    const total = await this.repository.countDocuments(query);

    // Return list DTO with pagination (DTO expects raw models, transforms internally)
    return new InventoryListResponseDTO(inventories, {
      page: pageNum,
      limit: limitNum,
      total,
    });
  }

  /**
   * Get inventory item by ID with stock availability
   * Matches legacy logic exactly
   * @param {string} id - Inventory ID
   * @returns {Promise<Object>} Inventory with stock availability data
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If inventory not found
   */
  async getInventoryById(id) {
    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid inventory ID format", "id");
    }

    // Find inventory (matches legacy exactly)
    const inventory = await this.repository.findById(id);

    if (!inventory) {
      throw new NotFoundError("Inventory item not found", id);
    }

    // Get stock availability for all warehouses (matches legacy exactly - uses repository)
    const warehouseStocks = await this.warehouseInventoryRepository.find(
      {
        inventoryId: id,
      },
      {
        populate: {
          path: "warehouseId",
          select: "locationName locationCode locationAddress type status",
        },
      },
    );
    // Select only needed fields (matching legacy behavior)
    const warehouseStocksFiltered = warehouseStocks.map((stock) => ({
      warehouseId: stock.warehouseId,
      quantity: stock.quantity,
      lastUpdated: stock.lastUpdated,
    }));

    // Get stock availability for all storefronts (matches legacy exactly - uses repository)
    const storefrontStocks = await this.storefrontInventoryRepository.find(
      {
        inventoryId: id,
      },
      {
        populate: {
          path: "storefrontId",
          select: "locationName locationCode locationAddress type status",
        },
      },
    );
    // Select only needed fields (matching legacy behavior)
    const storefrontStocksFiltered = storefrontStocks.map((stock) => ({
      storefrontId: stock.storefrontId,
      quantity: stock.quantity,
      lastUpdated: stock.lastUpdated,
    }));

    // Format warehouse stock data - filter out null warehouseId (deleted locations) (matches legacy exactly)
    const warehouseStockAvailability = warehouseStocks
      .filter(
        (stock) =>
          stock.warehouseId !== null && stock.warehouseId !== undefined,
      )
      .map((stock) => ({
        locationId: stock.warehouseId._id
          ? stock.warehouseId._id.toString()
          : stock.warehouseId.id,
        locationName: stock.warehouseId.locationName,
        locationCode: stock.warehouseId.locationCode,
        locationAddress: stock.warehouseId.locationAddress,
        locationType: stock.warehouseId.type,
        status: stock.warehouseId.status,
        quantity: stock.quantity,
        lastUpdated: stock.lastUpdated,
      }));

    // Format storefront stock data - filter out null storefrontId (deleted locations) (matches legacy exactly)
    const storefrontStockAvailability = storefrontStocksFiltered
      .filter(
        (stock) =>
          stock.storefrontId !== null && stock.storefrontId !== undefined,
      )
      .map((stock) => ({
        locationId: stock.storefrontId._id
          ? stock.storefrontId._id.toString()
          : stock.storefrontId.id,
        locationName: stock.storefrontId.locationName,
        locationCode: stock.storefrontId.locationCode,
        locationAddress: stock.storefrontId.locationAddress,
        locationType: stock.storefrontId.type,
        status: stock.storefrontId.status,
        quantity: stock.quantity,
        lastUpdated: stock.lastUpdated,
      }));

    // Calculate total quantities - only count stocks with valid locations (matches legacy exactly)
    const totalWarehouseQuantity = warehouseStocks
      .filter(
        (stock) =>
          stock.warehouseId !== null && stock.warehouseId !== undefined,
      )
      .reduce((sum, stock) => sum + (stock.quantity || 0), 0);
    const totalStorefrontQuantity = storefrontStocks
      .filter(
        (stock) =>
          stock.storefrontId !== null && stock.storefrontId !== undefined,
      )
      .reduce((sum, stock) => sum + (stock.quantity || 0), 0);
    const totalQuantity = totalWarehouseQuantity + totalStorefrontQuantity;

    // Return inventory with stock availability (matches legacy structure exactly)
    return {
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
        totalQuantity: totalQuantity,
      },
    };
  }

  /**
   * Update inventory item metadata
   * Matches legacy logic exactly
   * @param {string} id - Inventory ID
   * @param {Object} data - Update data
   * @returns {Promise<InventoryResponseDTO>} Updated inventory DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If inventory not found
   * @throws {ValidationError} If uniqueness check fails or validation fails
   */
  async updateInventory(id, data) {
    const updateData = data;

    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid inventory ID format", "id");
    }

    // Check if inventory exists (matches legacy exactly)
    const existingInventory = await this.repository.findById(id);
    if (!existingInventory) {
      throw new NotFoundError("Inventory item not found", id);
    }

    // Check for uniqueness conflicts if unique fields are being updated (matches legacy exactly)
    if (updateData[INVENTORY_FIELDS.PRODUCT_CODE]) {
      const existingProduct = await this.repository.findOne({
        [INVENTORY_FIELDS.PRODUCT_CODE]:
          updateData[INVENTORY_FIELDS.PRODUCT_CODE].toUpperCase(),
        _id: { $ne: id },
      });
      if (existingProduct) {
        throw new ValidationError(
          "Product code already exists",
          INVENTORY_FIELDS.PRODUCT_CODE,
        );
      }
    }

    if (updateData[INVENTORY_FIELDS.SKU]) {
      const existingSKU = await this.repository.findOne({
        [INVENTORY_FIELDS.SKU]: updateData[INVENTORY_FIELDS.SKU].toUpperCase(),
        _id: { $ne: id },
      });
      if (existingSKU) {
        throw new ValidationError("SKU already exists", INVENTORY_FIELDS.SKU);
      }
    }

    if (updateData[INVENTORY_FIELDS.BARCODE]) {
      const existingBarcode = await this.repository.findOne({
        [INVENTORY_FIELDS.BARCODE]: updateData[INVENTORY_FIELDS.BARCODE],
        _id: { $ne: id },
      });
      if (existingBarcode) {
        throw new ValidationError(
          "Barcode already exists",
          INVENTORY_FIELDS.BARCODE,
        );
      }
    }

    if (updateData[INVENTORY_FIELDS.SALE_CODE]) {
      const existingSaleCode = await this.repository.findOne({
        [INVENTORY_FIELDS.SALE_CODE]:
          updateData[INVENTORY_FIELDS.SALE_CODE].toUpperCase(),
        _id: { $ne: id },
      });
      if (existingSaleCode) {
        throw new ValidationError(
          "Sale code already exists",
          INVENTORY_FIELDS.SALE_CODE,
        );
      }
    }

    // Validate sellingPrice >= buyingPrice (matches legacy exactly)
    // Merge updateData with existing data to get the final values
    const finalBuyingPrice =
      updateData[INVENTORY_FIELDS.BUYING_PRICE] !== undefined
        ? updateData[INVENTORY_FIELDS.BUYING_PRICE]
        : existingInventory[INVENTORY_FIELDS.BUYING_PRICE];
    const finalSellingPrice =
      updateData[INVENTORY_FIELDS.SELLING_PRICE] !== undefined
        ? updateData[INVENTORY_FIELDS.SELLING_PRICE]
        : existingInventory[INVENTORY_FIELDS.SELLING_PRICE];

    if (finalSellingPrice < finalBuyingPrice) {
      throw new ValidationError(
        `Selling price (${finalSellingPrice}) should be greater than or equal to buying price (${finalBuyingPrice})`,
        "sellingPrice",
      );
    }

    // Apply updates to the existing document and save (matches legacy exactly)
    // This ensures validators have access to the complete merged document
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        existingInventory[key] = updateData[key];
      }
    });

    // Save the updated inventory using repository (this will run all validators with the complete document)
    const updatedInventory = await this.repository.save(existingInventory);

    // Return DTO
    return new InventoryResponseDTO(updatedInventory);
  }
}

export default InventoryService;
