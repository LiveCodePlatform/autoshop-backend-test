/**
 * Credit Record Service
 * Business logic layer for CreditRecord operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { CreditRecordRepository } from "../repositories/creditRecord.repository.js";
import {
  CreateCreditRecordDTO,
  CreditRecordResponseDTO,
} from "../dtos/creditRecord.dto.js";
import {
  NotFoundError,
  CastError,
  ValidationError,
} from "../errors/errorTypes.js";
import { CREDIT_RECORD_FIELDS } from "../types/creditRecord.types.js";
import mongoose from "mongoose";
import { createDateFilter } from "../shared/utils/dateFilter.utils.js";
import CustomError from "../shared/utils/customError.js";
import { OrderRepository } from "../repositories/order.repository.js";

export class CreditRecordService {
  /**
   * @param {CreditRecordRepository} repository - Injected repository instance (optional, fallback creates new instance)
   * @param {OrderRepository} orderRepository - Injected order repository instance
   */
  constructor(repository, orderRepository) {
    this.repository = repository || new CreditRecordRepository();
    this.orderRepository = orderRepository || new OrderRepository();
  }

  /**
   * Create credit payment (for partial/full payment on credit orders)
   * @param {Object} data - Request data
   * @param {Object} user - Authenticated user object (contains _id)
   * @returns {Promise<Object>} Created credit record with order information
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If order not found
   */
  async createCreditPayment(data, user) {
    const { orderId, paidAmount, paymentMethod = "cash", notes } = data;
    const addedBy = user._id;

    // Validate required fields
    if (!orderId) {
      throw new ValidationError("Order ID is required", "orderId");
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new CastError("Invalid order ID format", "orderId");
    }

    if (!paidAmount && paidAmount !== 0) {
      throw new ValidationError("Paid amount is required", "paidAmount");
    }

    if (paidAmount === 0) {
      throw new ValidationError("Paid amount cannot be zero", "paidAmount");
    }

    // Start MongoDB session for transaction
    const session = await mongoose.startSession();

    try {
      let result;
      await session.withTransaction(async () => {
        // 1. Validate order exists and is not deleted
        const order = await this.orderRepository.findById(orderId, { session });

        if (!order) {
          throw new NotFoundError("Order");
        }

        if (order.isDeleted) {
          throw new ValidationError("Cannot add payment to deleted order");
        }

        // 2. Validate order is a credit order
        if (order.paymentType !== "credit") {
          throw new ValidationError(
            "Can only add payments to credit orders. This order is not a credit order."
          );
        }

        // 3. Calculate current remaining balance
        // Note: order.paidAmount should already include all previous credit payments
        // (it's updated when each credit payment is recorded)
        // So we can use it directly as the total paid so far
        const totalPaidSoFar = order.paidAmount || 0;
        const currentRemainingBalance = Math.max(
          0,
          order.finalAmount - totalPaidSoFar
        );

        // 4. Validate payment amount based on sign
        if (paidAmount > 0) {
          // For positive amounts: validate payment doesn't exceed remaining balance
          if (paidAmount > currentRemainingBalance) {
            throw new ValidationError(
              `Payment amount (${paidAmount}) exceeds remaining balance (${currentRemainingBalance}). Maximum payment allowed: ${currentRemainingBalance}`
            );
          }
        } else {
          // For negative amounts: validate that order.paidAmount won't go below 0
          const newPaidAmount = totalPaidSoFar + paidAmount;
          if (newPaidAmount < 0) {
            throw new ValidationError(
              `Correction amount (${paidAmount}) would result in negative paid amount. Current paid amount: ${totalPaidSoFar}. Maximum correction allowed: ${-totalPaidSoFar}`
            );
          }
        }

        // 5. Create credit record payment
        // Auto-populate creditPersonId from order for easier querying
        const creditRecordData = {
          [CREDIT_RECORD_FIELDS.ORDER_ID]: new mongoose.Types.ObjectId(orderId),
          [CREDIT_RECORD_FIELDS.CREDIT_PERSON_ID]: order.creditPersonId || null,
          [CREDIT_RECORD_FIELDS.PAID_AMOUNT]: paidAmount,
          [CREDIT_RECORD_FIELDS.PAYMENT_DATE]: new Date(),
          [CREDIT_RECORD_FIELDS.PAYMENT_METHOD]: paymentMethod || "cash",
          [CREDIT_RECORD_FIELDS.NOTES]: notes || null,
          [CREDIT_RECORD_FIELDS.ADDED_BY]: addedBy,
        };

        // Create credit record (repository handles array creation and returns first element)
        const creditRecord = await this.repository.create(creditRecordData, {
          session,
        });

        // 6. Update order's paidAmount to include this credit payment
        // This denormalizes the data for easier querying
        order.paidAmount = (order.paidAmount || 0) + paidAmount;
        await order.save({ session });

        // 7. Reload order to get updated paidAmount (or we can use the updated value directly)
        const updatedTotalPaid = order.paidAmount;
        const newRemainingBalance = Math.max(
          0,
          order.finalAmount - updatedTotalPaid
        );
        const isFullyPaid = newRemainingBalance <= 0;

        // 8. Populate creditPersonId for response (orderId will be manually constructed)
        if (creditRecord.creditPersonId) {
          await creditRecord.populate("creditPersonId", "name phone");
        }

        // 9. Construct clean creditRecord object for response
        // Manually build orderId object to avoid virtual fields from Order schema
        const creditRecordResponse = creditRecord.toObject();
        creditRecordResponse.orderId = {
          _id: order._id,
          orderNumber: order.orderNumber,
          finalAmount: order.finalAmount,
          paymentType: order.paymentType,
          paidAmount: order.paidAmount, // Include updated paidAmount
        };

        // 10. Prepare result
        result = {
          creditRecord: creditRecordResponse,
          order: {
            orderNumber: order.orderNumber,
            finalAmount: order.finalAmount,
            previousRemainingBalance: currentRemainingBalance,
            previousPaidAmount: totalPaidSoFar, // Previous total paid
            paymentAmount: paidAmount,
            newPaidAmount: updatedTotalPaid, // New total paid (updated in order)
            newRemainingBalance: newRemainingBalance,
            isFullyPaid,
          },
        };
      });

      return result;
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

      // For other errors, log and throw (matches legacy exactly)
      console.error("Credit payment creation error:", error);
      const errorMessage =
        error?.message || String(error) || "Unknown error occurred";
      throw new CustomError(
        500,
        `Credit payment creation failed: ${errorMessage}`
      );
    } finally {
      // Always end the session
      await session.endSession();
    }
  }

  /**
   * Get all credit records for an order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Credit records with order summary
   * @throws {CastError} If invalid order ID format
   * @throws {NotFoundError} If order not found
   */
  async getCreditRecordsByOrderId(orderId) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new CastError("Invalid order ID format", "orderId");
    }

    // Validate order exists
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order");
    }

    // Get all credit records for this order
    const creditRecords = await this.repository.find(
      {
        [CREDIT_RECORD_FIELDS.ORDER_ID]: orderId,
        [CREDIT_RECORD_FIELDS.IS_DELETED]: false,
      },
      {
        sort: { [CREDIT_RECORD_FIELDS.PAYMENT_DATE]: -1 }, // Sort by newest payment first
        populate: {
          path: CREDIT_RECORD_FIELDS.ORDER_ID,
          select: "orderNumber finalAmount paymentType",
        },
      }
    );

    // Calculate total paid from credit records (matches legacy exactly)
    const totalCreditPayments = creditRecords.reduce(
      (sum, record) => sum + (record.paidAmount || 0),
      0
    );

    // Calculate remaining balance (matches legacy exactly - note: this adds order.paidAmount which already includes credit payments)
    const totalPaid = (order.paidAmount || 0) + totalCreditPayments;
    const remainingBalance = Math.max(0, order.finalAmount - totalPaid);

    return {
      order: {
        orderNumber: order.orderNumber,
        finalAmount: order.finalAmount,
        initialPaidAmount: order.paidAmount,
        totalPaidAmount: totalPaid,
        remainingBalance: remainingBalance,
      },
      creditRecords: {
        count: creditRecords.length,
        records: creditRecords,
      },
    };
  }

  /**
   * Get all credit records (with filtering)
   * @param {Object} queryParams - Query parameters (orderId, page, limit, startDate, endDate)
   * @returns {Promise<Object>} List of credit records with pagination
   */
  async getAllCreditRecords(queryParams = {}) {
    const { orderId, page = 1, limit = 10 } = queryParams;

    // Build query
    const query = { [CREDIT_RECORD_FIELDS.IS_DELETED]: false };

    if (orderId) {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new CastError("Invalid order ID format", "orderId");
      }
      query[CREDIT_RECORD_FIELDS.ORDER_ID] = orderId;
    }

    // Add date range filter using dateFilter utility
    // Filter by the 'paymentDate' field (when the payment was made)
    try {
      const dateFilter = createDateFilter(
        queryParams,
        CREDIT_RECORD_FIELDS.PAYMENT_DATE,
        false
      );
      Object.assign(query, dateFilter);
    } catch (error) {
      // If it's a CustomError, rethrow it
      if (error instanceof CustomError) {
        throw error;
      }
      // For other errors, wrap and throw
      throw new ValidationError(error.message || "Invalid date filter");
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const creditRecords = await this.repository.find(query, {
      populate: {
        path: CREDIT_RECORD_FIELDS.ORDER_ID,
        select: "orderNumber finalAmount paymentType",
      },
      sort: { [CREDIT_RECORD_FIELDS.PAYMENT_DATE]: -1 },
      skip,
      limit: limitNum,
    });

    // Get total count
    const total = await this.repository.countDocuments(query);

    return {
      creditRecords,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    };
  }

  /**
   * Get credit record by ID
   * @param {string} id - Credit record ID
   * @returns {Promise<Object>} Credit record
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If credit record not found
   */
  async getCreditRecordById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid credit record ID format", "id");
    }

    const creditRecord = await this.repository.findOne(
      {
        _id: id,
        [CREDIT_RECORD_FIELDS.IS_DELETED]: false,
      },
      {
        populate: {
          path: CREDIT_RECORD_FIELDS.ORDER_ID,
          select: "orderNumber finalAmount paymentType",
        },
      }
    );

    if (!creditRecord) {
      throw new NotFoundError("Credit record");
    }

    return creditRecord;
  }

  /**
   * Get all credit records for a specific credit person
   * @param {string} creditPersonId - Credit person ID
   * @param {Object} queryParams - Query parameters (page, limit)
   * @returns {Promise<Object>} Credit records with summary and pagination
   * @throws {CastError} If invalid credit person ID format
   * @throws {NotFoundError} If credit person not found
   */
  async getCreditRecordsByCreditPersonId(creditPersonId, queryParams = {}) {
    const { page = 1, limit = 10 } = queryParams;

    if (!mongoose.Types.ObjectId.isValid(creditPersonId)) {
      throw new CastError("Invalid credit person ID format", "creditPersonId");
    }

    // Validate credit person exists
    const creditPerson = await CreditPerson.findById(creditPersonId);
    if (!creditPerson) {
      throw new NotFoundError("Credit person");
    }

    // Find all orders for this credit person (only credit orders) - for summary information
    const orders = await Order.find({
      creditPersonId: creditPersonId,
      paymentType: "credit",
      isDeleted: false,
    }).select("_id orderNumber finalAmount paidAmount");

    // Build query for credit records - now we can query directly by creditPersonId (much faster!)
    const query = {
      [CREDIT_RECORD_FIELDS.CREDIT_PERSON_ID]: creditPersonId,
      [CREDIT_RECORD_FIELDS.IS_DELETED]: false,
    };

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get credit records with pagination
    const creditRecords = await this.repository.find(query, {
      populate: {
        path: CREDIT_RECORD_FIELDS.ORDER_ID,
        select: "orderNumber finalAmount paymentType paidAmount createdAt",
      },
      sort: { [CREDIT_RECORD_FIELDS.PAYMENT_DATE]: -1 },
      skip,
      limit: limitNum,
    });

    // If no orders found, return empty result early (matches legacy exactly)
    if (orders.length === 0) {
      return {
        creditPerson: {
          _id: creditPerson._id,
          name: creditPerson.name,
          phone: creditPerson.phone,
        },
        orders: [],
        creditRecords: {
          count: 0,
          records: [],
        },
        summary: {
          totalCreditRecords: 0,
          totalPaidAmount: 0,
          totalOutstandingAmount: 0,
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit),
        },
      };
    }

    // Get total count
    const total = await this.repository.countDocuments(query);

    // Calculate summary statistics
    // Get all credit records (without pagination) for summary (matches legacy exactly)
    const allCreditRecords = await this.repository.find(query);
    const totalCreditPayments = allCreditRecords.reduce(
      (sum, record) => sum + (record.paidAmount || 0),
      0
    );

    // Calculate outstanding for each order
    // Note: order.paidAmount already includes all credit payments (updated when each credit payment is recorded)
    // So we can use it directly as the total paid amount
    let totalOutstanding = 0;
    for (const order of orders) {
      const orderTotalPaid = order.paidAmount || 0;
      const orderOutstanding = order.finalAmount - orderTotalPaid;
      totalOutstanding += Math.max(0, orderOutstanding);
    }

    return {
      creditPerson: {
        _id: creditPerson._id,
        name: creditPerson.name,
        phone: creditPerson.phone,
      },
      orders: orders.map((order) => ({
        _id: order._id,
        orderNumber: order.orderNumber,
      })),
      creditRecords: {
        count: creditRecords.length,
        records: creditRecords,
      },
      summary: {
        totalCreditRecords: total,
        totalPaidViaCreditRecords: totalCreditPayments,
        totalOutstandingAmount: totalOutstanding,
      },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    };
  }
}

export default CreditRecordService;
