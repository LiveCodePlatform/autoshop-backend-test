/**
 * Transfer Service
 * Business logic layer for Transfer operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { TransferRepository } from "../repositories/transfer.repository.js";
import Transfer from "../models/transfer.model.js";
import {
  CreateTransferDTO,
  UpdateTransferDTO,
  TransferResponseDTO,
  TransferListResponseDTO,
} from "../dtos/transfer.dto.js";
import {
  ValidationError,
  NotFoundError,
  CastError,
} from "../errors/errorTypes.js";
import { TRANSFER_FIELDS, TRANSFER_STATUS, TRANSFER_SOURCE_TYPE } from "../types/transfer.types.js";
import mongoose from "mongoose";
// Import legacy models for validation
import GoodsRecievedNote from "../legacy/models/goodsRecievedNote.model.js";
import LocationProfile from "../models/locationProfile.model.js";
import WarehouseStock from "../legacy/models/warehouse.model.js";
import StorefrontInventory from "../legacy/models/storefrontInventory.model.js";
import Inventory from "../models/inventory.model.js";

export class TransferService {
  /**
   * @param {TransferRepository} repository - Injected repository instance (optional, fallback creates new instance)
   */
  constructor(repository) {
    this.repository = repository || new TransferRepository();
  }

  /**
   * Generate transfer number
   * Business logic: Generates unique transfer number in format TRF-YYYY-NNNN
   * @returns {Promise<string>} Generated transfer number
   */
  async generateTransferNumber() {
    const year = new Date().getFullYear();
    const prefix = `TRF-${year}-`;

    // Find the latest transfer for this year (excluding deleted)
    // Sort by createdAt descending to get the latest
    const sortedTransfers = await this.repository.find(
      {
        transferNumber: new RegExp(
          `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`
        ),
        isDeleted: false,
      },
      {
        sort: { createdAt: -1 },
        limit: 1,
      }
    );

    let sequence = 1;
    if (sortedTransfers.length > 0) {
      const latest = sortedTransfers[0];
      if (latest.transferNumber) {
        // Extract sequence number from format: TRF-YYYY-NNNN
        const parts = latest.transferNumber.split("-");
        if (parts.length === 3) {
          const latestSequence = parseInt(parts[2], 10);
          if (!isNaN(latestSequence)) {
            sequence = latestSequence + 1;
          }
        }
      }
    }

    // Format: TRF-YYYY-NNNN (e.g., TRF-2024-0001)
    return `${prefix}${sequence.toString().padStart(4, "0")}`;
  }

  /**
   * Create new transfer (supports both GRN → Warehouse and Warehouse → Storefront)
   * @param {Object} data - Request data (supports legacy field names: grnId, sourceWarehouseId)
   * @param {Object} user - Authenticated user object (contains _id)
   * @param {mongoose.ClientSession} session - MongoDB session for transaction (optional)
   * @returns {Promise<TransferResponseDTO>} Created transfer DTO
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If source/destination not found
   */
  async createTransfer(data, user, session = null) {
    // Support legacy field names for backward compatibility
    const {
      sourceType,
      grnId, // Legacy: For GRN → Warehouse transfers
      sourceWarehouseId, // Legacy: For Warehouse → Storefront transfers
      destinationWarehouseId,
      destinationStorefrontId,
      lineItems,
      lineitems, // Support lowercase
      transferDate,
      notes,
    } = data;

    // Use lineItems (camelCase) or fallback to lineitems (lowercase)
    const transferLineItems = lineItems || lineitems;

    // Determine sourceType if not provided (backward compatibility: default to GRN)
    const transferSourceType = sourceType || (grnId ? TRANSFER_SOURCE_TYPE.GRN : null);

    // Validate sourceType
    if (
      !transferSourceType ||
      !Object.values(TRANSFER_SOURCE_TYPE).includes(transferSourceType)
    ) {
      throw new ValidationError(
        "sourceType is required and must be 'GRN' or 'Warehouse'",
        TRANSFER_FIELDS.SOURCE_TYPE
      );
    }

    let sourceId;
    let destinationId;

    // Handle GRN → Warehouse transfer
    if (transferSourceType === TRANSFER_SOURCE_TYPE.GRN) {
      if (!grnId) {
        throw new ValidationError(
          "grnId is required for GRN transfers",
          "grnId"
        );
      }
      if (!mongoose.Types.ObjectId.isValid(grnId)) {
        throw new CastError("Invalid GRN ID format", "grnId");
      }
      if (!destinationWarehouseId) {
        throw new ValidationError(
          "destinationWarehouseId is required for GRN → Warehouse transfers",
          TRANSFER_FIELDS.DESTINATION_WAREHOUSE_ID
        );
      }
      if (!mongoose.Types.ObjectId.isValid(destinationWarehouseId)) {
        throw new CastError("Invalid destination warehouse ID format", TRANSFER_FIELDS.DESTINATION_WAREHOUSE_ID);
      }
      sourceId = grnId;
      destinationId = destinationWarehouseId;

      // Validate GRN exists and is valid
      const grn = await GoodsRecievedNote.findById(sourceId).lean();
      if (!grn) {
        throw new NotFoundError("GRN", sourceId);
      }
      if (grn.isDeleted) {
        throw new ValidationError("Cannot create transfer from deleted GRN", TRANSFER_FIELDS.SOURCE_ID);
      }
      if (grn.status !== "partial" && grn.status !== "verified") {
        throw new ValidationError(
          `Cannot create transfer from GRN with status '${grn.status}'. Only GRNs with status 'partial' or 'verified' can have transfers created.`,
          TRANSFER_FIELDS.SOURCE_ID
        );
      }
      if (!grn.lineItems || grn.lineItems.length === 0) {
        throw new ValidationError("GRN has no line items", TRANSFER_FIELDS.SOURCE_ID);
      }

      // Validate destination warehouse exists
      const warehouse = await LocationProfile.findOne({
        _id: destinationId,
        type: "warehouse",
      });
      if (!warehouse) {
        throw new NotFoundError("Destination warehouse", destinationId);
      }
      if (warehouse.isDeleted) {
        throw new ValidationError("Cannot transfer to deleted warehouse", TRANSFER_FIELDS.DESTINATION_WAREHOUSE_ID);
      }
    }
    // Handle Warehouse → Storefront transfer
    else if (transferSourceType === TRANSFER_SOURCE_TYPE.WAREHOUSE) {
      if (!sourceWarehouseId) {
        throw new ValidationError(
          "sourceWarehouseId is required for Warehouse → Storefront transfers",
          "sourceWarehouseId"
        );
      }
      if (!mongoose.Types.ObjectId.isValid(sourceWarehouseId)) {
        throw new CastError("Invalid source warehouse ID format", "sourceWarehouseId");
      }
      if (!destinationStorefrontId) {
        throw new ValidationError(
          "destinationStorefrontId is required for Warehouse → Storefront transfers",
          TRANSFER_FIELDS.DESTINATION_STOREFRONT_ID
        );
      }
      if (!mongoose.Types.ObjectId.isValid(destinationStorefrontId)) {
        throw new CastError("Invalid destination storefront ID format", TRANSFER_FIELDS.DESTINATION_STOREFRONT_ID);
      }
      sourceId = sourceWarehouseId;
      destinationId = destinationStorefrontId;

      // Validate source warehouse exists
      const sourceWarehouse = await LocationProfile.findOne({
        _id: sourceId,
        type: "warehouse",
      });
      if (!sourceWarehouse) {
        throw new NotFoundError("Source warehouse", sourceId);
      }
      if (sourceWarehouse.isDeleted) {
        throw new ValidationError("Cannot create transfer from deleted warehouse", TRANSFER_FIELDS.SOURCE_ID);
      }

      // Validate destination storefront exists
      const storefront = await LocationProfile.findOne({
        _id: destinationId,
        type: "storefront",
      });
      if (!storefront) {
        throw new NotFoundError("Destination storefront", destinationId);
      }
      if (storefront.isDeleted) {
        throw new ValidationError("Cannot transfer to deleted storefront", TRANSFER_FIELDS.DESTINATION_STOREFRONT_ID);
      }
    }

    // Validate lineItems
    if (
      !transferLineItems ||
      !Array.isArray(transferLineItems) ||
      transferLineItems.length === 0
    ) {
      throw new ValidationError(
        "Line items are required and must be a non-empty array",
        TRANSFER_FIELDS.LINE_ITEMS
      );
    }

    // Validate and process line items
    const validatedLineItems = [];

    for (const userItem of transferLineItems) {
      // Validate required fields
      if (!userItem.productCode && !userItem.inventoryId) {
        throw new ValidationError(
          "Each line item must have productCode or inventoryId",
          TRANSFER_FIELDS.LINE_ITEMS
        );
      }

      if (userItem.quantity === undefined || userItem.quantity === null) {
        throw new ValidationError(
          "Transfer quantity is required for all line items",
          TRANSFER_FIELDS.LINE_ITEMS
        );
      }

      if (typeof userItem.quantity !== "number" || userItem.quantity <= 0) {
        throw new ValidationError(
          "Transfer quantity must be a positive number greater than 0",
          TRANSFER_FIELDS.LINE_ITEMS
        );
      }

      // Lookup inventory by productCode or use inventoryId
      let inventory;
      if (userItem.inventoryId) {
        if (!mongoose.Types.ObjectId.isValid(userItem.inventoryId)) {
          throw new CastError("Invalid inventory ID format", TRANSFER_FIELDS.LINE_ITEMS);
        }
        inventory = await Inventory.findById(userItem.inventoryId).lean();
      } else {
        inventory = await Inventory.findOne({
          productCode: userItem.productCode.toUpperCase(),
        }).lean();
      }

      if (!inventory) {
        throw new NotFoundError(
          `Product with code '${userItem.productCode || userItem.inventoryId}'`,
          userItem.productCode || userItem.inventoryId
        );
      }

      const inventoryIdValue = inventory._id;

      // Validate based on transfer type
      if (transferSourceType === TRANSFER_SOURCE_TYPE.GRN) {
        // Fetch GRN again for line item validation
        const grn = await GoodsRecievedNote.findById(sourceId).lean();

        // Find corresponding GRN line item by inventoryId
        const grnLineItem = grn.lineItems.find(
          (item) => item.inventoryId.toString() === inventoryIdValue.toString()
        );

        if (!grnLineItem) {
          throw new ValidationError(
            `GRN does not contain product with code '${userItem.productCode || inventoryIdValue}'. Please ensure the product exists in the GRN line items.`,
            TRANSFER_FIELDS.LINE_ITEMS
          );
        }

        // Calculate available quantity from GRN line item
        const goodQuantity = grnLineItem.goodQuantity || 0;
        const transferredQuantity = grnLineItem.transferredQuantity || 0;
        const availableQuantity = goodQuantity - transferredQuantity;

        // Validate transfer quantity doesn't exceed available quantity
        if (userItem.quantity > availableQuantity) {
          throw new ValidationError(
            `Transfer quantity (${userItem.quantity}) exceeds available quantity (${availableQuantity}) for product '${userItem.productCode || inventoryIdValue}'. Available quantity = goodQuantity (${goodQuantity}) - transferredQuantity (${transferredQuantity})`,
            TRANSFER_FIELDS.LINE_ITEMS
          );
        }

        // Build validated line item for GRN transfer
        validatedLineItems.push({
          inventoryId: inventoryIdValue,
          quantity: userItem.quantity,
          grnLineItemId: grnLineItem._id, // Link to GRN line item for tracking
          notes: userItem.notes || null,
        });
      } else if (transferSourceType === TRANSFER_SOURCE_TYPE.WAREHOUSE) {
        // Validate warehouse has sufficient stock
        const warehouseStock = await WarehouseStock.findOne({
          inventoryId: inventoryIdValue,
          warehouseId: sourceId,
        }).lean();

        if (!warehouseStock) {
          throw new NotFoundError(
            `Warehouse stock for product '${userItem.productCode || inventoryIdValue}' in source warehouse`,
            inventoryIdValue
          );
        }

        const availableQuantity = warehouseStock.quantity || 0;
        if (userItem.quantity > availableQuantity) {
          throw new ValidationError(
            `Transfer quantity (${userItem.quantity}) exceeds available warehouse stock (${availableQuantity}) for product '${userItem.productCode || inventoryIdValue}'`,
            TRANSFER_FIELDS.LINE_ITEMS
          );
        }

        // Build validated line item for Warehouse transfer
        validatedLineItems.push({
          inventoryId: inventoryIdValue,
          quantity: userItem.quantity,
          notes: userItem.notes || null,
          // No grnLineItemId for Warehouse → Storefront transfers
        });
      }
    }

    // Validate and ensure inventory items exist in destination
    // This ensures we can catch errors early and provide clear error messages
    try {
      if (transferSourceType === TRANSFER_SOURCE_TYPE.GRN) {
        // For GRN → Warehouse: Ensure inventory items exist in destination warehouse
        for (const lineItem of validatedLineItems) {
          const existingWarehouseStock = await WarehouseStock.findOne({
            inventoryId: lineItem.inventoryId,
            warehouseId: destinationId,
          });

          if (!existingWarehouseStock) {
            // Create warehouse stock record with quantity 0 if it doesn't exist
            try {
              await WarehouseStock.create({
                inventoryId: lineItem.inventoryId,
                warehouseId: destinationId,
                quantity: 0,
              });
            } catch (error) {
              // If creation fails, return detailed error
              const inventory = await Inventory.findById(lineItem.inventoryId);
              const productCode = inventory?.productCode || lineItem.inventoryId;
              throw new ValidationError(
                `Failed to create inventory record for product '${productCode}' in destination warehouse. ${error.message}`,
                TRANSFER_FIELDS.LINE_ITEMS
              );
            }
          }
        }
      } else if (transferSourceType === TRANSFER_SOURCE_TYPE.WAREHOUSE) {
        // For Warehouse → Storefront: Ensure inventory items exist in destination storefront
        for (const lineItem of validatedLineItems) {
          const existingStorefrontInventory = await StorefrontInventory.findOne({
            inventoryId: lineItem.inventoryId,
            storefrontId: destinationId,
          });

          if (!existingStorefrontInventory) {
            // Create storefront inventory record with quantity 0 if it doesn't exist
            try {
              await StorefrontInventory.create({
                inventoryId: lineItem.inventoryId,
                storefrontId: destinationId,
                quantity: 0,
              });
            } catch (error) {
              // If creation fails, return detailed error
              const inventory = await Inventory.findById(lineItem.inventoryId);
              const productCode = inventory?.productCode || lineItem.inventoryId;
              throw new ValidationError(
                `Failed to create inventory record for product '${productCode}' in destination storefront. ${error.message}`,
                TRANSFER_FIELDS.LINE_ITEMS
              );
            }
          }
        }
      }
    } catch (error) {
      // Re-throw ValidationError, wrap others
      if (error instanceof ValidationError) {
        throw error;
      }
      // Catch any unexpected errors during validation
      throw new ValidationError(
        `Error validating destination inventory: ${error.message}`,
        TRANSFER_FIELDS.LINE_ITEMS
      );
    }

    // Prepare transfer data
    const transferData = {
      sourceType: transferSourceType,
      sourceId,
      lineItems: validatedLineItems,
      transferDate: transferDate || new Date(),
      notes: notes || null,
      status: TRANSFER_STATUS.COMPLETED, // Set to completed immediately since we transfer stock now
      transferredBy: user._id,
    };

    // Add destination based on transfer type
    if (transferSourceType === TRANSFER_SOURCE_TYPE.GRN) {
      transferData.destinationWarehouseId = destinationId;
    } else if (transferSourceType === TRANSFER_SOURCE_TYPE.WAREHOUSE) {
      transferData.destinationStorefrontId = destinationId;
    }

    // Generate transfer number
    transferData.transferNumber = await this.generateTransferNumber();

    // Use MongoDB transaction to ensure ACID properties
    const transactionSession = session || await mongoose.startSession();
    if (!session) {
      transactionSession.startTransaction();
    }

    try {
      // Create transfer document within transaction
      const newTransferArray = await Transfer.create([transferData], { session: transactionSession });
      const newTransfer = newTransferArray[0];

      // Immediately transfer stock atomically
      await this.updateStock(newTransfer._id.toString(), transactionSession);

      // Set receivedDate since transfer is completed
      newTransfer.receivedDate = new Date();
      await newTransfer.save({ session: transactionSession });

      // Commit transaction if we started it
      if (!session) {
        await transactionSession.commitTransaction();
        await transactionSession.endSession();
      }

      // Return DTO
      return new TransferResponseDTO(newTransfer);
    } catch (error) {
      // Rollback transaction on error if we started it
      if (!session) {
        await transactionSession.abortTransaction();
        await transactionSession.endSession();
      }
      throw error;
    }
  }

  /**
   * Get all transfers (matches legacy behavior - no pagination)
   * @param {Object} queryParams - Query parameters (unused, kept for consistency)
   * @returns {Promise<TransferResponseDTO[]>} Array of transfer DTOs
   */
  async getAllTransfers(queryParams = {}) {
    // Build query (no filters - return all transfers like legacy)
    const query = {};

    // Execute query - fetch all transfers (legacy behavior)
    const transfers = await this.repository.find(query, {
      populate: {
        transferredBy: "name role",
        lineItems: "productName productCode SKU",
      },
    });

    // Return array of DTOs (not paginated, matching legacy)
    return transfers.map((transfer) => new TransferResponseDTO(transfer));
  }

  /**
   * Get transfer by ID
   * @param {string} id - Transfer ID
   * @returns {Promise<TransferResponseDTO>} Transfer DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If transfer not found
   */
  async getTransferById(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid transfer ID format", "id");
    }

    // Find transfer
    const transfer = await this.repository.findById(id, {
      transferredBy: "name role",
      lineItems: "productName productCode SKU",
    });

    if (!transfer) {
      throw new NotFoundError("Transfer", id);
    }

    // Populate source and destination based on transfer type
    if (transfer.sourceType === TRANSFER_SOURCE_TYPE.GRN) {
      await transfer.populate("sourceId", "grnNumber status");
      await transfer.populate(
        "destinationWarehouseId",
        "locationName locationCode"
      );
    } else if (transfer.sourceType === TRANSFER_SOURCE_TYPE.WAREHOUSE) {
      await transfer.populate("sourceId", "locationName locationCode");
      await transfer.populate(
        "destinationStorefrontId",
        "locationName locationCode"
      );
    }

    // Return DTO
    return new TransferResponseDTO(transfer);
  }

  /**
   * Update transfer
   * @param {string} id - Transfer ID
   * @param {Object} data - Update data
   * @returns {Promise<TransferResponseDTO>} Updated transfer DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If transfer not found
   * @throws {ValidationError} If validation fails
   */
  async updateTransfer(id, data) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid transfer ID format", "id");
    }

    // Check if transfer exists
    const existingTransfer = await this.repository.findById(id);
    if (!existingTransfer || existingTransfer.isDeleted) {
      throw new NotFoundError("Transfer", id);
    }

    // Transform data using DTO
    const dto = new UpdateTransferDTO(data);
    const updateData = dto.toUpdateModel();

    // Apply updates to the existing document and save
    const updatedTransfer = await this.repository.findByIdAndSave(id, (doc) => {
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          doc[key] = updateData[key];
        }
      });
    });

    // Return DTO
    return new TransferResponseDTO(updatedTransfer);
  }

  /**
   * Update transfer status
   * Uses MongoDB transaction to ensure ACID properties when completing transfer
   * @param {string} id - Transfer ID
   * @param {string} status - New status (pending, in-transit, completed, cancelled)
   * @param {mongoose.ClientSession} session - MongoDB session for transaction (optional)
   * @returns {Promise<TransferResponseDTO>} Updated transfer DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If transfer not found
   * @throws {ValidationError} If status is invalid or validation fails
   */
  async updateTransferStatus(id, status, session = null) {
    // Validate status is provided
    if (!status) {
      throw new ValidationError("Status is required", TRANSFER_FIELDS.STATUS);
    }

    // Validate status is valid
    const validStatuses = Object.values(TRANSFER_STATUS);
    if (!validStatuses.includes(status)) {
      throw new ValidationError(
        `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
        TRANSFER_FIELDS.STATUS
      );
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid transfer ID format", "id");
    }

    // Use MongoDB transaction to ensure ACID properties when completing transfer
    const transactionSession = session || await mongoose.startSession();
    if (!session) {
      transactionSession.startTransaction();
    }

    try {
      // Update transfer status (legacy behavior: does NOT set receivedDate)
      const updatedTransfer = await this.repository.findByIdAndUpdate(
        id,
        {
          [TRANSFER_FIELDS.STATUS]: status,
        },
        { new: true, session: transactionSession }
      );

      if (!updatedTransfer) {
        if (!session) {
          await transactionSession.abortTransaction();
          await transactionSession.endSession();
        }
        throw new NotFoundError("Transfer", id);
      }

      // When status is "completed", update stock atomically
      // (handles both GRN → Warehouse and Warehouse → Storefront)
      if (status === TRANSFER_STATUS.COMPLETED) {
        await this.updateStock(id, transactionSession);
      }

      // Commit transaction if we started it
      if (!session) {
        await transactionSession.commitTransaction();
        await transactionSession.endSession();
      }

      // Refetch transfer with populated references for response
      const populatedTransfer = await this.repository.findById(id, {
        transferredBy: "name role",
        lineItems: "productName productCode SKU",
      });

      // Populate source and destination based on transfer type
      if (populatedTransfer.sourceType === TRANSFER_SOURCE_TYPE.GRN) {
        await populatedTransfer.populate("sourceId", "grnNumber status");
        await populatedTransfer.populate(
          "destinationWarehouseId",
          "locationName locationCode"
        );
      } else if (populatedTransfer.sourceType === TRANSFER_SOURCE_TYPE.WAREHOUSE) {
        await populatedTransfer.populate("sourceId", "locationName locationCode");
        await populatedTransfer.populate(
          "destinationStorefrontId",
          "locationName locationCode"
        );
      }

      // Return DTO
      return new TransferResponseDTO(populatedTransfer);
    } catch (error) {
      // Rollback transaction on error if we started it
      if (!session) {
        await transactionSession.abortTransaction();
        await transactionSession.endSession();
      }
      throw error;
    }
  }

  /**
   * Update stock atomically when transfer is completed
   * Uses MongoDB transactions to ensure ACID properties for consistent tracking:
   * For GRN → Warehouse: Updates GRN transferredQuantity + WarehouseStock
   * For Warehouse → Storefront: Updates WarehouseStock + StorefrontInventory
   * All operations succeed or all fail (ACID guarantee)
   * @param {string} id - Transfer ID
   * @param {mongoose.ClientSession} session - MongoDB session for transaction (optional)
   * @returns {Promise<TransferResponseDTO>} Updated transfer DTO
   * @throws {NotFoundError} If transfer not found
   * @throws {ValidationError} If transfer is not completed or validation fails
   */
  async updateStock(id, session = null) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid transfer ID format", "id");
    }

    // Find transfer
    const transfer = await this.repository.findById(id);
    if (!transfer || transfer.isDeleted) {
      throw new NotFoundError("Transfer", id);
    }

    // Business logic: Transfer must be completed before updating stock
    if (transfer.status !== TRANSFER_STATUS.COMPLETED) {
      throw new ValidationError(
        "Transfer must be completed before updating stock",
        TRANSFER_FIELDS.STATUS
      );
    }

    // Validate destination based on sourceType
    if (
      transfer.sourceType === TRANSFER_SOURCE_TYPE.GRN &&
      !transfer.destinationWarehouseId
    ) {
      throw new ValidationError(
        "GRN transfers require destinationWarehouseId",
        TRANSFER_FIELDS.DESTINATION_WAREHOUSE_ID
      );
    }

    if (
      transfer.sourceType === TRANSFER_SOURCE_TYPE.WAREHOUSE &&
      !transfer.destinationStorefrontId
    ) {
      throw new ValidationError(
        "Warehouse transfers require destinationStorefrontId",
        TRANSFER_FIELDS.DESTINATION_STOREFRONT_ID
      );
    }

    // Handle GRN → Warehouse transfers
    if (transfer.sourceType === TRANSFER_SOURCE_TYPE.GRN) {
      await this._updateGRNToWarehouseStock(transfer, session);
    }
    // Handle Warehouse → Storefront transfers
    else if (transfer.sourceType === TRANSFER_SOURCE_TYPE.WAREHOUSE) {
      await this._updateWarehouseToStorefrontStock(transfer, session);
    }

    // Return updated transfer DTO
    const updatedTransfer = await this.repository.findById(id);
    return new TransferResponseDTO(updatedTransfer);
  }

  /**
   * Private method: Handle GRN → Warehouse stock updates
   * @param {Object} transfer - Transfer document
   * @param {mongoose.ClientSession} session - MongoDB session for transaction (optional)
   * @private
   */
  async _updateGRNToWarehouseStock(transfer, session = null) {
    const WarehouseStock = mongoose.model("WarehouseStock");
    const GoodsRecievedNote = mongoose.model("GoodsRecievedNote");

    // Fetch GRN to validate and update
    const grn = await GoodsRecievedNote.findById(transfer.sourceId).session(
      session || null
    );

    if (!grn) {
      throw new NotFoundError("GRN", transfer.sourceId);
    }

    // Process each transfer line item
    for (const transferItem of transfer.lineItems) {
      if (transferItem.quantity <= 0) continue;

      // Find corresponding GRN line item
      let grnLineItem = null;
      let grnLineItemIndex = -1;
      if (transferItem.grnLineItemId) {
        // If grnLineItemId is provided, use it directly
        grnLineItem = grn.lineItems.id(transferItem.grnLineItemId);
        if (grnLineItem) {
          grnLineItemIndex = grn.lineItems.findIndex(
            (item) =>
              item._id.toString() === transferItem.grnLineItemId.toString()
          );
        }
      } else {
        // Otherwise, find by inventoryId
        grnLineItemIndex = grn.lineItems.findIndex(
          (item) =>
            item.inventoryId.toString() === transferItem.inventoryId.toString()
        );
        if (grnLineItemIndex !== -1) {
          grnLineItem = grn.lineItems[grnLineItemIndex];
        }
      }

      if (!grnLineItem || grnLineItemIndex === -1) {
        throw new ValidationError(
          `GRN line item not found for inventory ${transferItem.inventoryId}`,
          TRANSFER_FIELDS.LINE_ITEMS
        );
      }

      // Validate available quantity
      const availableQty =
        grnLineItem.goodQuantity - (grnLineItem.transferredQuantity || 0);
      if (transferItem.quantity > availableQty) {
        throw new ValidationError(
          `Transfer quantity (${transferItem.quantity}) exceeds available quantity (${availableQty}) for inventory ${transferItem.inventoryId}`,
          TRANSFER_FIELDS.LINE_ITEMS
        );
      }

      // Update GRN line item's transferredQuantity atomically using $inc
      // Uses positional operator $ to update the specific line item
      const grnUpdateResult = await GoodsRecievedNote.findOneAndUpdate(
        { _id: transfer.sourceId, "lineItems._id": grnLineItem._id },
        {
          $inc: {
            [`lineItems.$.transferredQuantity`]: transferItem.quantity,
          },
        },
        { new: true, session }
      );

      if (!grnUpdateResult) {
        throw new ValidationError(
          `GRN line item with ID ${grnLineItem._id} not found or GRN not found`,
          TRANSFER_FIELDS.LINE_ITEMS
        );
      }

      // Find or create warehouse stock record and update atomically using $inc
      // Uses upsert to create if doesn't exist, or update if exists
      await WarehouseStock.findOneAndUpdate(
        {
          inventoryId: transferItem.inventoryId,
          warehouseId: transfer.destinationWarehouseId,
        },
        {
          $inc: { quantity: transferItem.quantity },
          $set: { lastUpdated: new Date() },
          $setOnInsert: {
            inventoryId: transferItem.inventoryId,
            warehouseId: transfer.destinationWarehouseId,
          },
        },
        {
          upsert: true,
          session,
          new: true,
          runValidators: true,
        }
      );
    }
  }

  /**
   * Private method: Handle Warehouse → Storefront stock updates
   * @param {Object} transfer - Transfer document
   * @param {mongoose.ClientSession} session - MongoDB session for transaction (optional)
   * @private
   */
  async _updateWarehouseToStorefrontStock(transfer, session = null) {
    const WarehouseStock = mongoose.model("WarehouseStock");
    const StorefrontInventory = mongoose.model("StorefrontInventory");
    const LocationProfile = mongoose.model("LocationProfile");

    // Validate source warehouse exists
    const sourceWarehouse = await LocationProfile.findOne({
      _id: transfer.sourceId,
      type: "warehouse",
    }).session(session || null);

    if (!sourceWarehouse) {
      throw new NotFoundError("Source warehouse", transfer.sourceId);
    }

    // Process each transfer line item
    for (const transferItem of transfer.lineItems) {
      if (transferItem.quantity <= 0) continue;

      // Validate warehouse has sufficient stock
      const warehouseStock = await WarehouseStock.findOne({
        inventoryId: transferItem.inventoryId,
        warehouseId: transfer.sourceId,
      }).session(session || null);

      if (!warehouseStock) {
        throw new ValidationError(
          `Warehouse stock not found for inventory ${transferItem.inventoryId} in warehouse ${transfer.sourceId}`,
          TRANSFER_FIELDS.LINE_ITEMS
        );
      }

      const availableQty = warehouseStock.quantity || 0;
      if (transferItem.quantity > availableQty) {
        throw new ValidationError(
          `Transfer quantity (${transferItem.quantity}) exceeds available warehouse stock (${availableQty}) for inventory ${transferItem.inventoryId}`,
          TRANSFER_FIELDS.LINE_ITEMS
        );
      }

      // Deduct from warehouse stock atomically using $inc
      await WarehouseStock.findOneAndUpdate(
        {
          inventoryId: transferItem.inventoryId,
          warehouseId: transfer.sourceId,
        },
        {
          $inc: { quantity: -transferItem.quantity }, // Negative to deduct
          $set: { lastUpdated: new Date() },
        },
        {
          session,
          new: true,
          runValidators: true,
        }
      );

      // Add to storefront inventory atomically using $inc
      await StorefrontInventory.findOneAndUpdate(
        {
          inventoryId: transferItem.inventoryId,
          storefrontId: transfer.destinationStorefrontId,
        },
        {
          $inc: { quantity: transferItem.quantity },
          $set: { lastUpdated: new Date() },
          $setOnInsert: {
            inventoryId: transferItem.inventoryId,
            storefrontId: transfer.destinationStorefrontId,
          },
        },
        {
          upsert: true,
          session,
          new: true,
          runValidators: true,
        }
      );
    }
  }

  /**
   * Backward compatibility: Keep old method name that calls new method
   * @param {string} id - Transfer ID
   * @param {mongoose.ClientSession} session - MongoDB session for transaction (optional)
   * @returns {Promise<TransferResponseDTO>} Updated transfer DTO
   */
  async updateWarehouseStock(id, session = null) {
    return this.updateStock(id, session);
  }

  /**
   * Complete transfer (update status to completed and update stock)
   * @param {string} id - Transfer ID
   * @param {mongoose.ClientSession} session - MongoDB session for transaction (optional)
   * @returns {Promise<TransferResponseDTO>} Updated transfer DTO
   * @throws {NotFoundError} If transfer not found
   * @throws {ValidationError} If validation fails
   */
  async completeTransfer(id, session = null) {
    // Update status to completed
    const updatedTransfer = await this.updateTransfer(id, {
      status: TRANSFER_STATUS.COMPLETED,
      receivedDate: new Date(),
    });

    // Update stock atomically
    await this.updateStock(id, session);

    return updatedTransfer;
  }
}

export default TransferService;
