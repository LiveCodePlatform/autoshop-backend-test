/**
 * Order Service
 * Business logic layer for Order operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { OrderRepository } from "../repositories/order.repository.js";
import { StorefrontInventoryRepository } from "../repositories/storefrontInventory.repository.js";
import { LocationProfileRepository } from "../repositories/locationProfile.repository.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";
import { CreditPersonaRepository } from "../repositories/creditPersona.repository.js";
import {
  CreateOrderDTO,
  OrderResponseDTO,
} from "../dtos/order.dto.js";
import { ValidationError, NotFoundError, CastError } from "../errors/errorTypes.js";
import { ORDER_FIELDS } from "../types/order.types.js";
import mongoose from "mongoose";
import { createDateFilter } from "../shared/utils/dateFilter.utils.js";
import CustomError from "../shared/utils/customError.js";
// Models removed - using repositories instead

export class OrderService {
  /**
   * @param {OrderRepository} repository - Injected repository instance (optional, fallback creates new instance)
   * @param {StorefrontInventoryRepository} storefrontInventoryRepository - Injected storefront inventory repository
   * @param {LocationProfileRepository} locationProfileRepository - Injected location profile repository
   * @param {InventoryRepository} inventoryRepository - Injected inventory repository
   * @param {CreditPersonaRepository} creditPersonaRepository - Injected credit persona repository
   */
  constructor(
    repository,
    storefrontInventoryRepository,
    locationProfileRepository,
    inventoryRepository,
    creditPersonaRepository
  ) {
    this.repository = repository || new OrderRepository();
    this.storefrontInventoryRepository =
      storefrontInventoryRepository || new StorefrontInventoryRepository();
    this.locationProfileRepository =
      locationProfileRepository || new LocationProfileRepository();
    this.inventoryRepository = inventoryRepository || new InventoryRepository();
    this.creditPersonaRepository =
      creditPersonaRepository || new CreditPersonaRepository();
  }

  /**
   * Create new order with ACID properties and stock deduction
   * @param {Object} data - Request data
   * @param {Object} user - Authenticated user object (contains _id)
   * @returns {Promise<OrderResponseDTO>} Created order DTO
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If related entities not found
   */
  async createOrder(data, user) {
    const {
      storefrontId,
      ordersProducts,
      subTotal,
      tax = 0,
      discount = 0,
      finalAmount,
      paidAmount,
      paymentType = "paid",
      paymentMethod = "cash",
      creditPersonId,
    } = data;
    const soldBy = user._id;

    // Validate required fields
    if (!storefrontId) {
      throw new ValidationError("Storefront ID is required", "storefrontId");
    }

    if (!mongoose.Types.ObjectId.isValid(storefrontId)) {
      throw new CastError("Invalid storefront ID format", "storefrontId");
    }

    if (
      !ordersProducts ||
      !Array.isArray(ordersProducts) ||
      ordersProducts.length === 0
    ) {
      throw new ValidationError(
        "Order must have at least one product",
        "ordersProducts"
      );
    }

    // Validate paymentType
    const validPaymentTypes = ["credit", "paid"];
    if (paymentType && !validPaymentTypes.includes(paymentType)) {
      throw new ValidationError(
        `Invalid payment type. Allowed values: ${validPaymentTypes.join(", ")}`,
        "paymentType"
      );
    }

    // Validate creditPersonId - only allowed when paymentType is "credit"
    if (creditPersonId) {
      if (!mongoose.Types.ObjectId.isValid(creditPersonId)) {
        throw new CastError("Invalid credit person ID format", "creditPersonId");
      }

      if (paymentType !== "credit") {
        throw new ValidationError(
          "Credit person ID can only be provided when payment type is 'credit'",
          "creditPersonId"
        );
      }
    }

    // Validate product structure
    for (let i = 0; i < ordersProducts.length; i++) {
      const product = ordersProducts[i];

      if (!product.inventoryId) {
        throw new ValidationError(
          `Product at index ${i}: Inventory ID is required`,
          `ordersProducts[${i}].inventoryId`
        );
      }

      if (!mongoose.Types.ObjectId.isValid(product.inventoryId)) {
        throw new CastError(
          `Product at index ${i}: Invalid inventory ID format`,
          `ordersProducts[${i}].inventoryId`
        );
      }

      if (!product.quantity || product.quantity < 1) {
        throw new ValidationError(
          `Product at index ${i}: Quantity must be at least 1`,
          `ordersProducts[${i}].quantity`
        );
      }
    }

    // Validate numeric fields
    if (tax < 0) {
      throw new ValidationError("Tax cannot be negative", "tax");
    }

    if (discount < 0) {
      throw new ValidationError("Discount cannot be negative", "discount");
    }

    if (!paidAmount && paidAmount !== 0) {
      throw new ValidationError("Paid amount is required", "paidAmount");
    }

    if (paidAmount < 0) {
      throw new ValidationError("Paid amount cannot be negative", "paidAmount");
    }

    // Start MongoDB session for transaction
    const session = await mongoose.startSession();

    // Retry logic for handling duplicate order numbers
    const maxRetries = 3;
    let retryCount = 0;
    let orderNumber;
    let orderCreated = false;
    let newOrder;
    let lastError = null;

    try {
      while (retryCount < maxRetries && !orderCreated) {
        try {
          // Generate order number (before transaction to allow retry)
          orderNumber = await this.repository.generateOrderNumber();

          // Start transaction
          await session.withTransaction(async () => {
            // 1. Validate storefront exists and is not deleted
            const storefront = await this.locationProfileRepository.findOne({
              _id: storefrontId,
              type: "storefront",
            });

            if (!storefront) {
              throw new NotFoundError("Storefront");
            }

            if (storefront.isDeleted) {
              throw new ValidationError(
                "Cannot create order for deleted storefront"
              );
            }

            // 1a. Validate credit person exists if creditPersonId is provided
            let creditPerson = null;
            if (creditPersonId) {
              // Validate credit person exists (uses repository with session support)
              creditPerson = await this.creditPersonaRepository.findById(creditPersonId, { session });

              if (!creditPerson) {
                throw new NotFoundError("Credit person");
              }

              // Check if credit person is blacklisted
              if (creditPerson.blacklist) {
                throw new ValidationError(
                  `Cannot create order for blacklisted credit person: ${
                    creditPerson.blacklistReason || "No reason provided"
                  }`
                );
              }
            }

            // 2. Validate all inventory items exist and get their selling prices
            const inventoryIds = ordersProducts.map(
              (p) => new mongoose.Types.ObjectId(p.inventoryId)
            );

            // Use model directly for transaction support
            const inventoryItems = await this.inventoryRepository.find({
              _id: { $in: inventoryIds },
            }).session(session);

            if (inventoryItems.length !== inventoryIds.length) {
              const foundIds = inventoryItems.map((item) => item._id.toString());
              const missingIds = inventoryIds.filter(
                (id) => !foundIds.includes(id.toString())
              );
              throw new NotFoundError(
                `Inventory items not found: ${missingIds.join(", ")}`
              );
            }

            // Map inventory items by ID for easy lookup
            const inventoryMap = new Map();
            inventoryItems.forEach((item) => {
              inventoryMap.set(item._id.toString(), item);
            });

            // 3. Prepare order products with unitPrice from current sellingPrice (snapshot)
            const validatedProducts = [];
            let calculatedSubTotal = 0;

            for (const product of ordersProducts) {
              const inventoryId = new mongoose.Types.ObjectId(
                product.inventoryId
              );
              const inventoryItem = inventoryMap.get(inventoryId.toString());

              if (!inventoryItem) {
                throw new NotFoundError(
                  `Inventory item not found: ${product.inventoryId}`
                );
              }

              if (
                inventoryItem.sellingPrice === undefined ||
                inventoryItem.sellingPrice === null
              ) {
                throw new ValidationError(
                  `Product '${inventoryItem.productCode}' (${inventoryItem.productName}) does not have a selling price set`
                );
              }

              if (inventoryItem.sellingPrice < 0) {
                throw new ValidationError(
                  `Product '${inventoryItem.productCode}' (${inventoryItem.productName}) has an invalid selling price: ${inventoryItem.sellingPrice}`
                );
              }

              // Store current sellingPrice as snapshot unitPrice in order
              const unitPrice = inventoryItem.sellingPrice;
              const productSubTotal = product.quantity * unitPrice;
              calculatedSubTotal += productSubTotal;

              validatedProducts.push({
                inventoryId,
                quantity: product.quantity,
                unitPrice, // Snapshot of current selling price
              });
            }

            // Use provided subTotal or calculated one
            const finalSubTotal =
              subTotal !== undefined && subTotal !== null
                ? subTotal
                : calculatedSubTotal;

            // Calculate finalAmount if not provided
            const calculatedFinalAmount =
              finalAmount !== undefined && finalAmount !== null
                ? finalAmount
                : finalSubTotal + tax - discount;

            if (calculatedFinalAmount < 0) {
              throw new ValidationError("Final amount cannot be negative");
            }

            // 4. Validate stock availability and deduct stock
            for (const product of validatedProducts) {
              // Use model directly for transaction support
              const stockRecord = await this.storefrontInventoryRepository.findOne(
                {
                  inventoryId: product.inventoryId,
                  storefrontId: storefrontId,
                },
                null,
                { session }
              );

              if (!stockRecord) {
                const inventoryItem = inventoryMap.get(
                  product.inventoryId.toString()
                );
                throw new NotFoundError(
                  `Stock record not found for product '${
                    inventoryItem?.productCode || product.inventoryId
                  }' in storefront`
                );
              }

              // Check stock availability
              const availableQuantity = stockRecord.quantity || 0;
              if (availableQuantity < product.quantity) {
                const inventoryItem = inventoryMap.get(
                  product.inventoryId.toString()
                );
                throw new ValidationError(
                  `Insufficient stock for product '${
                    inventoryItem?.productCode || product.inventoryId
                  }' (${
                    inventoryItem?.productName || "Unknown"
                  }). Available: ${availableQuantity}, Requested: ${
                    product.quantity
                  }`
                );
              }

              // Deduct stock - modify document directly and save with session (uses repository)
              stockRecord.quantity -= product.quantity;
              stockRecord.lastUpdated = new Date();
              await this.storefrontInventoryRepository.save(stockRecord, { session });
            }

            // 5. Create order with calculated values
            const orderData = {
              orderNumber,
              storefrontId: new mongoose.Types.ObjectId(storefrontId),
              ordersProducts: validatedProducts,
              creditPersonId: creditPersonId
                ? new mongoose.Types.ObjectId(creditPersonId)
                : null,
              subTotal: finalSubTotal,
              tax,
              discount,
              finalAmount: calculatedFinalAmount,
              paidAmount,
              paymentType: paymentType || "paid",
              paymentMethod: paymentMethod || "cash",
              orderStatus: "completed", // Order is completed when stock is deducted
              soldBy,
            };

            const newOrderArray = await this.repository.create([orderData], {
              session,
            });
            newOrder = newOrderArray[0];

            // 7. Populate references for response (inside transaction for consistency)
            await newOrder.populate("storefrontId", "locationName locationCode");
            await newOrder.populate(
              "ordersProducts.inventoryId",
              "productName productCode SKU"
            );

            // Mark as created successfully
            orderCreated = true;
          });

          // If we reach here, order was created successfully
          // Return DTO
          return new OrderResponseDTO(newOrder);
        } catch (error) {
          // Handle transaction errors
          // If it's a CustomError or ValidationError/NotFoundError, pass it through
          if (
            error instanceof CustomError ||
            error instanceof ValidationError ||
            error instanceof NotFoundError ||
            error instanceof CastError
          ) {
            throw error;
          }

          // Handle MongoDB duplicate key errors - retry with new order number
          if (error.code === 11000) {
            retryCount++;
            if (retryCount < maxRetries) {
              // Wait a bit before retrying (exponential backoff)
              await new Promise((resolve) =>
                setTimeout(resolve, 100 * retryCount)
              );
              // Continue to next iteration of retry loop
              continue;
            } else {
              // Max retries reached
              throw new CustomError(
                500,
                "Failed to generate unique order number after multiple attempts. Please try again."
              );
            }
          }

          // For other errors, store error and break out of retry loop
          lastError = error;
          break;
        }
      }

      // If we exit the loop without creating order, handle the error
      if (!orderCreated) {
        // Handle validation errors
        if (!lastError) {
          lastError = new Error("Order creation failed after retries");
        }
        if (lastError.name === "ValidationError") {
          const errors = Object.values(lastError.errors).map(
            (val) => val.message
          );
          throw new ValidationError(
            `Validation error: ${errors.join(". ")}`
          );
        }

        // For other errors, log and return with actual error message
        console.error("Order creation error:", lastError);
        const errorMessage =
          lastError?.message || String(lastError) || "Unknown error occurred";
        throw new CustomError(500, `Order creation failed: ${errorMessage}`);
      }
    } catch (error) {
      // Handle any errors that escape the retry loop
      // If it's a CustomError or ValidationError/NotFoundError, pass it through
      if (
        error instanceof CustomError ||
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof CastError
      ) {
        throw error;
      }

      // Handle validation errors
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((val) => val.message);
        throw new ValidationError(`Validation error: ${errors.join(". ")}`);
      }

      // Handle MongoDB duplicate key errors (shouldn't reach here with retry logic, but just in case)
      if (error.code === 11000) {
        throw new ValidationError(
          "Order number already exists. Please try again."
        );
      }

      // For other errors, log and return with actual error message
      console.error("Order creation error:", error);
      const errorMessage =
        error?.message || String(error) || "Unknown error occurred";
      throw new CustomError(500, `Order creation failed: ${errorMessage}`);
    } finally {
      // Always end the session
      await session.endSession();
    }
  }

  /**
   * Get all orders with optional date filtering
   * @param {Object} queryParams - Query parameters (date filters)
   * @returns {Promise<OrderResponseDTO[]>} Array of order DTOs
   */
  async getAllOrders(queryParams = {}) {
    // Build query filter
    const filter = {
      isDeleted: false,
    };

    // Add date range filter using dateFilter utility
    try {
      const dateFilter = createDateFilter(queryParams, "createdAt", false);
      Object.assign(filter, dateFilter);
    } catch (error) {
      // If it's a CustomError, pass it through
      if (error instanceof CustomError) {
        throw error;
      }
      // For other errors, wrap and pass
      throw new ValidationError(error.message || "Invalid date filter");
    }

    const orders = await this.repository.find(filter, {
      populate: [
        { path: "storefrontId", select: "locationName locationCode" },
        {
          path: "ordersProducts.inventoryId",
          select: "productName productCode SKU",
        },
        { path: "creditPersonId", select: "name phone" },
        { path: "soldBy", select: "name role" },
      ],
    });

    return orders.map((order) => new OrderResponseDTO(order));
  }

  /**
   * Get order by ID
   * @param {string} id - Order ID
   * @returns {Promise<OrderResponseDTO>} Order DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If order not found
   */
  async getOrderById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid order ID format", "id");
    }

    const order = await this.repository.findOne(
      { _id: id, isDeleted: false },
      {
        populate: [
          { path: "storefrontId", select: "locationName locationCode" },
          {
            path: "ordersProducts.inventoryId",
            select: "productName productCode SKU",
          },
          { path: "creditPersonId", select: "name phone" },
          { path: "soldBy", select: "name role" },
        ],
      }
    );

    if (!order) {
      throw new NotFoundError("Order");
    }

    return new OrderResponseDTO(order);
  }

  /**
   * Calculate total paid amount (including CreditRecords)
   * Note: order.paidAmount is now updated when credit payments are recorded,
   * so this method returns order.paidAmount directly.
   * This denormalizes the data for better query performance.
   * @param {Object} order - Order document
   * @param {mongoose.ClientSession} session - MongoDB session (optional)
   * @returns {Promise<number>} Total paid amount
   */
  async calculateTotalPaidAmount(order, session = null) {
    // Since order.paidAmount is updated when credit payments are recorded,
    // it already includes the initial payment + all credit record payments
    return order.paidAmount || 0;
  }

  /**
   * Calculate remaining balance accurately
   * @param {Object} order - Order document
   * @returns {Promise<number>} Remaining balance
   */
  async calculateRemainingBalance(order) {
    const totalPaid = await this.calculateTotalPaidAmount(order);
    if (order.finalAmount == null) {
      return null;
    }
    return Math.max(0, order.finalAmount - totalPaid);
  }

  /**
   * Update/add credit person ID to an order
   * @param {string} orderId - Order ID
   * @param {string} creditPersonId - Credit person ID
   * @returns {Promise<OrderResponseDTO>} Updated order DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If order or credit person not found
   * @throws {ValidationError} If validation fails
   */
  async updateOrderCreditPersonId(orderId, creditPersonId) {
    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new CastError("Invalid order ID format", "orderId");
    }

    // Validate creditPersonId is provided
    if (!creditPersonId) {
      throw new ValidationError("Credit person ID is required", "creditPersonId");
    }

    if (!mongoose.Types.ObjectId.isValid(creditPersonId)) {
      throw new CastError("Invalid credit person ID format", "creditPersonId");
    }

    // Start MongoDB session for transaction
    const session = await mongoose.startSession();

    try {
      let result;
      await session.withTransaction(async () => {
        // 1. Validate order exists and is not deleted
        const order = await this.repository.findById(orderId, { session });

        if (!order) {
          throw new NotFoundError("Order");
        }

        if (order.isDeleted) {
          throw new ValidationError("Cannot update deleted order");
        }

        // 2. Validate order is a credit order
        if (order.paymentType !== "credit") {
          throw new ValidationError(
            "Can only add credit person to credit orders. This order is not a credit order."
          );
        }

        // 3. Validate credit person exists (uses repository with session support)
        const creditPerson = await this.creditPersonaRepository.findById(creditPersonId, { session });

        if (!creditPerson) {
          throw new NotFoundError("Credit person");
        }

        // 4. Check if credit person is blacklisted
        if (creditPerson.blacklist) {
          throw new ValidationError(
            `Cannot add blacklisted credit person to order: ${
              creditPerson.blacklistReason || "No reason provided"
            }`
          );
        }

        // 5. Update order with credit person ID (uses repository)
        order.creditPersonId = new mongoose.Types.ObjectId(creditPersonId);
        await this.repository.save(order, { session });

        // 6. Populate references for response
        await order.populate("storefrontId", "locationName locationCode");
        await order.populate("creditPersonId", "name phone");
        await order.populate(
          "ordersProducts.inventoryId",
          "productName productCode SKU"
        );
        await order.populate("soldBy", "name role");

        result = order;
      });

      return new OrderResponseDTO(result);
    } catch (error) {
      // Handle transaction errors
      if (
        error instanceof CustomError ||
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof CastError
      ) {
        throw error;
      }

      // Handle validation errors
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((val) => val.message);
        throw new ValidationError(`Validation error: ${errors.join(". ")}`);
      }

      // For other errors, log and return with actual error message
      console.error("Update credit person ID error:", error);
      const errorMessage =
        error?.message || String(error) || "Unknown error occurred";
      throw new CustomError(
        500,
        `Failed to update credit person ID: ${errorMessage}`
      );
    } finally {
      // Always end the session
      await session.endSession();
    }
  }

  /**
   * Get orders by storefront ID
   * @param {string} storefrontId - Storefront ID
   * @returns {Promise<OrderResponseDTO[]>} Array of order DTOs
   * @throws {CastError} If invalid storefront ID format
   */
  async getOrdersByStorefrontId(storefrontId) {
    if (!mongoose.Types.ObjectId.isValid(storefrontId)) {
      throw new CastError("Invalid storefront ID format", "storefrontId");
    }

    const orders = await this.repository.find(
      {
        storefrontId: storefrontId,
        isDeleted: false,
      },
      {
        sort: { createdAt: -1 }, // Sort by newest first
        populate: [
          { path: "storefrontId", select: "locationName locationCode" },
          {
            path: "ordersProducts.inventoryId",
            select: "productName productCode SKU",
          },
          { path: "creditPersonId", select: "name phone" },
          { path: "soldBy", select: "name role" },
        ],
      }
    );

    return orders.map((order) => new OrderResponseDTO(order));
  }

  /**
   * Add order items to existing order
   * @param {string} orderId - Order ID
   * @param {Object} data - Request data (items, subTotal, tax, discount, finalAmount, extraChange, paidAmount)
   * @returns {Promise<OrderResponseDTO>} Updated order DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If order or inventory items not found
   * @throws {ValidationError} If validation fails
   */
  async addOrderItems(orderId, data) {
    const {
      items,
      subTotal,
      tax,
      discount,
      finalAmount,
      extraChange,
      paidAmount,
    } = data;

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new CastError("Invalid order ID format", "orderId");
    }

    // Validate required fields - items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ValidationError(
        "Items array is required and must not be empty",
        "items"
      );
    }

    // Validate each item in the array
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.inventoryId) {
        throw new ValidationError(
          `Item at index ${i}: Inventory ID is required`,
          `items[${i}].inventoryId`
        );
      }

      if (!mongoose.Types.ObjectId.isValid(item.inventoryId)) {
        throw new CastError(
          `Item at index ${i}: Invalid inventory ID format`,
          `items[${i}].inventoryId`
        );
      }

      if (!item.quantity || item.quantity < 1) {
        throw new ValidationError(
          `Item at index ${i}: Quantity is required and must be at least 1`,
          `items[${i}].quantity`
        );
      }
    }

    // Validate numeric fields if provided
    if (tax !== undefined && tax < 0) {
      throw new ValidationError("Tax cannot be negative", "tax");
    }

    if (discount !== undefined && discount < 0) {
      throw new ValidationError("Discount cannot be negative", "discount");
    }

    if (finalAmount !== undefined && finalAmount < 0) {
      throw new ValidationError("Final amount cannot be negative", "finalAmount");
    }

    if (paidAmount !== undefined && paidAmount < 0) {
      throw new ValidationError("Paid amount cannot be negative", "paidAmount");
    }

    if (extraChange !== undefined && extraChange < 0) {
      throw new ValidationError("Extra change cannot be negative", "extraChange");
    }

    // Start MongoDB session for transaction
    const session = await mongoose.startSession();

    try {
      let result;
      await session.withTransaction(async () => {
        // 1. Validate order exists and is not deleted
        const order = await this.repository.findById(orderId, { session });

        if (!order) {
          throw new NotFoundError("Order");
        }

        if (order.isDeleted) {
          throw new ValidationError("Cannot modify deleted order");
        }

        // 1a. Validate order status is completed (only completed orders can be modified after checkout)
        if (order.orderStatus !== "completed") {
          throw new ValidationError(
            `Cannot add items to order with status '${order.orderStatus}'. Only completed orders can be modified.`
          );
        }

        // 2. Get all unique inventory IDs to fetch in batch
        const inventoryIds = items.map(
          (item) => new mongoose.Types.ObjectId(item.inventoryId)
        );

        // 3. Validate all inventory items exist and get their selling prices (uses repository)
        const inventoryItems = await this.inventoryRepository.find({
          _id: { $in: inventoryIds },
        }, { session });

        if (inventoryItems.length !== inventoryIds.length) {
          const foundIds = inventoryItems.map((item) => item._id.toString());
          const missingIds = inventoryIds.filter(
            (id) => !foundIds.includes(id.toString())
          );
          throw new NotFoundError(
            `Inventory items not found: ${missingIds.join(", ")}`
          );
        }

        // Map inventory items by ID for easy lookup
        const inventoryMap = new Map();
        inventoryItems.forEach((item) => {
          inventoryMap.set(item._id.toString(), item);
        });

        // 4. Validate all items and check stock availability before processing
        const stockRecordsMap = new Map();
        for (const item of items) {
          const inventoryId = new mongoose.Types.ObjectId(item.inventoryId);
          const inventoryItem = inventoryMap.get(inventoryId.toString());

          if (!inventoryItem) {
            throw new NotFoundError(
              `Inventory item not found: ${item.inventoryId}`
            );
          }

          if (
            inventoryItem.sellingPrice === undefined ||
            inventoryItem.sellingPrice === null
          ) {
            throw new ValidationError(
              `Product '${inventoryItem.productCode}' (${inventoryItem.productName}) does not have a selling price set`
            );
          }

          if (inventoryItem.sellingPrice < 0) {
            throw new ValidationError(
              `Product '${inventoryItem.productCode}' (${inventoryItem.productName}) has an invalid selling price: ${inventoryItem.sellingPrice}`
            );
          }

          // Check stock availability (uses repository)
          const stockRecord = await this.storefrontInventoryRepository.findOne(
            {
              inventoryId: inventoryId,
              storefrontId: order.storefrontId,
            },
            { session }
          );

          if (!stockRecord) {
            throw new NotFoundError(
              `Stock record not found for product '${inventoryItem.productCode}' in storefront`
            );
          }

          // Check stock availability - stock must be >= quantity to add
          const availableQuantity = stockRecord.quantity || 0;
          if (availableQuantity < item.quantity) {
            throw new ValidationError(
              `Insufficient stock for product '${inventoryItem.productCode}' (${inventoryItem.productName}). Available: ${availableQuantity}, Requested: ${item.quantity}`
            );
          }

          // Store stock record for later use
          stockRecordsMap.set(inventoryId.toString(), stockRecord);
        }

        // 5. Process all items - add to order and deduct stock
        for (const item of items) {
          const inventoryId = new mongoose.Types.ObjectId(item.inventoryId);
          const inventoryItem = inventoryMap.get(inventoryId.toString());
          const unitPrice = inventoryItem.sellingPrice;
          const stockRecord = stockRecordsMap.get(inventoryId.toString());

          // Check if item already exists in order
          const existingItemIndex = order.ordersProducts.findIndex(
            (orderItem) =>
              orderItem.inventoryId.toString() === inventoryId.toString()
          );

          if (existingItemIndex !== -1) {
            // Item exists, increase quantity
            order.ordersProducts[existingItemIndex].quantity += item.quantity;
          } else {
            // Item doesn't exist, add new item
            order.ordersProducts.push({
              inventoryId: inventoryId,
              quantity: item.quantity,
              unitPrice,
            });
          }

          // Deduct stock (uses repository)
          stockRecord.quantity -= item.quantity;
          stockRecord.lastUpdated = new Date();
          await this.storefrontInventoryRepository.save(stockRecord, { session });
        }

        // 6. Update order fields if provided
        if (subTotal !== undefined && subTotal !== null) {
          order.subTotal = subTotal;
        }

        if (tax !== undefined && tax !== null) {
          order.tax = tax;
        }

        if (discount !== undefined && discount !== null) {
          order.discount = discount;
        }

        if (finalAmount !== undefined && finalAmount !== null) {
          order.finalAmount = finalAmount;
        }

        if (paidAmount !== undefined && paidAmount !== null) {
          order.paidAmount = paidAmount;
        }

        if (extraChange !== undefined && extraChange !== null) {
          order.extraChange = extraChange;
        }

        // 7. Save order (uses repository)
        await this.repository.save(order, { session });

        // 8. Populate references for response
        await order.populate("storefrontId", "locationName locationCode");
        await order.populate(
          "ordersProducts.inventoryId",
          "productName productCode SKU"
        );
        await order.populate("creditPersonId", "name phone");
        await order.populate("soldBy", "name role");

        result = order;
      });

      return new OrderResponseDTO(result);
    } catch (error) {
      // Handle transaction errors
      if (
        error instanceof CustomError ||
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof CastError
      ) {
        throw error;
      }

      // Handle validation errors
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((val) => val.message);
        throw new ValidationError(`Validation error: ${errors.join(". ")}`);
      }

      // For other errors, log and return with actual error message
      console.error("Add order items error:", error);
      const errorMessage =
        error?.message || String(error) || "Unknown error occurred";
      throw new CustomError(500, `Failed to add order items: ${errorMessage}`);
    } finally {
      // Always end the session
      await session.endSession();
    }
  }

  /**
   * Remove order items from existing order
   * @param {string} orderId - Order ID
   * @param {Object} data - Request data (items, subTotal, tax, discount, finalAmount, extraChange, paidAmount)
   * @returns {Promise<OrderResponseDTO>} Updated order DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If order or items not found
   * @throws {ValidationError} If validation fails
   */
  async removeOrderItems(orderId, data) {
    const {
      items,
      subTotal,
      tax,
      discount,
      finalAmount,
      extraChange,
      paidAmount,
    } = data;

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new CastError("Invalid order ID format", "orderId");
    }

    // Validate required fields - items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ValidationError(
        "Items array is required and must not be empty",
        "items"
      );
    }

    // Validate each item in the array
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.inventoryId) {
        throw new ValidationError(
          `Item at index ${i}: Inventory ID is required`,
          `items[${i}].inventoryId`
        );
      }

      if (!mongoose.Types.ObjectId.isValid(item.inventoryId)) {
        throw new CastError(
          `Item at index ${i}: Invalid inventory ID format`,
          `items[${i}].inventoryId`
        );
      }

      if (!item.quantity || item.quantity < 1) {
        throw new ValidationError(
          `Item at index ${i}: Quantity is required and must be at least 1`,
          `items[${i}].quantity`
        );
      }
    }

    // Validate numeric fields if provided
    if (tax !== undefined && tax < 0) {
      throw new ValidationError("Tax cannot be negative", "tax");
    }

    if (discount !== undefined && discount < 0) {
      throw new ValidationError("Discount cannot be negative", "discount");
    }

    if (finalAmount !== undefined && finalAmount < 0) {
      throw new ValidationError("Final amount cannot be negative", "finalAmount");
    }

    if (paidAmount !== undefined && paidAmount < 0) {
      throw new ValidationError("Paid amount cannot be negative", "paidAmount");
    }

    if (extraChange !== undefined && extraChange < 0) {
      throw new ValidationError("Extra change cannot be negative", "extraChange");
    }

    // Start MongoDB session for transaction
    const session = await mongoose.startSession();

    try {
      let result;
      await session.withTransaction(async () => {
        // 1. Validate order exists and is not deleted
        const order = await this.repository.findById(orderId, { session });

        if (!order) {
          throw new NotFoundError("Order");
        }

        if (order.isDeleted) {
          throw new ValidationError("Cannot modify deleted order");
        }

        // 1a. Validate order status is completed (only completed orders can be modified after checkout)
        if (order.orderStatus !== "completed") {
          throw new ValidationError(
            `Cannot remove items from order with status '${order.orderStatus}'. Only completed orders can be modified.`
          );
        }

        // 2. Validate all items exist in order and check quantities before processing
        const itemsToProcess = [];
        for (const item of items) {
          const inventoryId = new mongoose.Types.ObjectId(item.inventoryId);
          const existingItemIndex = order.ordersProducts.findIndex(
            (orderItem) =>
              orderItem.inventoryId.toString() === inventoryId.toString()
          );

          if (existingItemIndex === -1) {
            throw new NotFoundError(
              `Item with inventoryId '${item.inventoryId}' not found in order. Cannot remove item that doesn't exist.`
            );
          }

          const existingItem = order.ordersProducts[existingItemIndex];

          // Validate quantity to remove - items should not go beyond zero
          // Ensure we cannot remove more than what exists in the order
          if (item.quantity > existingItem.quantity) {
            throw new ValidationError(
              `Cannot remove ${item.quantity} items for inventoryId '${item.inventoryId}'. Only ${existingItem.quantity} items exist in order. Cannot remove more than available.`
            );
          }

          itemsToProcess.push({
            inventoryId,
            quantity: item.quantity,
            existingItemIndex,
            existingItem,
          });
        }

        // 3. Calculate final order items count to ensure we don't remove all items
        let finalItemsCount = order.ordersProducts.length;
        for (const itemToProcess of itemsToProcess) {
          const newQuantity =
            itemToProcess.existingItem.quantity - itemToProcess.quantity;
          if (newQuantity <= 0) {
            finalItemsCount -= 1; // This item will be removed
          }
        }

        // 4. Validate order will still have at least one item (model requirement)
        if (finalItemsCount === 0) {
          throw new ValidationError(
            "Cannot remove all items from order. Order must have at least one product."
          );
        }

        // 5. Process all items - remove from order and restore stock
        // Process in reverse order to avoid index shifting issues when removing items
        const sortedItemsToProcess = itemsToProcess.sort(
          (a, b) => b.existingItemIndex - a.existingItemIndex
        );

        for (const itemToProcess of sortedItemsToProcess) {
          const { inventoryId, quantity, existingItemIndex, existingItem } =
            itemToProcess;

          // Calculate new quantity
          const newQuantity = existingItem.quantity - quantity;

          // Update or remove item
          if (newQuantity <= 0) {
            // Remove item from array if quantity becomes zero or negative
            order.ordersProducts.splice(existingItemIndex, 1);
          } else {
            // Update quantity
            order.ordersProducts[existingItemIndex].quantity = newQuantity;
          }

          // Restore stock
          const stockRecord = await this.storefrontInventoryRepository.findOne(
            {
              inventoryId: inventoryId,
              storefrontId: order.storefrontId,
            },
            null,
            { session }
          );

          if (!stockRecord) {
            // If stock record doesn't exist, create it
            // This should rarely happen as stock records are created when orders are made
            // But we handle it for safety
            await this.storefrontInventoryRepository.create(
              [
                {
                  inventoryId: inventoryId,
                  storefrontId: order.storefrontId,
                  quantity: quantity,
                  lastUpdated: new Date(),
                },
              ],
              { session }
            );
          } else {
            // Restore stock to existing record (uses repository)
            stockRecord.quantity += quantity;
            stockRecord.lastUpdated = new Date();
            await this.storefrontInventoryRepository.save(stockRecord, { session });
          }
        }

        // 8. Update order fields if provided
        if (subTotal !== undefined && subTotal !== null) {
          order.subTotal = subTotal;
        }

        if (tax !== undefined && tax !== null) {
          order.tax = tax;
        }

        if (discount !== undefined && discount !== null) {
          order.discount = discount;
        }

        if (finalAmount !== undefined && finalAmount !== null) {
          order.finalAmount = finalAmount;
        }

        if (paidAmount !== undefined && paidAmount !== null) {
          order.paidAmount = paidAmount;
        }

        if (extraChange !== undefined && extraChange !== null) {
          order.extraChange = extraChange;
        }

        // 9. Save order (uses repository)
        await this.repository.save(order, { session });

        // 10. Populate references for response
        await order.populate("storefrontId", "locationName locationCode");
        await order.populate(
          "ordersProducts.inventoryId",
          "productName productCode SKU"
        );
        await order.populate("creditPersonId", "name phone");
        await order.populate("soldBy", "name role");

        result = order;
      });

      return new OrderResponseDTO(result);
    } catch (error) {
      // Handle transaction errors
      if (
        error instanceof CustomError ||
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof CastError
      ) {
        throw error;
      }

      // Handle validation errors
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((val) => val.message);
        throw new ValidationError(`Validation error: ${errors.join(". ")}`);
      }

      // For other errors, log and return with actual error message
      console.error("Remove order items error:", error);
      const errorMessage =
        error?.message || String(error) || "Unknown error occurred";
      throw new CustomError(
        500,
        `Failed to remove order items: ${errorMessage}`
      );
    } finally {
      // Always end the session
      await session.endSession();
    }
  }
}

export default OrderService;
