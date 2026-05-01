/**
 * Storefront Inventory Service
 * Business logic layer for Storefront Inventory operations
 * Uses repositories for data access and DTOs for data transformation
 */

import {
  ValidationError,
  NotFoundError,
  CastError,
  UnauthorizedError,
} from "../errors/errorTypes.js";
import mongoose from "mongoose";
import { StorefrontInventoryRepository } from "../repositories/storefrontInventory.repository.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";
import { LocationProfileRepository } from "../repositories/locationProfile.repository.js";
import {
  StorefrontInventoryResponseDTO,
  CreateStorefrontInventoryDTO,
} from "../dtos/storefrontInventory.dto.js";
import {
  createStockAuditLog,
  determineActionType,
} from "../shared/utils/stockAuditLog.utils.js";

export class StorefrontInventoryService {
  /**
   * @param {StorefrontInventoryRepository} repository - Injected repository instance (optional, fallback creates new instance)
   * @param {InventoryRepository} inventoryRepository - Injected inventory repository instance
   * @param {LocationProfileRepository} locationRepository - Injected location repository instance
   */
  constructor(repository, inventoryRepository, locationRepository) {
    this.repository = repository || new StorefrontInventoryRepository();
    this.inventoryRepository = inventoryRepository || new InventoryRepository();
    this.locationRepository =
      locationRepository || new LocationProfileRepository();
  }

  /**
   * Create storefront inventory records for multiple inventory items
   * Matches legacy logic exactly
   * @param {Object} data - Request data with inventoryIds array, storefrontId, and optional quantity
   * @returns {Promise<Object>} Object with created and alreadyExists arrays
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If storefront or inventory not found
   */
  async createStorefrontInventory(data) {
    const { inventoryIds, storefrontId, quantity = 0 } = data;

    // Validate storefrontId (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(storefrontId)) {
      throw new ValidationError("Invalid storefront ID format");
    }

    // Validate inventoryIds - should be an array (matches legacy exactly)
    if (!Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      throw new ValidationError(
        "inventoryIds must be a non-empty array of inventory IDs",
      );
    }

    // Validate quantity (matches legacy exactly)
    if (quantity < 0) {
      throw new ValidationError("Quantity cannot be negative");
    }

