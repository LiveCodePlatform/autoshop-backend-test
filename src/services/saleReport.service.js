/**
 * Sale Report Service
 * Business logic layer for Sale Report operations
 * Uses repositories for data access
 */

import { OrderRepository } from "../repositories/order.repository.js";
import { LocationProfileRepository } from "../repositories/locationProfile.repository.js";
import { CreditRecordRepository } from "../repositories/creditRecord.repository.js";
import { NotFoundError, CastError, ValidationError } from "../errors/errorTypes.js";
import mongoose from "mongoose";
import { createDateFilter } from "../shared/utils/dateFilter.utils.js";
import CustomError from "../shared/utils/customError.js";

export class SaleReportService {
  /**
   * @param {OrderRepository} orderRepository - Injected order repository instance
   * @param {LocationProfileRepository} locationProfileRepository - Injected location profile repository instance
   * @param {CreditRecordRepository} creditRecordRepository - Injected credit record repository instance
   */
  constructor(orderRepository, locationProfileRepository, creditRecordRepository) {
    this.orderRepository = orderRepository;
    this.locationProfileRepository = locationProfileRepository;
    this.creditRecordRepository = creditRecordRepository;
  }

  /**
   * Get sale report for a specific storefront or all storefronts
   * @param {Object} query - Query parameters (storefrontId, startDate, endDate)
   * @returns {Promise<Object>} Sale report data
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If storefront not found
   */
  async getSaleReportByStorefrontId(query) {
    const { storefrontId, startDate, endDate } = query;

    let storefront = null;

    // If storefrontId is provided, validate and fetch storefront
    if (storefrontId) {
      // Validate storefrontId
      if (!mongoose.Types.ObjectId.isValid(storefrontId)) {
        throw new ValidationError("Invalid storefront ID format");
      }

      // Validate storefront exists
      storefront = await this.locationProfileRepository.findOne({
        _id: storefrontId,
        type: "storefront",
        isDeleted: false,
      });

      if (!storefront) {
        throw new NotFoundError("Storefront not found");
      }
    }

    // Build query filter
    const filter = {
      isDeleted: false,
      orderStatus: "completed", // Only include completed orders
    };

    // Add storefrontId filter only if provided
    if (storefrontId) {
      filter.storefrontId = new mongoose.Types.ObjectId(storefrontId);
    }

    // Add date range filter using dateFilter utility
    let parsedStartDate = null;
    let parsedEndDate = null;
    try {
      const dateFilter = createDateFilter(query, "createdAt", false);
      Object.assign(filter, dateFilter);

      // Extract parsed dates from the filter for response
      if (dateFilter.createdAt) {
        if (dateFilter.createdAt.$gte) {
          parsedStartDate = dateFilter.createdAt.$gte;
        }
        if (dateFilter.createdAt.$lte) {
          parsedEndDate = dateFilter.createdAt.$lte;
        }
      }
    } catch (error) {
      // If it's a CustomError, rethrow it
      if (error instanceof CustomError) {
        throw error;
      }
      // For other errors, wrap and throw
      throw new ValidationError(error.message || "Invalid date filter");
    }

    // Aggregate sale data
    const saleReport = await this.orderRepository.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalFinalAmount: { $sum: "$finalAmount" },
          totalPaidAmount: { $sum: "$paidAmount" },
          totalSubTotal: { $sum: "$subTotal" },
          totalTax: { $sum: "$tax" },
          totalDiscount: { $sum: "$discount" },
          totalExtraChange: { $sum: "$extraChange" },
          orderCount: { $sum: 1 },
          creditOrderCount: {
            $sum: { $cond: [{ $eq: ["$paymentType", "credit"] }, 1, 0] },
          },
          paidOrderCount: {
            $sum: { $cond: [{ $eq: ["$paymentType", "paid"] }, 1, 0] },
          },
        },
      },
    ]);

    // If no orders found, return zero values
    const report = saleReport[0] || {
      totalFinalAmount: 0,
      totalPaidAmount: 0,
      totalSubTotal: 0,
      totalTax: 0,
      totalDiscount: 0,
      totalExtraChange: 0,
      orderCount: 0,
      creditOrderCount: 0,
      paidOrderCount: 0,
    };

    // Get date range info - use parsed dates from filter if available, otherwise use query params
    const dateRange = {
      startDate: parsedStartDate || (startDate ? new Date(startDate) : null),
      endDate: parsedEndDate || (endDate ? new Date(endDate) : null),
    };

    return {
      storefront: storefront
        ? {
            _id: storefront._id,
            locationName: storefront.locationName,
            locationCode: storefront.locationCode,
          }
        : null,
      dateRange,
      report: {
        finalAmount: report.totalFinalAmount, // Main metric as requested
        paidAmount: report.totalPaidAmount,
        subTotal: report.totalSubTotal,
        tax: report.totalTax,
        discount: report.totalDiscount,
        extraChange: report.totalExtraChange,
        orderCount: report.orderCount,
        creditOrderCount: report.creditOrderCount,
        paidOrderCount: report.paidOrderCount,
      },
    };
  }

  /**
   * Get payment method breakdown report for a specific storefront or all storefronts (paid orders only)
   * @param {Object} query - Query parameters (storefrontId, startDate, endDate)
   * @returns {Promise<Object>} Payment method report data
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If storefront not found
   */
  async getPaymentMethodReportByStorefrontId(query) {
    const { storefrontId, startDate, endDate } = query;

    let storefront = null;

    // If storefrontId is provided, validate and fetch storefront
    if (storefrontId) {
      // Validate storefrontId
      if (!mongoose.Types.ObjectId.isValid(storefrontId)) {
        throw new ValidationError("Invalid storefront ID format");
      }

      // Validate storefront exists
      storefront = await this.locationProfileRepository.findOne({
        _id: storefrontId,
        type: "storefront",
        isDeleted: false,
      });

      if (!storefront) {
        throw new NotFoundError("Storefront not found");
      }
    }

    // Build query filter - only paid orders
    const filter = {
      isDeleted: false,
      orderStatus: "completed", // Only include completed orders
      paymentType: "paid", // Only paid orders
    };

    // Add storefrontId filter only if provided
    if (storefrontId) {
      filter.storefrontId = new mongoose.Types.ObjectId(storefrontId);
    }

    // Add date range filter using dateFilter utility
    let parsedStartDate = null;
    let parsedEndDate = null;
    try {
      const dateFilter = createDateFilter(query, "createdAt", false);
      Object.assign(filter, dateFilter);

      // Extract parsed dates from the filter for response
      if (dateFilter.createdAt) {
        if (dateFilter.createdAt.$gte) {
          parsedStartDate = dateFilter.createdAt.$gte;
        }
        if (dateFilter.createdAt.$lte) {
          parsedEndDate = dateFilter.createdAt.$lte;
        }
      }
    } catch (error) {
      // If it's a CustomError, rethrow it
      if (error instanceof CustomError) {
        throw error;
      }
      // For other errors, wrap and throw
      throw new ValidationError(error.message || "Invalid date filter");
    }

    // Aggregate payment method breakdown
    const paymentMethodReport = await this.orderRepository.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$paymentMethod", // Group by payment method
          totalPaidAmount: { $sum: "$paidAmount" },
          orderCount: { $sum: 1 },
          totalFinalAmount: { $sum: "$finalAmount" },
        },
      },
      {
        $sort: { totalPaidAmount: -1 }, // Sort by total paid amount descending
      },
    ]);

    // Calculate totals across all payment methods
    const totals = paymentMethodReport.reduce(
      (acc, item) => {
        acc.totalPaidAmount += item.totalPaidAmount;
        acc.totalFinalAmount += item.totalFinalAmount;
        acc.totalOrderCount += item.orderCount;
        return acc;
      },
      {
        totalPaidAmount: 0,
        totalFinalAmount: 0,
        totalOrderCount: 0,
      }
    );

    // Get date range info
    const dateRange = {
      startDate: parsedStartDate || (startDate ? new Date(startDate) : null),
      endDate: parsedEndDate || (endDate ? new Date(endDate) : null),
    };

    return {
      storefront: storefront
        ? {
            _id: storefront._id,
            locationName: storefront.locationName,
            locationCode: storefront.locationCode,
          }
        : null,
      dateRange,
      totals: {
        totalPaidAmount: totals.totalPaidAmount,
        totalFinalAmount: totals.totalFinalAmount,
        totalOrderCount: totals.totalOrderCount,
      },
      paymentMethods: paymentMethodReport.map((item) => ({
        paymentMethod: item._id || "unknown",
        totalPaidAmount: item.totalPaidAmount,
        totalFinalAmount: item.totalFinalAmount,
        orderCount: item.orderCount,
      })),
    };
  }

  /**
   * Get credit sale report with credit records breakdown for a specific storefront or all storefronts
   * @param {Object} query - Query parameters (storefrontId, startDate, endDate)
   * @returns {Promise<Object>} Credit sale report data
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If storefront not found
   */
  async getCreditSaleReportByStorefrontId(query) {
    const { storefrontId, startDate, endDate } = query;

    let storefront = null;

    // If storefrontId is provided, validate and fetch storefront
    if (storefrontId) {
      // Validate storefrontId
      if (!mongoose.Types.ObjectId.isValid(storefrontId)) {
        throw new ValidationError("Invalid storefront ID format");
      }

      // Validate storefront exists
      storefront = await this.locationProfileRepository.findOne({
        _id: storefrontId,
        type: "storefront",
        isDeleted: false,
      });

      if (!storefront) {
        throw new NotFoundError("Storefront not found");
      }
    }

    // Build query filter - only credit orders
    const filter = {
      isDeleted: false,
      orderStatus: "completed", // Only include completed orders
      paymentType: "credit", // Only credit orders
    };

    // Add storefrontId filter only if provided
    if (storefrontId) {
      filter.storefrontId = new mongoose.Types.ObjectId(storefrontId);
    }

    // Add date range filter using dateFilter utility
    let parsedStartDate = null;
    let parsedEndDate = null;
    try {
      const dateFilter = createDateFilter(query, "createdAt", false);
      Object.assign(filter, dateFilter);

      // Extract parsed dates from the filter for response
      if (dateFilter.createdAt) {
        if (dateFilter.createdAt.$gte) {
          parsedStartDate = dateFilter.createdAt.$gte;
        }
        if (dateFilter.createdAt.$lte) {
          parsedEndDate = dateFilter.createdAt.$lte;
        }
      }
    } catch (error) {
      // If it's a CustomError, rethrow it
      if (error instanceof CustomError) {
        throw error;
      }
      // For other errors, wrap and throw
      throw new ValidationError(error.message || "Invalid date filter");
    }

    // Get all credit orders
    const creditOrders = await this.orderRepository.find(filter, {
      select: "_id orderNumber finalAmount paidAmount paymentMethod createdAt",
    });

    const orderIds = creditOrders.map((order) => order._id);

    // Get all credit records for these orders
    const creditRecords = await this.creditRecordRepository.find(
      {
        orderId: { $in: orderIds },
        isDeleted: false,
      },
      {
        select: "orderId paidAmount paymentMethod paymentDate",
      }
    );

    // Create a map of orderId to credit records
    const creditRecordsByOrder = {};
    creditRecords.forEach((record) => {
      const orderIdStr = record.orderId.toString();
      if (!creditRecordsByOrder[orderIdStr]) {
        creditRecordsByOrder[orderIdStr] = [];
      }
      creditRecordsByOrder[orderIdStr].push(record);
    });

    // Calculate initial payments and group by payment method
    const initialPaymentByMethod = {};
    const creditPaymentByMethod = {};
    let totalFinalAmount = 0;
    let totalPaidAmount = 0;
    let totalInitialPaidAmount = 0;
    let totalCreditPaidAmount = 0;
    let totalRemainingBalance = 0;
    let orderCount = 0;

    creditOrders.forEach((order) => {
      const orderIdStr = order._id.toString();
      const creditRecordsForOrder = creditRecordsByOrder[orderIdStr] || [];

      // Calculate total from credit records
      const totalCreditPaidForOrder = creditRecordsForOrder.reduce(
        (sum, record) => sum + (record.paidAmount || 0),
        0
      );

      // Calculate initial paid amount: order.paidAmount - total from credit records
      // Note: order.paidAmount includes initial + all credit payments (denormalized)
      const initialPaidAmount = Math.max(
        0,
        (order.paidAmount || 0) - totalCreditPaidForOrder
      );

      // Get initial payment method from order
      const initialPaymentMethod = order.paymentMethod || "cash";

      // Aggregate initial payments by payment method
      if (!initialPaymentByMethod[initialPaymentMethod]) {
        initialPaymentByMethod[initialPaymentMethod] = {
          paymentMethod: initialPaymentMethod,
          totalPaidAmount: 0,
          orderCount: 0,
        };
      }
      initialPaymentByMethod[initialPaymentMethod].totalPaidAmount +=
        initialPaidAmount;
      if (initialPaidAmount > 0) {
        initialPaymentByMethod[initialPaymentMethod].orderCount += 1;
      }

      // Aggregate credit record payments by payment method
      creditRecordsForOrder.forEach((record) => {
        const paymentMethod = record.paymentMethod || "cash";
        if (!creditPaymentByMethod[paymentMethod]) {
          creditPaymentByMethod[paymentMethod] = {
            paymentMethod: paymentMethod,
            totalPaidAmount: 0,
            recordCount: 0,
          };
        }
        creditPaymentByMethod[paymentMethod].totalPaidAmount +=
          record.paidAmount || 0;
        creditPaymentByMethod[paymentMethod].recordCount += 1;
      });

      // Aggregate totals
      totalFinalAmount += order.finalAmount || 0;
      totalPaidAmount += order.paidAmount || 0;
      totalInitialPaidAmount += initialPaidAmount;
      totalCreditPaidAmount += totalCreditPaidForOrder;
      totalRemainingBalance += Math.max(
        0,
        (order.finalAmount || 0) - (order.paidAmount || 0)
      );
      orderCount += 1;
    });

    // Convert to arrays and sort
    const initialPayments = Object.values(initialPaymentByMethod)
      .filter((item) => item.totalPaidAmount > 0)
      .sort((a, b) => b.totalPaidAmount - a.totalPaidAmount);

    const creditPayments = Object.values(creditPaymentByMethod)
      .filter((item) => item.totalPaidAmount > 0)
      .sort((a, b) => b.totalPaidAmount - a.totalPaidAmount);

    // Get date range info
    const dateRange = {
      startDate: parsedStartDate || (startDate ? new Date(startDate) : null),
      endDate: parsedEndDate || (endDate ? new Date(endDate) : null),
    };

    return {
      storefront: storefront
        ? {
            _id: storefront._id,
            locationName: storefront.locationName,
            locationCode: storefront.locationCode,
          }
        : null,
      dateRange,
      totals: {
        totalFinalAmount,
        totalPaidAmount,
        totalInitialPaidAmount,
        totalCreditPaidAmount,
        totalRemainingBalance,
        orderCount,
        creditRecordCount: creditRecords.length,
      },
      initialPayments: initialPayments,
      creditPayments: creditPayments,
    };
  }

  /**
   * Get product/stock sales statistics for a specific storefront or all storefronts
   * @param {Object} query - Query parameters (storefrontId, startDate, endDate)
   * @returns {Promise<Object>} Product sales report data
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If storefront not found
   */
  async getProductSalesReportByStorefrontId(query) {
    const { storefrontId, startDate, endDate } = query;

    let storefront = null;

    // If storefrontId is provided, validate and fetch storefront
    if (storefrontId) {
      // Validate storefrontId
      if (!mongoose.Types.ObjectId.isValid(storefrontId)) {
        throw new ValidationError("Invalid storefront ID format");
      }

      // Validate storefront exists
      storefront = await this.locationProfileRepository.findOne({
        _id: storefrontId,
        type: "storefront",
        isDeleted: false,
      });

      if (!storefront) {
        throw new NotFoundError("Storefront not found");
      }
    }

    // Build query filter
    const filter = {
      isDeleted: false,
      orderStatus: "completed", // Only include completed orders
    };

    // Add storefrontId filter only if provided
    if (storefrontId) {
      filter.storefrontId = new mongoose.Types.ObjectId(storefrontId);
    }

    // Add date range filter using dateFilter utility
    let parsedStartDate = null;
    let parsedEndDate = null;
    try {
      const dateFilter = createDateFilter(query, "createdAt", false);
      Object.assign(filter, dateFilter);

      // Extract parsed dates from the filter for response
      if (dateFilter.createdAt) {
        if (dateFilter.createdAt.$gte) {
          parsedStartDate = dateFilter.createdAt.$gte;
        }
        if (dateFilter.createdAt.$lte) {
          parsedEndDate = dateFilter.createdAt.$lte;
        }
      }
    } catch (error) {
      // If it's a CustomError, rethrow it
      if (error instanceof CustomError) {
        throw error;
      }
      // For other errors, wrap and throw
      throw new ValidationError(error.message || "Invalid date filter");
    }

    // Aggregate product sales statistics
    const productSalesReport = await this.orderRepository.aggregate([
      { $match: filter },
      // Unwind the ordersProducts array to get individual products
      { $unwind: "$ordersProducts" },
      // Group by inventoryId to aggregate statistics
      {
        $group: {
          _id: "$ordersProducts.inventoryId",
          totalQuantity: { $sum: "$ordersProducts.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: [
                "$ordersProducts.quantity",
                "$ordersProducts.unitPrice",
              ],
            },
          },
          orderCount: { $addToSet: "$_id" }, // Count unique orders
          averageUnitPrice: { $avg: "$ordersProducts.unitPrice" },
          minUnitPrice: { $min: "$ordersProducts.unitPrice" },
          maxUnitPrice: { $max: "$ordersProducts.unitPrice" },
        },
      },
      // Calculate orderCount as array length
      {
        $addFields: {
          orderCount: { $size: "$orderCount" },
        },
      },
      // Sort by total quantity descending
      {
        $sort: { totalQuantity: -1 },
      },
      // Lookup inventory details
      {
        $lookup: {
          from: "inventories",
          localField: "_id",
          foreignField: "_id",
          as: "inventory",
        },
      },
      // Unwind inventory array (should be single item)
      {
        $unwind: {
          path: "$inventory",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Project final structure
      {
        $project: {
          _id: 0,
          inventoryId: "$_id",
          productName: "$inventory.productName",
          productCode: "$inventory.productCode",
          SKU: "$inventory.SKU",
          category: "$inventory.category",
          subCategory: "$inventory.subCategory",
          brand: "$inventory.brand",
          unitOfMeasure: "$inventory.unitOfMeasure",
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1,
          averageUnitPrice: { $round: ["$averageUnitPrice", 2] },
          minUnitPrice: 1,
          maxUnitPrice: 1,
        },
      },
    ]);

    // Calculate totals across all products
    const totals = productSalesReport.reduce(
      (acc, item) => {
        acc.totalQuantity += item.totalQuantity;
        acc.totalRevenue += item.totalRevenue;
        acc.totalUniqueProducts += 1;
        return acc;
      },
      {
        totalQuantity: 0,
        totalRevenue: 0,
        totalUniqueProducts: 0,
      }
    );

    // Get date range info
    const dateRange = {
      startDate: parsedStartDate || (startDate ? new Date(startDate) : null),
      endDate: parsedEndDate || (endDate ? new Date(endDate) : null),
    };

    return {
      storefront: storefront
        ? {
            _id: storefront._id,
            locationName: storefront.locationName,
            locationCode: storefront.locationCode,
          }
        : null,
      dateRange,
      totals: {
        totalQuantity: totals.totalQuantity,
        totalRevenue: totals.totalRevenue,
        totalUniqueProducts: totals.totalUniqueProducts,
      },
      products: productSalesReport,
    };
  }
}
