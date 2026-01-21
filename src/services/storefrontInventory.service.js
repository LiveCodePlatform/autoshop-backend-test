/**
 * Storefront Inventory Service
 * Business logic layer for Storefront Inventory operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { StorefrontInventoryRepository } from "../repositories/storefrontInventory.repository.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";
import { LocationProfileRepository } from "../repositories/locationProfile.repository.js";
import { StockAuditLogService } from "./stockAuditLog.service.js";
import {
  CreateStorefrontInventoryDTO,
  StorefrontInventoryResponseDTO,
  StorefrontInventoryListResponseDTO,
} from "../dtos/storefrontInventory.dto.js";
import {
  ValidationError,
  NotFoundError,
  CastError,
  ConflictError,
  UnauthorizedError,
} from "../errors/errorTypes.js";
import { STOREFRONT_INVENTORY_FIELDS } from "../types/storefrontInventory.types.js";
import { LOCATION_TYPE } from "../types/locationProfile.types.js";
import mongoose from "mongoose";

export class StorefrontInventoryService {
  /**
   * @param {StorefrontInventoryRepository} repository - Injected repository instance (optional, fallback creates new instance)
   * @param {InventoryRepository} inventoryRepository - Injected inventory repository instance
   * @param {LocationProfileRepository} locationRepository - Injected location repository instance
   * @param {StockAuditLogService} stockAuditLogService - Injected stock audit log service instance
   */
  constructor(
    repository,
    inventoryRepository,
    locationRepository,
    stockAuditLogService
  ) {
    this.repository = repository || new StorefrontInventoryRepository();
    this.inventoryRepository =
      inventoryRepository || new InventoryRepository();
    this.locationRepository =
      locationRepository || new LocationProfileRepository();
    this.stockAuditLogService =
      stockAuditLogService || new StockAuditLogService();
  }

  /**
   * Create storefront inventory records for multiple inventory items
   * @param {Object} data - Request data with inventoryIds array, storefrontId, and optional quantity
   * @returns {Promise<Object>} Object with created and alreadyExists arrays
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If storefront or inventory not found
   */
  async createStorefrontInventory(data) {
    const { inventoryIds, storefrontId, quantity = 0 } = data;

    // Validate storefrontId
    if (!mongoose.Types.ObjectId.isValid(storefrontId)) {
      throw new CastError("Invalid storefront ID format", "storefrontId");
    }

    // Validate inventoryIds - should be an array
    if (!Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      throw new ValidationError(
        "inventoryIds must be a non-empty array of inventory IDs",
        "inventoryIds"
      );
    }

    // Validate quantity
    if (quantity < 0) {
      throw new ValidationError("Quantity cannot be negative", "quantity");
    }

    // Validate all inventoryIds are valid MongoDB ObjectIds
    const invalidIds = inventoryIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      throw new CastError(
        `Invalid inventory ID format(s): ${invalidIds.join(", ")}`,
        "inventoryIds"
      );
    }

    // Check if storefront exists and is not deleted
    const storefront = await this.locationRepository.findOne({
      _id: storefrontId,
      type: LOCATION_TYPE.STOREFRONT,
    });
    if (!storefront) {
      throw new NotFoundError("Storefront", storefrontId);
    }
    if (storefront.isDeleted) {
      throw new NotFoundError("Storefront is deleted", storefrontId);
    }

    // Check if all inventories exist
    const inventories = await this.inventoryRepository.find({
      _id: { $in: inventoryIds },
    });
    const foundInventoryIds = inventories.map((inv) => inv._id.toString());
    const missingInventoryIds = inventoryIds.filter(
      (id) => !foundInventoryIds.includes(id.toString())
    );
    if (missingInventoryIds.length > 0) {
      throw new NotFoundError(
        `Inventory not found for ID(s): ${missingInventoryIds.join(", ")}`
      );
    }

    // Check which combinations already exist
    const existingRecords = await this.repository.findByInventoryIdsAndStorefront(
      inventoryIds,
      storefrontId
    );

    const existingInventoryIds = existingRecords.map((record) =>
      record.inventoryId.toString()
    );
    const newInventoryIds = inventoryIds.filter(
      (id) => !existingInventoryIds.includes(id.toString())
    );

    // Create new records for inventoryIds that don't exist
    const createdRecords = [];
    const duplicateRecords = [];

    if (newInventoryIds.length > 0) {
      const createPromises = newInventoryIds.map(async (inventoryId) => {
        try {
          const dto = new CreateStorefrontInventoryDTO({
            inventoryId,
            storefrontId,
            quantity,
          });
          const record = await this.repository.create(dto.toModel());
          await record.populate("inventoryId", "productName productCode");
          await record.populate("storefrontId", "locationName locationCode");
          return { status: "created", record };
        } catch (error) {
          // Handle duplicate key error (unique constraint violation - error code 11000)
          if (error.code === 11000) {
            // If duplicate, fetch the existing record
            const existingRecord = await this.repository.findOne({
              inventoryId,
              storefrontId,
            });
            if (existingRecord) {
              await existingRecord.populate(
                "inventoryId",
                "productName productCode"
              );
              await existingRecord.populate(
                "storefrontId",
                "locationName locationCode"
              );
              return { status: "duplicate", record: existingRecord };
            }
          }
          // For other errors, rethrow
          throw error;
        }
      });

      const results = await Promise.allSettled(createPromises);

      // Process results - collect created and duplicate records
      for (const result of results) {
        if (result.status === "fulfilled") {
          const { status, record } = result.value;
          if (status === "created") {
            createdRecords.push(record);
          } else if (status === "duplicate") {
            duplicateRecords.push(record);
          }
        } else {
          // If creation failed for unexpected reasons, rethrow
          throw result.reason;
        }
      }
    }

    // Populate existing records for response (if not already populated)
    for (const record of existingRecords) {
      if (!record.populated("inventoryId")) {
        await record.populate("inventoryId", "productName productCode");
        await record.populate("storefrontId", "locationName locationCode");
      }
    }

    // Combine existing records with duplicates found during creation
    const allExistingRecords = [...existingRecords, ...duplicateRecords];

    return {
      created: createdRecords,
      alreadyExists: allExistingRecords,
      summary: {
        total: inventoryIds.length,
        created: createdRecords.length,
        alreadyExists: allExistingRecords.length,
      },
    };
  }

  /**
   * Get all storefront inventory records with pagination and filters
   * @param {Object} queryParams - Query parameters (page, limit, storefrontId, inventoryId, isLowStock, sortBy, sortOrder, search)
   * @returns {Promise<StorefrontInventoryListResponseDTO>} List of storefront inventory DTOs with pagination
   */
  async getAllStorefrontInventory(queryParams = {}) {
    const {
      page,
      limit,
      storefrontId,
      inventoryId,
      isLowStock,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = queryParams;

    // Build query
    const query = {};

    if (storefrontId) {
      if (!mongoose.Types.ObjectId.isValid(storefrontId)) {
        throw new CastError("Invalid storefront ID format", "storefrontId");
      }
      query[STOREFRONT_INVENTORY_FIELDS.STOREFRONT_ID] = storefrontId;
    }

    if (inventoryId) {
      if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
        throw new CastError("Invalid inventory ID format", "inventoryId");
      }
      query[STOREFRONT_INVENTORY_FIELDS.INVENTORY_ID] = inventoryId;
    }

    if (isLowStock !== undefined) {
      query[STOREFRONT_INVENTORY_FIELDS.IS_LOW_STOCK] =
        isLowStock === "true" || isLowStock === true;
    }

    if (search) {
      // Search in populated fields - we'll need to search after population
      // For now, search by productCode if it matches ObjectId pattern, otherwise skip
      if (mongoose.Types.ObjectId.isValid(search)) {
        query.$or = [
          { [STOREFRONT_INVENTORY_FIELDS.INVENTORY_ID]: search },
          { [STOREFRONT_INVENTORY_FIELDS.STOREFRONT_ID]: search },
        ];
      }
    }

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Populate options
    const populate = [
      {
        path: "inventoryId",
        select: "productName productCode SKU category sellingPrice barcode",
      },
      {
        path: "storefrontId",
        select: "locationName locationCode",
      },
    ];

    // Apply pagination only if page or limit is provided
    const usePagination = page !== undefined || limit !== undefined;
    let paginationInfo = null;

    if (usePagination) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Execute query with pagination
      const inventories = await this.repository.find(query, {
        sort,
        skip,
        limit: limitNum,
        populate,
      });

      // Get total count for pagination
      const total = await this.repository.countDocuments(query);

      paginationInfo = {
        page: pageNum,
        limit: limitNum,
        total,
      };

      // Return list DTO with pagination
      return new StorefrontInventoryListResponseDTO(inventories, paginationInfo);
    } else {
      // Execute query without pagination
      const inventories = await this.repository.find(query, {
        sort,
        populate,
      });

      // Return list DTO without pagination (use total as inventories.length)
      return new StorefrontInventoryListResponseDTO(inventories, {
        page: 1,
        limit: inventories.length,
        total: inventories.length,
      });
    }
  }

  /**
   * Get storefront inventory by ID
   * @param {string} id - Storefront inventory ID
   * @returns {Promise<StorefrontInventoryResponseDTO>} Storefront inventory DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If storefront inventory not found
   */
  async getStorefrontInventoryById(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid storefront inventory ID format", "id");
    }

    // Find storefront inventory with populated fields
    const storefrontInventory = await this.repository.findById(id);
    if (!storefrontInventory) {
      throw new NotFoundError("Storefront inventory", id);
    }

    // Populate related fields
    await storefrontInventory.populate(
      "inventoryId",
      "productName productCode SKU category buyingPrice sellingPrice barcode"
    );
    await storefrontInventory.populate(
      "storefrontId",
      "locationName locationCode locationAddress"
    );

    // Return DTO
    return new StorefrontInventoryResponseDTO(storefrontInventory);
  }

  /**
   * Update storefront inventory quantity with ACID properties
   * Uses quantityChange: positive number = add, negative number = subtract
   * @param {string} id - Storefront inventory ID
   * @param {number} quantityChange - Quantity change (positive to add, negative to subtract)
   * @param {string} reason - Optional reason for the change
   * @param {string} adminId - Admin ID performing the operation
   * @returns {Promise<Object>} Updated storefront inventory with operation details
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If storefront inventory not found
   * @throws {ValidationError} If validation fails
   * @throws {UnauthorizedError} If adminId is not provided
   */
  async updateStorefrontInventoryQuantity(id, quantityChange, reason, adminId) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid storefront inventory ID format", "id");
    }

    // Validate adminId
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      throw new UnauthorizedError("Authentication required. Admin ID not found.");
    }

    // Validate quantityChange
    if (
      typeof quantityChange !== "number" ||
      quantityChange === 0 ||
      !Number.isFinite(quantityChange)
    ) {
      throw new ValidationError(
        "A valid non-zero numeric 'quantityChange' is required. Use positive number to add, negative number to subtract.",
        "quantityChange"
      );
    }

    // Start MongoDB session for transaction (ACID properties)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the stock before the update to get the current quantity
      // Populate inventoryId and storefrontId for validation and error messages
      const stockToUpdate = await this.repository.findById(id, {
        session,
        populate: [
          { path: "inventoryId", select: "productName productCode SKU barcode" },
          { path: "storefrontId", select: "locationName locationCode type isDeleted" },
        ],
      });

      if (!stockToUpdate) {
        await session.abortTransaction();
        session.endSession();
        throw new NotFoundError("Storefront inventory", id);
      }

      // Validate storefront exists and is not deleted
      if (stockToUpdate.storefrontId?.isDeleted) {
        await session.abortTransaction();
        session.endSession();
        throw new NotFoundError("Storefront is deleted", stockToUpdate.storefrontId._id);
      }

      // Validate location type
      if (stockToUpdate.storefrontId?.type !== LOCATION_TYPE.STOREFRONT) {
        await session.abortTransaction();
        session.endSession();
        throw new ValidationError("Location is not a storefront", "storefrontId");
      }

      const beforeQuantity = stockToUpdate.quantity || 0;
      const afterQuantity = beforeQuantity + quantityChange;

      // Validate that the new quantity won't be negative
      if (afterQuantity < 0) {
        await session.abortTransaction();
        session.endSession();
        throw new ValidationError(
          `Cannot update storefront inventory quantity. Current quantity: ${beforeQuantity}, requested change: ${quantityChange}. This would result in a negative quantity (${afterQuantity}).`,
          "quantityChange"
        );
      }

      // Perform the update using atomic $inc operation
      const updatedStock = await this.repository.updateQuantity(
        id,
        quantityChange,
        { session }
      );

      if (!updatedStock) {
        await session.abortTransaction();
        session.endSession();
        throw new NotFoundError("Storefront inventory", id);
      }

      // Create audit log entry
      const action = this.stockAuditLogService.determineActionType(
        quantityChange,
        false
      );
      await this.stockAuditLogService.createStockAuditLog(
        {
          inventoryId: stockToUpdate.inventoryId._id,
          adminId: adminId,
          locationId: stockToUpdate.storefrontId._id,
          locationType: LOCATION_TYPE.STOREFRONT,
          stockRecordId: id,
          beforeQuantity: beforeQuantity,
          afterQuantity: afterQuantity,
          quantityChange: quantityChange,
          action: action,
          reason: reason || null,
          relatedTransactionId: null,
          relatedTransactionType: null,
        },
        { session }
      );

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // Determine action type for response message
      const actionType = quantityChange > 0 ? "add" : "remove";
      const actionMessage =
        quantityChange > 0
          ? `increased by ${Math.abs(quantityChange)}`
          : `decreased by ${Math.abs(quantityChange)}`;

      return {
        storefrontInventory: new StorefrontInventoryResponseDTO(updatedStock),
        message: `Storefront inventory quantity ${actionMessage} successfully. New quantity: ${updatedStock.quantity}`,
        operation: {
          type: actionType,
          previousQuantity: beforeQuantity,
          newQuantity: updatedStock.quantity,
          quantityChange: quantityChange,
        },
      };
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();

      // Re-throw the error (it's already a proper error type)
      throw error;
    }
  }
}

export default StorefrontInventoryService;
