/**
 * Sale Report Service
 * Business logic layer for Sale Report operations
 * Uses repositories for data access
 */

import {
  NotFoundError,
  CastError,
  ValidationError,
} from "../errors/errorTypes.js";
import mongoose from "mongoose";
import { createDateFilter } from "../shared/utils/dateFilter.utils.js";
import CustomError from "../shared/utils/customError.js";
import { LocationProfileRepository } from "../repositories/locationProfile.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { CreditRecordRepository } from "../repositories/creditRecord.repository.js";
import { getAIResponse } from "./gemini.service.js";

export class SaleReportService {
  /**
   * @param {LocationProfileRepository} locationRepository - Injected location repository instance
   * @param {OrderRepository} orderRepository - Injected order repository instance
   * @param {CreditRecordRepository} creditRecordRepository - Injected credit record repository instance
   */
  constructor(locationRepository, orderRepository, creditRecordRepository) {
    this.locationRepository =
      locationRepository || new LocationProfileRepository();
    this.orderRepository = orderRepository || new OrderRepository();
    this.creditRecordRepository =
      creditRecordRepository || new CreditRecordRepository();
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

      // Validate storefront exists (matches legacy exactly - uses repository)
      storefront = await this.locationRepository.findOne({
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

    // Aggregate sale data (matches legacy exactly - uses direct model access)
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

      // Validate storefront exists (matches legacy exactly - uses repository)
      storefront = await this.locationRepository.findOne({
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

    // Aggregate payment method breakdown (matches legacy exactly - uses direct model access)
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
      },
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

      // Validate storefront exists (matches legacy exactly - uses repository)
      storefront = await this.locationRepository.findOne({
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

    // Get all credit orders (matches legacy exactly - uses direct model access)
    const creditOrders = await this.orderRepository.find(filter, {
      select: "_id orderNumber finalAmount paidAmount paymentMethod createdAt",
    });

    const orderIds = creditOrders.map((order) => order._id);

    // Get all credit records for these orders (matches legacy exactly - uses direct model access)
    const creditRecords = await this.creditRecordRepository.find(
      {
        orderId: { $in: orderIds },
        isDeleted: false,
      },
      {
        select: "orderId paidAmount paymentMethod paymentDate",
      },
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
        0,
      );

      // Calculate initial paid amount: order.paidAmount - total from credit records
      // Note: order.paidAmount includes initial + all credit payments (denormalized)
      const initialPaidAmount = Math.max(
        0,
        (order.paidAmount || 0) - totalCreditPaidForOrder,
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
        (order.finalAmount || 0) - (order.paidAmount || 0),
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

      // Validate storefront exists (matches legacy exactly - uses repository)
      storefront = await this.locationRepository.findOne({
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

    // Aggregate product sales statistics (matches legacy exactly - uses direct model access)
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
      },
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

  /**
   * Ask AI about sale report data
   * @param {Object} query - Query parameters (question, history)
   * @returns {Promise<Object>} AI response
   */
  async askAiAboutSaleReport(query) {
    const { question, history = [] } = query;

    if (!question) {
      throw new ValidationError("Question is required for AI query");
    }

    if (!process.env.GOOGLE_CLOUD_PROJECT) {
      throw new Error(
        "GOOGLE_CLOUD_PROJECT is not configured in the environment variables",
      );
    }

    // Step 1: Use AI to extract parameters from the natural language question
    const today = new Date().toISOString().split("T")[0]; // e.g. "2024-05-01"
    const paramExtractionPrompt = `
You are a parameter extraction AI.
The user is asking a question about their sales report in natural language (English or Burmese).
Today's date is: ${today}

Your task is to extract the following parameters from their question if they exist:
1. "startDate" (YYYY-MM-DD format)
2. "endDate" (YYYY-MM-DD format)
3. "locationName" or "storefrontName" (string)

Rules:
- If they say "from April 1st to today", set startDate to "2024-04-01" and endDate to today's date.
- If they say "last month", calculate the start and end dates of the previous month.
- If they say "this month", calculate the start and end dates of the current month.
- If they mention a specific shop name (e.g., "Mandalay branch", "Main shop"), extract it as locationName.
- Only return a valid JSON object. Do not include markdown formatting like \`\`\`json.
- If a parameter is not mentioned, set its value to null.

User Question: "${question}"

Expected JSON format:
{
  "startDate": "YYYY-MM-DD" | null,
  "endDate": "YYYY-MM-DD" | null,
  "locationName": "string" | null
}
`;

    let extractedParams = {
      startDate: null,
      endDate: null,
      locationName: null,
    };
    try {
      const extractionResponseText = await getAIResponse(
        paramExtractionPrompt,
        [],
      );
      // Clean up the response to ensure it's valid JSON (remove markdown block if AI accidentally included it)
      const cleanJsonStr = extractionResponseText
        .replace(/```json/gi, "")
        .replace(/```/gi, "")
        .trim();
      extractedParams = JSON.parse(cleanJsonStr);
    } catch (error) {
      console.warn(
        "Failed to extract parameters with AI. Proceeding without filters.",
        error.message,
      );
    }

    // Step 2: Resolve storefrontId if a location name was mentioned
    let resolvedStorefrontId = null;
    let resolvedStorefrontName = null;

    if (extractedParams.locationName) {
      // Try to find the storefront by name (case-insensitive)
      const storefront = await this.locationRepository.findOne({
        locationName: { $regex: new RegExp(extractedParams.locationName, "i") },
        type: "storefront",
        isDeleted: false,
      });

      if (storefront) {
        resolvedStorefrontId = storefront._id.toString();
        resolvedStorefrontName = storefront.locationName;
      }
    }

    // Step 3: Fetch the necessary report data using extracted parameters
    const reportQuery = {
      startDate: extractedParams.startDate,
      endDate: extractedParams.endDate,
      storefrontId: resolvedStorefrontId,
    };

    const generalReport = await this.getSaleReportByStorefrontId(reportQuery);
    const paymentReport =
      await this.getPaymentMethodReportByStorefrontId(reportQuery);
    const productReport =
      await this.getProductSalesReportByStorefrontId(reportQuery);

    // Take only top 10 products to save tokens
    let topProducts = productReport.products || [];
    if (topProducts.length > 10) {
      topProducts = topProducts.slice(0, 10);
    }

    const contextData = {
      generalReport: generalReport.report,
      dateRange: generalReport.dateRange,
      storefront: generalReport.storefront,
      paymentTotals: paymentReport.totals,
      paymentMethods: paymentReport.paymentMethods,
      topProducts: topProducts,
    };

    // Step 4: Provide context data and extracted params to AI for the final answer
    const prompt = `
You are an intelligent business analyst AI for a POS and inventory system.
The user is asking a question about their sales report.

Context regarding their query parameters (extracted automatically):
- Start Date: ${extractedParams.startDate || "All Time"}
- End Date: ${extractedParams.endDate || "All Time"}
- Storefront/Location: ${resolvedStorefrontName || "All Locations"}

Here is the contextual sales report data (in JSON format) fetched based on their query:
${JSON.stringify(contextData, null, 2)}

User's Question: "${question}"

Please answer the user's question clearly, accurately, and concisely based ONLY on the provided context data. 
If the required data to answer the question is not present in the context, politely inform the user.
Please reply in the same language as the user's question (e.g., if the user asks in Burmese, reply in Burmese).
`;

    try {
      const responseText = await getAIResponse(prompt, history);

      return {
        question,
        answer: responseText,
        extractedFilters: {
          startDate: extractedParams.startDate,
          endDate: extractedParams.endDate,
          locationName: extractedParams.locationName,
          resolvedStorefront: resolvedStorefrontName,
        },
        contextUsed: {
          dateRange: generalReport.dateRange,
          storefront: generalReport.storefront,
        },
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to generate response from AI: " + error.message);
    }
  }
}
