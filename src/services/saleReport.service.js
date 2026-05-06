import Order from "../models/orders.model.js";
import OnlineOrder from "../models/onlineOrder.model.js";
import OnlineStorefront from "../models/onlineStorefront.model.js";
import LocationProfile from "../models/locationProfile.model.js";
import { getAIResponse } from "./gemini.service.js";
import mongoose from "mongoose";

/**
 * Sale Report Service
 * Handles AI-powered data retrieval and analysis
 */

/**
 * Get internal sale report data (used by controller and AI)
 */
export const getInternalSaleReport = async (params) => {
  const { storefrontId, startDate, endDate } = params;

  // POS Order Filters
  const posFilter = {
    isDeleted: false,
    orderStatus: "completed",
  };

  // Online Order Filters
  const onlineFilter = {
    isDeleted: false,
    orderStatus: { $in: ["confirmed", "shipped", "delivered"] }, // Include confirmed as successful sales for reporting
  };

  const onlineStorefrontId = await OnlineStorefront.getSingletonId();

  if (storefrontId && mongoose.Types.ObjectId.isValid(storefrontId)) {
    const isOnline = storefrontId.toString() === onlineStorefrontId.toString();
    if (isOnline) {
      posFilter._id = null; // No POS orders for online storefront
      onlineFilter.onlineStorefrontId = new mongoose.Types.ObjectId(
        storefrontId,
      );
    } else {
      posFilter.storefrontId = new mongoose.Types.ObjectId(storefrontId);
      onlineFilter._id = null; // No online orders for physical storefront
    }
  }

  if (startDate || endDate) {
    const dateRange = {};
    if (startDate) dateRange.$gte = new Date(startDate);
    if (endDate) dateRange.$lte = new Date(endDate);

    posFilter.createdAt = dateRange;
    onlineFilter.createdAt = dateRange;
  }

  // Aggregate POS Orders
  const posStats = await Order.aggregate([
    { $match: posFilter },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$finalAmount" },
        totalPaid: { $sum: "$paidAmount" },
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

  // Aggregate Online Orders
  const onlineStats = await OnlineOrder.aggregate([
    { $match: onlineFilter },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$finalAmount" },
        totalPaid: { $sum: "$finalAmount" }, // Online orders are usually fully paid upon shipping/delivery
        totalSubTotal: { $sum: "$subTotal" },
        totalTax: { $sum: "$tax" },
        totalDiscount: { $sum: "$discount" },
        totalExtraChange: { $sum: 0 },
        orderCount: { $sum: 1 },
        creditOrderCount: { $sum: 0 }, // Online orders don't use credit personas
        paidOrderCount: { $sum: 1 },
      },
    },
  ]);

  const p = posStats[0] || {
    totalRevenue: 0,
    totalPaid: 0,
    totalSubTotal: 0,
    totalTax: 0,
    totalDiscount: 0,
    totalExtraChange: 0,
    orderCount: 0,
    creditOrderCount: 0,
    paidOrderCount: 0,
  };

  const o = onlineStats[0] || {
    totalRevenue: 0,
    totalPaid: 0,
    totalSubTotal: 0,
    totalTax: 0,
    totalDiscount: 0,
    totalExtraChange: 0,
    orderCount: 0,
    creditOrderCount: 0,
    paidOrderCount: 0,
  };

  return {
    totalRevenue: p.totalRevenue + o.totalRevenue,
    totalPaid: p.totalPaid + o.totalPaid,
    totalSubTotal: p.totalSubTotal + o.totalSubTotal,
    totalTax: p.totalTax + o.totalTax,
    totalDiscount: p.totalDiscount + o.totalDiscount,
    totalExtraChange: p.totalExtraChange + o.totalExtraChange,
    orderCount: p.orderCount + o.orderCount,
    creditOrderCount: p.creditOrderCount + o.creditOrderCount,
    paidOrderCount: p.paidOrderCount + o.paidOrderCount,
    posStats: p,
    onlineStats: o,
  };
};

/**
 * Ask AI about sale report
 */
export const askAiAboutSaleReport = async (query) => {
  const { question, history = [] } = query;

  if (!question) {
    throw new Error("Question is required for AI query");
  }

  // Step 1: Use AI to extract parameters (Date Range and Storefront Name)
  // This is much better for Burmese and other languages than regex/chrono
  const extractionPrompt = `
Extract the following information from the user's message in JSON format.
- startDate (ISO format or null)
- endDate (ISO format or null)
- storefrontName (string or null)

Current Time: ${new Date().toISOString()}

User Message: "${question}"

Return ONLY the JSON object.
`;

  let extractedParams = {
    startDate: null,
    endDate: null,
    storefrontName: null,
  };
  try {
    const extractionResponse = await getAIResponse(extractionPrompt);
    // Clean up response in case AI adds markdown blocks
    const jsonString = extractionResponse.replace(/```json|```/g, "").trim();
    extractedParams = JSON.parse(jsonString);
  } catch (error) {
    console.error(
      "Parameter extraction failed, falling back to all-time:",
      error.message,
    );
  }

  // Step 2: Resolve Storefront ID if name was found
  let storefrontId = null;
  let resolvedStorefront = null;
  if (extractedParams.storefrontName) {
    // Try to find physical storefront
    resolvedStorefront = await LocationProfile.findOne({
      locationName: { $regex: new RegExp(extractedParams.storefrontName, "i") },
      type: "storefront",
      isDeleted: false,
    });

    // If not found, try online storefront
    if (!resolvedStorefront) {
      resolvedStorefront = await OnlineStorefront.findOne({
        name: { $regex: new RegExp(extractedParams.storefrontName, "i") },
        singletonKey: "default",
        isDeleted: false,
      });
    }

    if (resolvedStorefront) {
      storefrontId = resolvedStorefront._id;
    }
  }

  // Step 3: Fetch Actual Report Data
  const reportData = await getInternalSaleReport({
    storefrontId,
    startDate: extractedParams.startDate,
    endDate: extractedParams.endDate,
  });

  // Step 4: Final AI Analysis
  const analysisPrompt = `
You are a professional business analyst for a POS system.
The user is asking a question about their sales report.

USER QUESTION: "${question}"

CONTEXT DATA FETCHED FROM DATABASE:
- Period: ${extractedParams.startDate || "All time"} to ${extractedParams.endDate || "Now"}
- Storefront: ${resolvedStorefront ? resolvedStorefront.locationName || resolvedStorefront.name : "All Storefronts"}
- Total Revenue: ${reportData.totalRevenue.toLocaleString()} MMK
- Total Orders: ${reportData.orderCount}
- Paid Orders (POS): ${reportData.posStats.paidOrderCount}
- Credit Orders (POS): ${reportData.posStats.creditOrderCount}
- Online Orders: ${reportData.onlineStats.orderCount}
- Total Paid Amount: ${reportData.totalPaid.toLocaleString()} MMK
- Total Discount Given: ${reportData.totalDiscount.toLocaleString()} MMK

Please provide a clear, helpful, and concise answer to the user's question in the SAME LANGUAGE they used (e.g., if they ask in Burmese, reply in Burmese).
Focus on the numbers provided in the context data. Break down between POS and Online if relevant.
`;

  const finalAnswer = await getAIResponse(analysisPrompt, history);

  return {
    answer: finalAnswer,
    extractedParams,
    resolvedStorefront: resolvedStorefront
      ? resolvedStorefront.locationName
      : "All",
    dataUsed: reportData,
  };
};