    // Validate all inventoryIds are valid MongoDB ObjectIds (matches legacy exactly)
    const invalidIds = inventoryIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );
    if (invalidIds.length > 0) {
      throw new ValidationError(
        `Invalid inventory ID format(s): ${invalidIds.join(", ")}`,
      );
    }

    // Check if storefront exists (matches legacy exactly - uses repository)
    const storefront = await this.locationRepository.findOne({
      _id: storefrontId,
      type: "storefront",
    });
    if (!storefront) {
      throw new NotFoundError("Storefront not found", storefrontId);
    }

    // Check if storefront is deleted (matches legacy exactly)
    if (storefront.isDeleted) {
      throw new NotFoundError("Storefront is deleted", storefrontId);
    }

    // Check if all inventories exist (matches legacy exactly - uses repository)
    const inventories = await this.inventoryRepository.find({
      _id: { $in: inventoryIds },
    });
    const foundInventoryIds = inventories.map((inv) => inv._id.toString());
    const missingInventoryIds = inventoryIds.filter(
      (id) => !foundInventoryIds.includes(id.toString()),
    );
    if (missingInventoryIds.length > 0) {
      throw new NotFoundError(
        `Inventory not found for ID(s): ${missingInventoryIds.join(", ")}`,
      );
    }

    // Check which combinations already exist (matches legacy exactly - uses repository)
    const existingRecords = await this.repository.find({
      inventoryId: { $in: inventoryIds },
      storefrontId,
    });

    const existingInventoryIds = existingRecords.map((record) =>
      record.inventoryId.toString(),
    );
    const newInventoryIds = inventoryIds.filter(
      (id) => !existingInventoryIds.includes(id.toString()),
    );

    // Create new records for inventoryIds that don't exist (matches legacy exactly)
    // Use Promise.allSettled to handle each creation individually
    const createdRecords = [];
    const duplicateRecords = [];

    if (newInventoryIds.length > 0) {
      const createPromises = newInventoryIds.map(async (inventoryId) => {
        try {
          const record = await this.repository.create({
            inventoryId,
            storefrontId,
            quantity,
          });
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
                "productName productCode",
              );
              await existingRecord.populate(
                "storefrontId",
                "locationName locationCode",
              );
              return { status: "duplicate", record: existingRecord };
            }
          }
          // For other errors, rethrow to be handled by asyncErrorHandler
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
          // If creation failed for unexpected reasons, throw to be handled by asyncErrorHandler
          throw result.reason;
        }
      }
    }

    // Combine existing records with duplicates found during creation (matches legacy exactly)
    const allExistingRecords = [...existingRecords, ...duplicateRecords];

    // Populate existing records for response (if not already populated) (matches legacy exactly)
    for (const record of existingRecords) {
      if (!record.populated("inventoryId")) {
        await record.populate("inventoryId", "productName productCode");
        await record.populate("storefrontId", "locationName locationCode");
      }
    }

    return {
      created: createdRecords.map(
        (record) => new StorefrontInventoryResponseDTO(record),
      ),
      alreadyExists: allExistingRecords.map(
        (record) => new StorefrontInventoryResponseDTO(record),
      ),
      summary: {
        total: inventoryIds.length,
        created: createdRecords.length,
        alreadyExists: allExistingRecords.length,
      },
    };
  }

  /**
   * Get all storefront inventory records with pagination and filters
   * Matches legacy logic exactly
   * @param {Object} queryParams - Query parameters (page, limit, storefrontId, inventoryId, isLowStock, sortBy, sortOrder, search)
   * @returns {Promise<Object>} List of storefront inventory with pagination
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

    // Build query (matches legacy exactly)
    const query = {};

    if (storefrontId) {
      if (!mongoose.Types.ObjectId.isValid(storefrontId)) {
        throw new ValidationError("Invalid storefront ID format");
      }
      query.storefrontId = storefrontId;
    }

    if (inventoryId) {
      if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
        throw new ValidationError("Invalid inventory ID format");
      }
      query.inventoryId = inventoryId;
    }

    if (isLowStock !== undefined) {
      query.isLowStock = isLowStock === "true";
    }

    if (search) {
      // Search in populated fields - we'll need to search after population
      // For now, search by productCode if it matches ObjectId pattern, otherwise skip (matches legacy exactly)
      if (mongoose.Types.ObjectId.isValid(search)) {
        query.$or = [{ inventoryId: search }, { storefrontId: search }];
      }
    }

    // Sort (matches legacy exactly)
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Build query with populate options (matches legacy exactly - uses repository)
    const populateOptions = [
      {
        path: "inventoryId",
        select: "productName productCode SKU category sellingPrice barcode",
      },
      {
        path: "storefrontId",
        select: "locationName locationCode",
      },
    ];

    // Apply pagination only if page or limit is provided (matches legacy exactly)
    const usePagination = page !== undefined || limit !== undefined;
    let paginationInfo = null;

    if (usePagination) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Execute query with pagination (uses repository)
      const stock = await this.repository.find(query, {
        sort,
        skip,
        limit: limitNum,
        populate: populateOptions,
      });

      // Get total count for pagination
      const total = await this.repository.countDocuments(query);

      paginationInfo = {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      };

      return {
        data: stock.map((item) => new StorefrontInventoryResponseDTO(item)),
        pagination: paginationInfo,
      };
    }

    // Execute query without pagination (uses repository)
    const stock = await this.repository.find(query, {
      sort,
      populate: populateOptions,
    });

    return {
      data: stock.map((item) => new StorefrontInventoryResponseDTO(item)),
    };
  }

  /**
   * Get storefront inventory by ID
   * Matches legacy logic exactly
   * @param {string} id - Storefront inventory ID
   * @returns {Promise<Object>} Storefront inventory
   * @throws {ValidationError} If invalid ID format
   * @throws {NotFoundError} If storefront inventory not found
   */
  async getStorefrontInventoryById(id) {
    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid storefront inventory ID format");
    }

    // Find storefront inventory with populated fields (matches legacy exactly - uses repository)
    const stock = await this.repository.findById(id, {
      populate: [
        {
          path: "inventoryId",
          select:
            "productName productCode SKU category buyingPrice sellingPrice barcode",
        },
        {
          path: "storefrontId",
          select: "locationName locationCode locationAddress",
        },
      ],
    });

    if (!stock) {
      throw new NotFoundError("Storefront inventory not found", id);
    }

    return new StorefrontInventoryResponseDTO(stock);
  }

  /**
   * Update storefront inventory quantity with ACID properties
   * Uses quantityChange: positive number = add, negative number = subtract
   * Matches legacy logic exactly
   * @param {string} id - Storefront inventory ID
   * @param {number} quantityChange - Quantity change (positive to add, negative to subtract)
   * @param {string} reason - Optional reason for the change
   * @param {string} adminId - Admin ID performing the operation
   * @returns {Promise<Object>} Updated storefront inventory with operation details
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If storefront inventory not found
   * @throws {UnauthorizedError} If adminId is not provided
   */
  async updateStorefrontInventoryQuantity(id, quantityChange, reason, adminId) {
    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid storefront inventory ID format");
    }

    // Validate quantityChange (matches legacy exactly)
    if (
      typeof quantityChange !== "number" ||
      quantityChange === 0 ||
      !Number.isFinite(quantityChange)
    ) {
      throw new ValidationError(
        "A valid non-zero numeric 'quantityChange' is required. Use positive number to add, negative number to subtract.",
      );
    }

    // Get admin ID from authenticated user (matches legacy exactly)
    if (!adminId) {
      throw new UnauthorizedError(
        "Authentication required. Admin ID not found.",
      );
    }

    // Start MongoDB session for transaction (ACID properties) (matches legacy exactly)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the stock before the update to get the current quantity (matches legacy exactly)
      // Populate inventoryId to get product name for error messages (uses repository)
      const stockToUpdate = await this.repository.findById(id, {
        session,
        populate: [
          { path: "inventoryId", select: "productName productCode SKU" },
          { path: "storefrontId", select: "locationName locationCode type" },
        ],
      });

      if (!stockToUpdate) {
        await session.abortTransaction();
        session.endSession();
        throw new NotFoundError("Storefront inventory not found", id);
      }

      // Validate storefront exists and is not deleted (matches legacy exactly)
      if (stockToUpdate.storefrontId?.isDeleted) {
        await session.abortTransaction();
        session.endSession();
        throw new NotFoundError(
          "Storefront is deleted",
          stockToUpdate.storefrontId._id,
        );
      }

      // Validate location type (matches legacy exactly)
      if (stockToUpdate.storefrontId?.type !== "storefront") {
        await session.abortTransaction();
        session.endSession();
        throw new ValidationError("Location is not a storefront");
      }

      const beforeQuantity = stockToUpdate.quantity || 0;
      const afterQuantity = beforeQuantity + quantityChange;

      // Validate that the new quantity won't be negative (matches legacy exactly)
      if (afterQuantity < 0) {
        await session.abortTransaction();
        session.endSession();
        throw new ValidationError(
          `Cannot update storefront inventory quantity. Current quantity: ${beforeQuantity}, requested change: ${quantityChange}. This would result in a negative quantity (${afterQuantity}).`,
        );
      }

      // Perform the update using repository's updateQuantity method (matches legacy exactly - atomic operation)
      const updatedStock = await this.repository.updateQuantity(
        id,
        quantityChange,
        { session },
      );

      // Create audit log entry (matches legacy exactly - uses legacy service functions)
      const action = determineActionType(quantityChange, false);
      await createStockAuditLog({
        inventoryId: stockToUpdate.inventoryId._id,
        adminId: adminId,
        locationId: stockToUpdate.storefrontId._id,
        locationType: "storefront",
        stockRecordId: id,
        beforeQuantity: beforeQuantity,
        afterQuantity: afterQuantity,
        quantityChange: quantityChange,
        action: action,
        reason: reason || null,
        relatedTransactionId: null,
        relatedTransactionType: null,
        session: session,
      });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // Determine action type for response message (matches legacy exactly)
      const actionType = quantityChange > 0 ? "add" : "remove";
      const actionMessage =
        quantityChange > 0
          ? `increased by ${Math.abs(quantityChange)}`
          : `decreased by ${Math.abs(quantityChange)}`;

      return {
        data: new StorefrontInventoryResponseDTO(updatedStock),
        message: `Storefront inventory quantity ${actionMessage} successfully. New quantity: ${updatedStock.quantity}`,
        operation: {
          type: actionType,
          previousQuantity: beforeQuantity,
          newQuantity: updatedStock.quantity,
          quantityChange: quantityChange,
        },
      };
    } catch (error) {
      // Abort transaction on error (matches legacy exactly)
      await session.abortTransaction();
      session.endSession();

      // Re-throw the error
      throw error;
    }
  }
}

export default StorefrontInventoryService;
