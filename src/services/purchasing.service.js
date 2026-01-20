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
import Inventory from "../models/inventory.model.js";
import { generatePONumber } from "../shared/utils/purchasing.utils.js";
import Purchasing from "../models/purchasing.model.js";

export class PurchasingService {
  /**
   * @param {PurchasingRepository} repository - Injected repository instance (optional, fallback creates new instance)
   */
  constructor(repository) {
    this.repository = repository || new PurchasingRepository();
  }

  /**
   * Create new purchasing order
   * @param {Object} data - Request data
   * @param {Object} user - Authenticated user object (contains _id)
   * @returns {Promise<PurchasingResponseDTO>} Created purchasing DTO
   * @throws {CastError} If invalid supplierId or purchasedBy format
   * @throws {ValidationError} If products are invalid or inventory items not found
   */
  async createPurchase(data, user) {
    const { products, supplierId } = data;
    const purchasedBy = user._id;

    // Validate required fields
    if (!supplierId || !products || products.length === 0) {
      throw new ValidationError("Supplier ID and products are required");
    }

    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      throw new CastError("Invalid supplier ID format", "supplierId");
    }
    if (!mongoose.Types.ObjectId.isValid(purchasedBy)) {
      throw new CastError("Invalid purchased by ID format", "purchasedBy");
    }

