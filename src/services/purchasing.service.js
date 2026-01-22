/**
 * Purchasing Service
 * Business logic layer for Purchasing operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { PurchasingRepository } from "../repositories/purchasing.repository.js";
import {
  CreatePurchasingDTO,
  PurchasingResponseDTO,
  PurchasingListResponseDTO,
} from "../dtos/purchasing.dto.js";
import { NotFoundError, CastError, ValidationError } from "../errors/errorTypes.js";
import {
  PURCHASING_FIELDS,
  PRODUCT_FIELDS,
  PURCHASING_STATUS,
} from "../types/purchasing.types.js";
import mongoose from "mongoose";
import { createDateFilter } from "../shared/utils/dateFilter.utils.js";
import CustomError from "../shared/utils/customError.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";

export class PurchasingService {
  /**
   * @param {PurchasingRepository} repository - Injected repository instance (optional, fallback creates new instance)
   * @param {InventoryRepository} inventoryRepository - Injected inventory repository instance
   */
  constructor(repository, inventoryRepository) {
    this.repository = repository || new PurchasingRepository();
    this.inventoryRepository = inventoryRepository || new InventoryRepository();
  }

  /**
   * Create new purchasing order
   * Matches legacy logic exactly
   * @param {Object} data - Request data (supplierId, products, note, totalAmount)
   * @param {Object} user - Authenticated user object (contains _id)
   * @returns {Promise<PurchasingResponseDTO>} Created purchasing DTO
   * @throws {ValidationError} If products are invalid or inventory items not found
   */
  async createPurchase(data, user) {
    const { supplierId, products, note, totalAmount } = data;
    const purchasedBy = user._id;

    // Validate required fields (matches legacy exactly)
    if (!supplierId || !products || products.length === 0) {
      throw new ValidationError("Supplier ID and products are required");
    }

    // Fetch product details for each product in the purchase (matches legacy exactly)
    const productsWithDetails = await Promise.all(
      products.map(async (item) => {
        if (!item.inventoryId || !item.purchaseQuantity) {
          throw new ValidationError(
            `Product must have inventoryId and purchaseQuantity`
          );
        }

        const inventoryItem = await this.inventoryRepository.findById(item.inventoryId);

        if (!inventoryItem) {
          throw new NotFoundError(
            `Product with ID ${item.inventoryId} not found`,
            item.inventoryId
          );
        }

        return {
          inventoryId: inventoryItem._id,
          productName: inventoryItem.productName,
          productCode: inventoryItem.productCode,
          buyingPrice: inventoryItem.buyingPrice,
          purchaseQuantity: item.purchaseQuantity,
        };
      })
    );

    // Generate PO number (matches legacy exactly - uses model static method)
    const poNumber = await Purchasing.generatePONumber();

    // Create purchase (matches legacy exactly - direct creation, no DTO transformation)
    const purchase = await this.repository.create({
      poNumber,
      supplierId,
      products: productsWithDetails,
      note: note || "No note available",
      totalAmount,
      status: "pending",
      purchasedBy,
    });

    // Return DTO
    return new PurchasingResponseDTO(purchase);
  }

  /**
   * Get all purchasing orders with pagination and filters
   * @param {Object} queryParams - Query parameters (page, limit, sortBy, sortOrder, isDeleted, status, startDate, endDate)
   * @returns {Promise<PurchasingListResponseDTO>} List of purchasing DTOs with pagination
   */
  async getAllPurchases(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      isDeleted,
      status,
      startDate,
      endDate,
    } = queryParams;

    // Build query filter
    const query = {};

    // Filter by isDeleted status if provided
    // Supports: ?isDeleted=true, ?isDeleted=false, or omit to default to false
    if (isDeleted !== undefined) {
      // Convert string "true"/"false" to boolean
      if (isDeleted === "true" || isDeleted === true) {
        query[PURCHASING_FIELDS.IS_DELETED] = true;
      } else if (isDeleted === "false" || isDeleted === false) {
        query[PURCHASING_FIELDS.IS_DELETED] = false;
      } else {
        throw new ValidationError(
          "Invalid isDeleted value. Must be 'true' or 'false'."
        );
      }
    } else {
      // Default: exclude deleted purchases if isDeleted is not specified
      query[PURCHASING_FIELDS.IS_DELETED] = false;
    }

    // Filter by status if provided
    if (status !== undefined) {
      const validStatuses = [
        "pending",
        "confirmed",
        "arrived",
        "cancelled",
        "completed",
      ];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(
          `Invalid status. Allowed values: ${validStatuses.join(", ")}`
        );
      }
      query[PURCHASING_FIELDS.STATUS] = status;
    }

    // Add date range filter using dateFilter utility
    // Filter by the 'createdAt' field (when the purchase was created) (matches legacy exactly)
    try {
      const dateFilter = createDateFilter(queryParams, "createdAt", false);
      Object.assign(query, dateFilter);
    } catch (error) {
      // If it's a CustomError, pass it through (matches legacy exactly)
      if (error instanceof CustomError) {
        throw error;
      }
      // For other errors, wrap and throw (matches legacy exactly)
      throw new ValidationError(error.message || "Invalid date filter");
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Populate options
    const populate = {
      purchasedBy: "name role",
      supplierId: "supplierName supplierCode",
    };

    // Execute query
    const purchases = await this.repository.find(query, {
      sort,
      skip,
      limit: limitNum,
      populate,
    });

    // Calculate totalRemainingQuantity for each purchase
    // Convert to plain objects and add totalRemainingQuantity field
    const purchasesWithTotalRemaining = purchases.map((purchase) => {
      const purchaseObj = purchase.toObject({ virtuals: true });

      // Calculate totalRemainingQuantity by summing all products' remainingQuantity
      // Use virtual field if available, otherwise calculate manually
      const totalRemainingQuantity = purchase.products.reduce(
        (total, product) => {
          // Try to use virtual field first, fallback to manual calculation
          const remainingQty =
            product.remainingQuantity !== undefined
              ? product.remainingQuantity
              : (product.purchaseQuantity || 0) - (product.receivedQuantity || 0);
          return total + Math.max(0, remainingQty); // Ensure non-negative
        },
        0
      );

      // Add totalRemainingQuantity after products section
      return {
        ...purchaseObj,
        totalRemainingQuantity,
      };
    });

    // Get total count for pagination
    const total = await this.repository.countDocuments(query);

    // Return response (matches legacy structure exactly)
    return {
      data: purchasesWithTotalRemaining,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    };
  }

  /**
   * Get purchasing order by ID
   * Matches legacy logic exactly
   * @param {string} id - Purchasing order ID
   * @param {Object} options - Options (includeDeleted)
   * @returns {Promise<PurchasingResponseDTO>} Purchasing DTO
   * @throws {NotFoundError} If purchasing order not found
   */
  async getPurchaseById(id, options = {}) {
    const { includeDeleted = false } = options;

    // Build query (matches legacy exactly - exclude deleted by default)
    const query = includeDeleted ? { _id: id } : { _id: id, isDeleted: false };

    // Find purchase with populate (matches legacy exactly - uses repository)
    const purchase = await this.repository.findOne(query, {
      populate: {
        purchasedBy: "name role",
        supplierId: "supplierName contactNumber",
      },
    });

    if (!purchase) {
      throw new NotFoundError("Purchase not found", id);
    }

    // Return DTO
    return new PurchasingResponseDTO(purchase);
  }

  /**
   * Update purchasing order status
   * @param {string} id - Purchasing order ID
   * @param {string} status - New status
   * @returns {Promise<PurchasingResponseDTO>} Updated purchasing DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If purchasing order not found
   * @throws {ValidationError} If status is invalid or purchase is soft deleted
   */
  async updatePurchaseStatus(id, status) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid purchase order ID format", "id");
    }

    // Validate status is provided
    if (!status) {
      throw new ValidationError("Status is required", PURCHASING_FIELDS.STATUS);
    }

    // Business logic: Only allow certain statuses for update (not "completed")
    const validStatuses = [
      PURCHASING_STATUS.PENDING,
      PURCHASING_STATUS.CONFIRMED,
      PURCHASING_STATUS.ARRIVED,
      PURCHASING_STATUS.CANCELLED,
    ];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(
        `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
        PURCHASING_FIELDS.STATUS
      );
    }

    // Check if purchase exists and if it's soft-deleted
    const existingPurchase = await this.repository.findById(id);
    if (!existingPurchase) {
      throw new NotFoundError("Purchase", id);
    }

    // Business logic: Cannot update status of soft-deleted purchase
    if (existingPurchase[PURCHASING_FIELDS.IS_DELETED] === true) {
      throw new ValidationError(
        "Cannot update status of a soft-deleted purchase order. Please restore the purchase order first.",
        PURCHASING_FIELDS.IS_DELETED
      );
    }

    // Update the status (matches legacy exactly - uses findOneAndUpdate)
    const purchase = await this.repository.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { status },
      { new: true, runValidators: true }
    );

    if (!purchase) {
      throw new NotFoundError("Purchase order not found", id);
    }

    // Return DTO
    return new PurchasingResponseDTO(purchase);
  }

  /**
   * Soft delete purchasing order
   * Matches legacy logic exactly
   * @param {string} id - Purchasing order ID
   * @returns {Promise<PurchasingResponseDTO>} Soft deleted purchasing DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If purchasing order not found
   */
  async softDeletePurchase(id) {
    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid purchase order ID format", "id");
    }

    // Find the purchase order (matches legacy exactly)
    const purchase = await this.repository.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!purchase) {
      throw new NotFoundError("Purchase order not found", id);
    }

    // Soft delete: set isDeleted to true and deletedAt to current date (matches legacy exactly)
    purchase.isDeleted = true;
    purchase.deletedAt = new Date();
    await purchase.save();

    // Return DTO
    return new PurchasingResponseDTO(purchase);
  }

  /**
   * Restore soft deleted purchasing order
   * Matches legacy logic exactly
   * @param {string} id - Purchasing order ID
   * @returns {Promise<PurchasingResponseDTO>} Restored purchasing DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If purchasing order not found
   */
  async restorePurchase(id) {
    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid purchase order ID format", "id");
    }

    // Find the purchase order (matches legacy exactly)
    const purchase = await this.repository.findOne({
      _id: id,
      isDeleted: true,
    });

    if (!purchase) {
      throw new NotFoundError("Purchase order not found", id);
    }

    // Restore: set isDeleted to false and deletedAt to null (matches legacy exactly)
    purchase.isDeleted = false;
    purchase.deletedAt = null;
    await purchase.save();

    // Return DTO
    return new PurchasingResponseDTO(purchase);
  }
}

export default PurchasingService;
