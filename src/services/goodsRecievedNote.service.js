/**
 * Goods Received Note (GRN) Service
 * Business logic layer for GRN operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { GoodsRecievedNoteRepository } from "../repositories/goodsRecievedNote.repository.js";
import { PurchasingRepository } from "../repositories/purchasing.repository.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";
import {
  CreateGRNDTO,
  UpdateGRNDTO,
  GRNResponseDTO,
  GRNListResponseDTO,
} from "../dtos/goodsRecievedNote.dto.js";
import {
  ValidationError,
  NotFoundError,
  CastError,
} from "../errors/errorTypes.js";
import {
  GRN_FIELDS,
  GRN_STATUS,
  GRN_LINE_ITEM_FIELDS,
} from "../types/goodsRecievedNote.types.js";
import mongoose from "mongoose";
import { createDateFilter } from "../shared/utils/dateFilter.utils.js";
import CustomError from "../shared/utils/customError.js";
import { generateSequentialNumber } from "../shared/utils/generateSequentialNumber.utils.js";

export class GoodsRecievedNoteService {
  /**
   * @param {GoodsRecievedNoteRepository} repository - Injected repository instance (optional, fallback creates new instance)
   * @param {PurchasingRepository} purchasingRepository - Injected purchasing repository instance
   * @param {InventoryRepository} inventoryRepository - Injected inventory repository instance
   */
  constructor(repository, purchasingRepository, inventoryRepository) {
    this.repository = repository || new GoodsRecievedNoteRepository();
    this.purchasingRepository =
      purchasingRepository || new PurchasingRepository();
    this.inventoryRepository = inventoryRepository || new InventoryRepository();
  }

  /**
   * Generate GRN number
   * Business logic: Generates unique GRN number in format GRN-YYYY-MM-DD-NNNNNN
   * @returns {Promise<string>} Generated GRN number
   */
  async generateGRNNumber() {
    return generateSequentialNumber({
      queryFn: async (query, options) => {
        return await this.repository.find(query, {
          ...options,
          limit: 1,
        });
      },
      prefix: "GRN",
      fieldName: "grnNumber",
      sequencePadding: 6,
      dateFormat: "daily",
      additionalFilters: { isDeleted: false },
    });
  }

  /**
   * Create new GRN (Supports Partial GRN - Can receive one or more items from PO)
   * @param {Object} data - Request data (user provides productCode, goodQuantity, badQuantity for each line item)
   * @returns {Promise<GRNResponseDTO>} Created GRN DTO
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If PO or products not found
   */
  async createGRN(data) {
    const { purchasingId, grnDate, lineItems, notes } = data;

    // Validate purchasingId
    if (!purchasingId) {
      throw new ValidationError(
        "Purchase order ID is required",
        GRN_FIELDS.PURCHASING_ID
      );
    }

    if (!mongoose.Types.ObjectId.isValid(purchasingId)) {
      throw new CastError(
        "Invalid purchase order ID format",
        GRN_FIELDS.PURCHASING_ID
      );
    }

    // Fetch PO with products
    const purchaseOrder = await this.purchasingRepository.findById(
      purchasingId,
      { lean: true }
    );
    if (!purchaseOrder) {
      throw new NotFoundError("Purchase order", purchasingId);
    }

    // Validate PO status - only "arrived" status allows GRN creation
    if (purchaseOrder.status !== "arrived") {
      throw new ValidationError(
        `Cannot create GRN for purchase order with status '${purchaseOrder.status}'. Only purchase orders with status 'arrived' can have GRN created.`,
        GRN_FIELDS.PURCHASING_ID
      );
    }

    // Check if PO has products
    if (!purchaseOrder.products || purchaseOrder.products.length === 0) {
      throw new ValidationError(
        "Purchase order has no products",
        GRN_FIELDS.PURCHASING_ID
      );
    }

    // Validate line items (user provides only goodQuantity and badQuantity)
    if (!lineItems || !Array.isArray(lineItems)) {
      throw new ValidationError(
        "Line items are required as an array. Provide goodQuantity and badQuantity for each product from the purchase order.",
        GRN_FIELDS.LINE_ITEMS
      );
    }

    if (lineItems.length === 0) {
      throw new ValidationError(
        "At least one line item is required. Provide goodQuantity and badQuantity for products from the purchase order.",
        GRN_FIELDS.LINE_ITEMS
      );
    }

    // Create a map of user-provided line items by productCode for easy lookup
    const userLineItemsMap = new Map();
    lineItems.forEach((item, index) => {
      if (!item || typeof item !== "object") {
        throw new ValidationError(
          `Line item at index ${index} must be an object`,
          GRN_FIELDS.LINE_ITEMS
        );
      }
      if (!item.productCode) {
        throw new ValidationError(
          `Line item at index ${index} is missing 'productCode'. Each line item must have a productCode to match products from the purchase order.`,
          GRN_FIELDS.LINE_ITEMS
        );
      }
      const productCodeUpper = item.productCode.toUpperCase();
      if (userLineItemsMap.has(productCodeUpper)) {
        throw new ValidationError(
          `Duplicate productCode '${item.productCode}' found in line items. Each product can only appear once per GRN.`,
          GRN_FIELDS.LINE_ITEMS
        );
      }
      userLineItemsMap.set(productCodeUpper, item);
    });

    // Create a map of PO products by productCode for efficient lookup
    const poProductsByCode = new Map();
    purchaseOrder.products.forEach((poProduct) => {
      const code = poProduct.productCode.toUpperCase();
      poProductsByCode.set(code, poProduct);
    });

    // Build GRN line items from user-provided line items (partial GRN support)
    const grnLineItems = [];
    let calculatedTotalAmount = 0;

    // Process only the products that user wants to receive (partial GRN)
    for (const [productCodeUpper, userItem] of userLineItemsMap) {
      // Find the corresponding PO product
      const poProduct = poProductsByCode.get(productCodeUpper);
      if (!poProduct) {
        throw new ValidationError(
          `Product with productCode '${userItem.productCode}' not found in purchase order.`,
          GRN_FIELDS.LINE_ITEMS
        );
      }

      // Get inventoryId from PO product, or look it up by productCode if missing
      let inventoryIdValue = poProduct.inventoryId;

      // If inventoryId is missing, try to find it by productCode
      if (
        !inventoryIdValue ||
        !mongoose.Types.ObjectId.isValid(inventoryIdValue)
      ) {
        const inventoryItem = await this.inventoryRepository.findOne({
          productCode: poProduct.productCode.toUpperCase(),
        });

        if (!inventoryItem) {
          throw new NotFoundError(
            `Inventory item with productCode '${poProduct.productCode}'`,
            poProduct.productCode
          );
        }

        inventoryIdValue = inventoryItem._id;
      }

      // Ensure inventoryId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(inventoryIdValue)) {
        throw new CastError(
          `Invalid inventoryId format for product '${poProduct.productCode}'. Expected valid MongoDB ObjectId.`,
          GRN_FIELDS.LINE_ITEMS
        );
      }

      // Convert to ObjectId
      inventoryIdValue = new mongoose.Types.ObjectId(inventoryIdValue);

      // Validate quantities (user only provides goodQuantity and badQuantity)
      if (
        userItem.goodQuantity === undefined ||
        userItem.badQuantity === undefined
      ) {
        throw new ValidationError(
          `goodQuantity and badQuantity are required for product '${poProduct.productCode}'`,
          GRN_FIELDS.LINE_ITEMS
        );
      }

      if (userItem.goodQuantity < 0 || userItem.badQuantity < 0) {
        throw new ValidationError(
          "Quantities cannot be negative",
          GRN_FIELDS.LINE_ITEMS
        );
      }

      // Calculate receivedQuantity from goodQuantity + badQuantity
      const calculatedReceivedQuantity =
        userItem.goodQuantity + userItem.badQuantity;

      // Check if receivedQuantity is provided in the request (optional)
      const providedReceivedQuantity = userItem.receivedQuantity;

      // Validate that goodQuantity + badQuantity equals receivedQuantity
      let receivedQuantity;
      if (providedReceivedQuantity !== undefined) {
        // If receivedQuantity is provided, validate it matches the sum
        if (
          typeof providedReceivedQuantity !== "number" ||
          providedReceivedQuantity < 0
        ) {
          throw new ValidationError(
            `For product '${poProduct.productCode}' (${poProduct.productName}): receivedQuantity must be a non-negative number.`,
            GRN_FIELDS.LINE_ITEMS
          );
        }

        if (providedReceivedQuantity !== calculatedReceivedQuantity) {
          throw new ValidationError(
            `For product '${poProduct.productCode}' (${poProduct.productName}): Validation failed - goodQuantity (${userItem.goodQuantity}) + badQuantity (${userItem.badQuantity}) = ${calculatedReceivedQuantity}, but receivedQuantity is ${providedReceivedQuantity}. These values must be equal. Please ensure: goodQuantity + badQuantity = receivedQuantity.`,
            GRN_FIELDS.LINE_ITEMS
          );
        }
        // Use the provided receivedQuantity (which matches the calculated value)
        receivedQuantity = providedReceivedQuantity;
      } else {
        // If receivedQuantity is not provided, auto-calculate it
        receivedQuantity = calculatedReceivedQuantity;
      }

      // Explicit validation: Ensure goodQuantity + badQuantity always equals receivedQuantity
      const sumOfGoodAndBad = userItem.goodQuantity + userItem.badQuantity;
      if (receivedQuantity !== sumOfGoodAndBad) {
        throw new ValidationError(
          `For product '${poProduct.productCode}' (${poProduct.productName}): Data integrity validation failed. goodQuantity (${userItem.goodQuantity}) + badQuantity (${userItem.badQuantity}) = ${sumOfGoodAndBad}, but receivedQuantity is ${receivedQuantity}. These values must always be equal. Please ensure: goodQuantity + badQuantity = receivedQuantity.`,
          GRN_FIELDS.LINE_ITEMS
        );
      }

      // Validate that receivedQuantity doesn't exceed remaining purchaseQuantity
      const poPurchaseQuantity = poProduct.purchaseQuantity || 0;
      const poReceivedQuantity = poProduct.receivedQuantity || 0;
      const remainingQuantity = poPurchaseQuantity - poReceivedQuantity;

      // Validate that new receivedQuantity doesn't exceed remaining quantity
      if (receivedQuantity > remainingQuantity) {
        throw new ValidationError(
          `Received quantity (${receivedQuantity}) for product '${poProduct.productCode}' (${poProduct.productName}) exceeds remaining purchase order quantity. Already received: ${poReceivedQuantity}, Remaining: ${remainingQuantity}, Total ordered: ${poPurchaseQuantity}.`,
          GRN_FIELDS.LINE_ITEMS
        );
      }

      // Validate that at least some quantity is being received
      if (receivedQuantity <= 0) {
        throw new ValidationError(
          `Received quantity must be greater than 0 for product '${poProduct.productCode}'.`,
          GRN_FIELDS.LINE_ITEMS
        );
      }

      // Use unitPrice from request or fallback to PO's buyingPrice
      const unitPrice =
        userItem.unitPrice !== undefined
          ? userItem.unitPrice
          : poProduct.buyingPrice;
      if (unitPrice < 0) {
        throw new ValidationError(
          "Unit price cannot be negative",
          GRN_FIELDS.LINE_ITEMS
        );
      }

      // Calculate totalPrice = receivedQuantity * unitPrice
      // You pay for what you receive (good + bad), not just good quantity
      const totalPrice = receivedQuantity * unitPrice;

      // Build line item with all data auto-filled from PO
      const grnLineItem = {
        [GRN_LINE_ITEM_FIELDS.INVENTORY_ID]: inventoryIdValue, // Auto-filled from PO or looked up by productCode
        [GRN_LINE_ITEM_FIELDS.RECEIVED_QUANTITY]: receivedQuantity, // Auto-calculated: goodQuantity + badQuantity
        [GRN_LINE_ITEM_FIELDS.GOOD_QUANTITY]: userItem.goodQuantity, // User provides
        [GRN_LINE_ITEM_FIELDS.BAD_QUANTITY]: userItem.badQuantity, // User provides
        [GRN_LINE_ITEM_FIELDS.UNIT_PRICE]: unitPrice, // Uses PO's buyingPrice if not provided
        [GRN_LINE_ITEM_FIELDS.TOTAL_PRICE]: totalPrice, // Auto-calculated: receivedQuantity * unitPrice
        [GRN_LINE_ITEM_FIELDS.NOTES]: userItem.notes || null,
      };

      grnLineItems.push(grnLineItem);
      calculatedTotalAmount += totalPrice;
    }

    // Generate GRN number
    const grnNumber = await this.generateGRNNumber();

    // Prepare GRN data
    const grnData = {
      [GRN_FIELDS.GRN_NUMBER]: grnNumber,
      [GRN_FIELDS.PURCHASING_ID]: purchasingId,
      [GRN_FIELDS.GRN_DATE]: grnDate || new Date(),
      [GRN_FIELDS.LINE_ITEMS]: grnLineItems,
      [GRN_FIELDS.NOTES]: notes || null,
      [GRN_FIELDS.TOTAL_AMOUNT]: calculatedTotalAmount, // Auto-calculated
      [GRN_FIELDS.STATUS]: GRN_STATUS.PENDING,
    };

    // Create GRN
    const newGRN = await this.repository.create(grnData);

    // Increment receivedQuantity in PO for each product
    // purchaseQuantity remains unchanged (preserves original order quantity)
    // receivedQuantity tracks total received from all GRNs
    for (const grnLineItem of grnLineItems) {
      // First, increment receivedQuantity
      await Purchasing.updateOne(
        {
          _id: purchasingId,
          "products.inventoryId":
            grnLineItem[GRN_LINE_ITEM_FIELDS.INVENTORY_ID],
        },
        {
          $inc: {
            "products.$.receivedQuantity":
              grnLineItem[GRN_LINE_ITEM_FIELDS.RECEIVED_QUANTITY],
          },
        }
      );
    }

    // After updating all receivedQuantities, fetch the updated PO to check status updates
    const updatedPO = await this.purchasingRepository.findById(purchasingId, {
      lean: true,
    });

    // Check ALL products in the PO to ensure their status is correct
    // This handles cases where multiple GRNs might affect different products
    for (const product of updatedPO.products) {
      const purchaseQty = product.purchaseQuantity || 0;
      const receivedQty = product.receivedQuantity || 0;
      const currentStatus = product.productStatus;

      // If purchaseQuantity equals receivedQuantity, status should be "seperated"
      if (purchaseQty === receivedQty && currentStatus !== "seperated") {
        await Purchasing.updateOne(
          {
            _id: purchasingId,
            "products.inventoryId": product.inventoryId,
          },
          {
            $set: {
              "products.$.productStatus": "seperated",
            },
          }
        );
      }
      // If purchaseQuantity does NOT equal receivedQuantity, status should be "pending"
      else if (purchaseQty !== receivedQty && currentStatus !== "pending") {
        await Purchasing.updateOne(
          {
            _id: purchasingId,
            "products.inventoryId": product.inventoryId,
          },
          {
            $set: {
              "products.$.productStatus": "pending",
            },
          }
        );
      }
    }

    // Populate references for response
    await newGRN.populate("purchasingId", "status totalAmount");
    await newGRN.populate(
      "lineItems.inventoryId",
      "productName productCode SKU sellingPrice"
    );

    // Return DTO
    return new GRNResponseDTO(newGRN);
  }

  /**
   * Get all GRNs with pagination and filters
   * @param {Object} queryParams - Query parameters (page, limit, purchasingId, status, search, sortBy, sortOrder, includeDeleted, startDate, endDate)
   * @returns {Promise<GRNListResponseDTO>} List of GRN DTOs with pagination
   */
  async getAllGRN(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      purchasingId,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDeleted = false,
    } = queryParams;

    // Build query
    const query = {};

    if (!includeDeleted || includeDeleted === "false") {
      query.isDeleted = false;
    }

    if (purchasingId) {
      if (!mongoose.Types.ObjectId.isValid(purchasingId)) {
        throw new CastError("Invalid purchase order ID format", "purchasingId");
      }
      query[GRN_FIELDS.PURCHASING_ID] = purchasingId;
    }

    if (status) {
      query[GRN_FIELDS.STATUS] = status;
    }

    if (search) {
      query.$or = [
        { [GRN_FIELDS.GRN_NUMBER]: { $regex: search, $options: "i" } },
        { [GRN_FIELDS.NOTES]: { $regex: search, $options: "i" } },
      ];
    }

    // Add date range filter using dateFilter utility
    // Filter by the 'grnDate' field (when the GRN was created/received)
    try {
      const dateFilter = createDateFilter(
        queryParams,
        GRN_FIELDS.GRN_DATE,
        false
      );
      Object.assign(query, dateFilter);
    } catch (error) {
      // If it's a CustomError, wrap it as ValidationError
      if (error instanceof CustomError) {
        throw new ValidationError(error.message, GRN_FIELDS.GRN_DATE);
      }
      // For other errors, wrap and throw
      throw new ValidationError(
        error.message || "Invalid date filter",
        GRN_FIELDS.GRN_DATE
      );
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with population (include sellingPrice for profit calculations)
    const grns = await this.repository.find(query, {
      sort,
      skip,
      limit: limitNum,
      populate: {
        purchasingId: {
          select: "status totalAmount supplierId poNumber",
          populate: {
            path: "supplierId",
            select: "supplierName supplierCode",
          },
        },
        lineItems: "productName productCode SKU buyingPrice sellingPrice",
      },
    });

    // Get total count for pagination
    const total = await this.repository.countDocuments(query);

    // Return list DTO with pagination
    return new GRNListResponseDTO(grns, {
      page: pageNum,
      limit: limitNum,
      total,
    });
  }

  /**
   * Get GRN by ID
   * @param {string} id - GRN ID
   * @returns {Promise<GRNResponseDTO>} GRN DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If GRN not found
   */
  async getGRNById(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid GRN ID format", "id");
    }

    const grn = await this.repository.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!grn) {
      throw new NotFoundError("GRN", id);
    }

    // Populate references
    await grn.populate({
      path: "purchasingId",
      select: "status totalAmount products supplierId poNumber",
      populate: {
        path: "supplierId",
        select: "supplierName supplierCode",
      },
    });
    await grn.populate(
      "lineItems.inventoryId",
      "productName productCode SKU category buyingPrice sellingPrice"
    );

    // Return DTO
    return new GRNResponseDTO(grn);
  }

  /**
   * Update GRN status
   * @param {string} id - GRN ID
   * @param {string} status - New status (pending, partial, verified, rejected)
   * @returns {Promise<GRNResponseDTO>} Updated GRN DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If GRN not found
   * @throws {ValidationError} If status is invalid
   */
  async updateGRNStatus(id, status) {
    // Validate status is provided
    if (!status) {
      throw new ValidationError("Status is required", GRN_FIELDS.STATUS);
    }

    // Validate status is valid
    const validStatuses = Object.values(GRN_STATUS);
    if (!validStatuses.includes(status)) {
      throw new ValidationError(
        `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
        GRN_FIELDS.STATUS
      );
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid GRN ID format", "id");
    }

    // Update GRN status
    const grn = await this.repository.findByIdAndUpdate(
      id,
      { [GRN_FIELDS.STATUS]: status },
      { new: true, runValidators: true }
    );

    if (!grn) {
      throw new NotFoundError("GRN", id);
    }

    // Return DTO
    return new GRNResponseDTO(grn);
  }

  /**
   * Update GRN lineItems (goodQuantity and badQuantity)
   * @param {string} id - GRN ID
   * @param {Array} lineItems - Array of line item updates (each with lineItemId, goodQuantity, badQuantity, notes)
   * @returns {Promise<GRNResponseDTO>} Updated GRN DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If GRN not found
   * @throws {ValidationError} If validation fails
   */
  async updateGRNLineItems(id, lineItems) {
    // Validate GRN ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid GRN ID format", "id");
    }

    // Validate lineItems
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      throw new ValidationError(
        "Line items are required as an array with at least one item.",
        GRN_FIELDS.LINE_ITEMS
      );
    }

    // Find the GRN
    const grn = await this.repository.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!grn) {
      throw new NotFoundError("GRN", id);
    }

    // Validate and update each line item
    for (const updateItem of lineItems) {
      // Validate required fields
      if (!updateItem.lineItemId) {
        throw new ValidationError(
          "lineItemId is required for each line item update.",
          GRN_FIELDS.LINE_ITEMS
        );
      }

      if (
        updateItem.goodQuantity === undefined ||
        updateItem.badQuantity === undefined
      ) {
        throw new ValidationError(
          "goodQuantity and badQuantity are required for each line item update.",
          GRN_FIELDS.LINE_ITEMS
        );
      }

      // Validate quantities are non-negative
      if (updateItem.goodQuantity < 0 || updateItem.badQuantity < 0) {
        throw new ValidationError(
          "goodQuantity and badQuantity cannot be negative.",
          GRN_FIELDS.LINE_ITEMS
        );
      }

      // Find the line item in the GRN
      const lineItem = grn.lineItems.id(updateItem.lineItemId);
      if (!lineItem) {
        throw new ValidationError(
          `Line item with ID ${updateItem.lineItemId} not found in GRN.`,
          GRN_FIELDS.LINE_ITEMS
        );
      }

      // Validate that goodQuantity + badQuantity equals receivedQuantity
      const sumOfGoodAndBad = updateItem.goodQuantity + updateItem.badQuantity;
      if (sumOfGoodAndBad !== lineItem.receivedQuantity) {
        throw new ValidationError(
          `For line item ${updateItem.lineItemId}: goodQuantity (${updateItem.goodQuantity}) + badQuantity (${updateItem.badQuantity}) = ${sumOfGoodAndBad}, but receivedQuantity is ${lineItem.receivedQuantity}. These values must be equal. Please ensure: goodQuantity + badQuantity = receivedQuantity.`,
          GRN_FIELDS.LINE_ITEMS
        );
      }

      // Validate that transferredQuantity doesn't exceed new goodQuantity
      if (updateItem.goodQuantity < lineItem.transferredQuantity) {
        throw new ValidationError(
          `For line item ${updateItem.lineItemId}: Cannot set goodQuantity (${updateItem.goodQuantity}) less than transferredQuantity (${lineItem.transferredQuantity}). Some quantity has already been transferred.`,
          GRN_FIELDS.LINE_ITEMS
        );
      }

      // Update the line item
      lineItem.goodQuantity = updateItem.goodQuantity;
      lineItem.badQuantity = updateItem.badQuantity;

      // Update notes if provided
      if (updateItem.notes !== undefined) {
        lineItem.notes = updateItem.notes || null;
      }

      // Recalculate totalPrice for this line item (totalPrice = goodQuantity * unitPrice)
      // Note: We pay for receivedQuantity, but totalPrice calculation uses goodQuantity
      // Actually, looking at the model, totalPrice is stored per line item
      // The totalPrice should be recalculated based on goodQuantity * unitPrice
      // But wait, in createGRN, totalPrice = receivedQuantity * unitPrice
      // So we need to recalculate totalPrice = receivedQuantity * unitPrice (which equals goodQuantity + badQuantity)
      // Since receivedQuantity doesn't change, totalPrice should remain the same
      // Actually, let me check the legacy logic - it doesn't recalculate totalPrice per line item
      // It only recalculates totalAmount from sum of all lineItems.totalPrice
      // So we don't need to update totalPrice per line item, just the totalAmount
    }

    // Recalculate totalAmount based on updated line items
    // Note: totalPrice per line item doesn't change (it's based on receivedQuantity * unitPrice)
    // But we need to recalculate in case unitPrice changed or if we're updating totalPrice
    // Actually, looking at the legacy code, it just sums up existing totalPrice values
    // So totalPrice per line item remains unchanged (based on receivedQuantity * unitPrice)
    const newTotalAmount = grn.lineItems.reduce(
      (total, item) => total + item.totalPrice,
      0
    );
    grn.totalAmount = newTotalAmount;

    // Save the updated GRN (uses repository)
    await this.repository.save(grn);

    // Populate references for response
    await grn.populate({
      path: "purchasingId",
      select: "status totalAmount supplierId poNumber",
      populate: {
        path: "supplierId",
        select: "supplierName supplierCode",
      },
    });
    await grn.populate(
      "lineItems.inventoryId",
      "productName productCode SKU category buyingPrice sellingPrice"
    );

    // Return DTO
    return new GRNResponseDTO(grn);
  }
}

export default GoodsRecievedNoteService;
