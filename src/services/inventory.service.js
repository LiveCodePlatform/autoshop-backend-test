/**
 * Inventory Service
 * Business logic layer for Inventory operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { InventoryRepository } from "../repositories/inventory.repository.js";
import {
  CreateInventoryDTO,
  InventoryResponseDTO,
  InventoryListResponseDTO,
} from "../dtos/inventory.dto.js";
import { ValidationError, NotFoundError, CastError } from "../errors/errorTypes.js";
import { INVENTORY_FIELDS } from "../types/inventory.types.js";
import mongoose from "mongoose";

export class InventoryService {
  /**
   * @param {InventoryRepository} repository - Injected repository instance (optional, fallback creates new instance)
   */
  constructor(repository) {
    this.repository = repository || new InventoryRepository();
  }

  /**
   * Create new inventory item
   * @param {Object} data - Request data
   * @returns {Promise<InventoryResponseDTO>} Created inventory DTO
   * @throws {ValidationError} If uniqueness check fails
   */
  async createInventory(data) {
    // Transform data using DTO
    const dto = new CreateInventoryDTO(data);
    const inventoryData = dto.toModel();

    // Business logic: Check uniqueness for productCode
    if (inventoryData[INVENTORY_FIELDS.PRODUCT_CODE]) {
      const existingProduct = await this.repository.findOne({
        productCode: inventoryData[INVENTORY_FIELDS.PRODUCT_CODE].toUpperCase(),
      });
      if (existingProduct) {
        throw new ValidationError(
          "Product code already exists",
          INVENTORY_FIELDS.PRODUCT_CODE
        );
      }
    }

    // Business logic: Check uniqueness for SKU
    if (inventoryData[INVENTORY_FIELDS.SKU]) {
      const existingSKU = await this.repository.findOne({
        SKU: inventoryData[INVENTORY_FIELDS.SKU].toUpperCase(),
      });
      if (existingSKU) {
        throw new ValidationError("SKU already exists", INVENTORY_FIELDS.SKU);
      }
    }

    // Business logic: Check uniqueness for barcode
    if (inventoryData[INVENTORY_FIELDS.BARCODE]) {
      const existingBarcode = await this.repository.findOne({
        barcode: inventoryData[INVENTORY_FIELDS.BARCODE],
      });
      if (existingBarcode) {
        throw new ValidationError(
          "Barcode already exists",
          INVENTORY_FIELDS.BARCODE
        );
      }
    }

    // Business logic: Check uniqueness for saleCode
    if (inventoryData[INVENTORY_FIELDS.SALE_CODE]) {
      const existingSaleCode = await this.repository.findOne({
        saleCode: inventoryData[INVENTORY_FIELDS.SALE_CODE].toUpperCase(),
      });
      if (existingSaleCode) {
        throw new ValidationError(
          "Sale code already exists",
          INVENTORY_FIELDS.SALE_CODE
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
   * Get inventory item by ID
   * @param {string} id - Inventory ID
   * @returns {Promise<InventoryResponseDTO>} Inventory DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If inventory not found
   */
  async getInventoryById(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid inventory ID format", "id");
    }

    // Find inventory
    const inventory = await this.repository.findById(id);

    if (!inventory) {
      throw new NotFoundError("Inventory", id);
    }

    // Return DTO
    return new InventoryResponseDTO(inventory);
  }
}

export default InventoryService;