    // Fetch product details for each product in the purchase
    const productsWithDetails = await Promise.all(
      products.map(async (item) => {
        if (!item[PRODUCT_FIELDS.INVENTORY_ID] || !item[PRODUCT_FIELDS.PURCHASE_QUANTITY]) {
          throw new ValidationError(
            `Product must have inventoryId and purchaseQuantity`
          );
        }

        const inventoryId = item[PRODUCT_FIELDS.INVENTORY_ID];
        if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
          throw new CastError("Invalid inventory ID format", "inventoryId");
        }

        const inventoryItem = await Inventory.findById(inventoryId);

        if (!inventoryItem) {
          throw new NotFoundError("Product", inventoryId);
        }

        return {
          [PRODUCT_FIELDS.INVENTORY_ID]: inventoryItem._id,
          [PRODUCT_FIELDS.PRODUCT_NAME]: inventoryItem.productName,
          [PRODUCT_FIELDS.PRODUCT_CODE]: inventoryItem.productCode,
          [PRODUCT_FIELDS.BUYING_PRICE]: inventoryItem.buyingPrice,
          [PRODUCT_FIELDS.PURCHASE_QUANTITY]: item[PRODUCT_FIELDS.PURCHASE_QUANTITY],
        };
      })
    );

    // Generate PO number
    const poNumber = await generatePONumber(Purchasing);

    // Prepare data with generated PO number and user ID
    const purchaseData = {
      ...data,
      [PURCHASING_FIELDS.PO_NUMBER]: poNumber,
      [PURCHASING_FIELDS.PURCHASED_BY]: purchasedBy,
      [PURCHASING_FIELDS.PRODUCTS]: productsWithDetails,
    };

    // Transform data using DTO
    const dto = new CreatePurchasingDTO(purchaseData);
    const modelData = dto.toModel();

    // Create purchasing order
    const newPurchase = await this.repository.create(modelData);

    // Fetch with populated fields for response
    const populatedPurchase = await this.repository.findById(newPurchase._id, {
      purchasedBy: "name role",
      supplierId: "supplierName supplierCode",
    });

    // Return DTO
    return new PurchasingResponseDTO(populatedPurchase);
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
    // Filter by the 'createdAt' field (when the purchase was created)
    try {
      const dateFilter = createDateFilter(
        { startDate, endDate },
        "createdAt",
        false
      );
      Object.assign(query, dateFilter);
    } catch (error) {
      // If it's a CustomError, convert to ValidationError
      if (error instanceof CustomError) {
        throw new ValidationError(error.message);
      }
      // For other errors, wrap and throw
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

    // Return list DTO with pagination
    // Note: We need to create DTOs from the purchases with totalRemainingQuantity
    // Since PurchasingListResponseDTO expects raw models, we'll create it manually
    // but we need to preserve the totalRemainingQuantity field
    const purchaseDTOs = purchasesWithTotalRemaining.map(
      (purchase) => {
        const dto = new PurchasingResponseDTO(purchase);
        const json = dto.toJSON();
        // Add totalRemainingQuantity to the response
        json.totalRemainingQuantity = purchase.totalRemainingQuantity;
        return json;
      }
    );

    return {
      purchases: purchaseDTOs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Get purchasing order by ID
   * @param {string} id - Purchasing order ID
   * @param {Object} options - Options (includeDeleted)
   * @returns {Promise<PurchasingResponseDTO>} Purchasing DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If purchasing order not found
   */
  async getPurchaseById(id, options = {}) {
    const { includeDeleted = false } = options;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid purchase order ID format", "id");
    }

    // Build query
    const query = includeDeleted ? { _id: id } : { _id: id, [PURCHASING_FIELDS.IS_DELETED]: false };

    // Find purchase with populated fields
    const purchase = await this.repository.findOne(query);

    if (!purchase) {
      throw new NotFoundError("Purchase", id);
    }

    // Populate fields
    const populatedPurchase = await this.repository.findById(purchase._id, {
      purchasedBy: "name role",
      supplierId: "supplierName supplierCode",
    });

    // Return DTO
    return new PurchasingResponseDTO(populatedPurchase);
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

    // Update the status
    const updatedPurchase = await this.repository.findOneAndUpdate(
      { _id: id, [PURCHASING_FIELDS.IS_DELETED]: false },
      { $set: { [PURCHASING_FIELDS.STATUS]: status } },
      { new: true, runValidators: true }
    );

    if (!updatedPurchase) {
      throw new NotFoundError("Purchase", id);
    }

    // Fetch with populated fields for response
    const populatedPurchase = await this.repository.findById(updatedPurchase._id, {
      purchasedBy: "name role",
      supplierId: "supplierName supplierCode",
    });

    // Return DTO
    return new PurchasingResponseDTO(populatedPurchase);
  }

  /**
   * Soft delete purchasing order
   * @param {string} id - Purchasing order ID
   * @returns {Promise<PurchasingResponseDTO>} Soft deleted purchasing DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If purchasing order not found
   * @throws {ValidationError} If purchasing order is already soft deleted
   */
  async softDeletePurchase(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid purchase order ID format", "id");
    }

    // Find the purchase order
    const purchase = await this.repository.findOne({
      _id: id,
      [PURCHASING_FIELDS.IS_DELETED]: false,
    });

    if (!purchase) {
      throw new NotFoundError("Purchase", id);
    }

    // Soft delete: set isDeleted to true and deletedAt to current date
    const softDeletedPurchase = await this.repository.findByIdAndUpdate(
      id,
      {
        $set: {
          [PURCHASING_FIELDS.IS_DELETED]: true,
          [PURCHASING_FIELDS.DELETED_AT]: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!softDeletedPurchase) {
      throw new NotFoundError("Purchase", id);
    }

    // Fetch with populated fields for response
    const populatedPurchase = await this.repository.findById(softDeletedPurchase._id, {
      purchasedBy: "name role",
      supplierId: "supplierName supplierCode",
    });

    // Return DTO
    return new PurchasingResponseDTO(populatedPurchase);
  }

  /**
   * Restore soft deleted purchasing order
   * @param {string} id - Purchasing order ID
   * @returns {Promise<PurchasingResponseDTO>} Restored purchasing DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If purchasing order not found
   * @throws {ValidationError} If purchasing order is not soft deleted
   */
  async restorePurchase(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid purchase order ID format", "id");
    }

    // Find the purchase order
    const purchase = await this.repository.findOne({
      _id: id,
      [PURCHASING_FIELDS.IS_DELETED]: true,
    });

    if (!purchase) {
      throw new NotFoundError("Purchase", id);
    }

    // Restore: set isDeleted to false and deletedAt to null
    const restoredPurchase = await this.repository.findByIdAndUpdate(
      id,
      {
        $set: {
          [PURCHASING_FIELDS.IS_DELETED]: false,
          [PURCHASING_FIELDS.DELETED_AT]: null,
        },
      },
      { new: true, runValidators: true }
    );

    if (!restoredPurchase) {
      throw new NotFoundError("Purchase", id);
    }

    // Fetch with populated fields for response
    const populatedPurchase = await this.repository.findById(restoredPurchase._id, {
      purchasedBy: "name role",
      supplierId: "supplierName supplierCode",
    });

    // Return DTO
    return new PurchasingResponseDTO(populatedPurchase);
  }
}

export default PurchasingService;
