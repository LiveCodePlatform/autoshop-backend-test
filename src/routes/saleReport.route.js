/**
 * Sale Report Routes
 * API endpoint definitions for sale report operations
 */

import { Router } from "express";
import {
  getSaleReportByStorefrontId,
  getPaymentMethodReportByStorefrontId,
  getCreditSaleReportByStorefrontId,
  getProductSalesReportByStorefrontId,
  askAiAboutSaleReport,
} from "../controllers/saleReport.controller.js";

const router = Router();

/**
 * @route   GET /api/v2/sale-report
 * @desc    Get sale report for a specific storefront or all storefronts
 * @access  Public (add protect middleware if needed)
 */
router.get("/sale-report", getSaleReportByStorefrontId);

/**
 * @route   GET /api/v2/sale-report/paid-orders
 * @desc    Get payment method breakdown report for a specific storefront or all storefronts (paid orders only)
 * @access  Public (add protect middleware if needed)
 */
router.get("/sale-report/paid-orders", getPaymentMethodReportByStorefrontId);

/**
 * @route   GET /api/v2/sale-report/credit-orders
 * @desc    Get credit sale report with credit records breakdown for a specific storefront or all storefronts
 * @access  Public (add protect middleware if needed)
 */
router.get("/sale-report/credit-orders", getCreditSaleReportByStorefrontId);

/**
 * @route   GET /api/v2/sale-report/products
 * @desc    Get product/stock sales statistics for a specific storefront or all storefronts
 * @access  Public (add protect middleware if needed)
 */
router.get("/sale-report/products", getProductSalesReportByStorefrontId);

/**
 * @route   POST /api/v2/sale-report/ask-ai
 * @desc    Ask AI about the sale report
 * @access  Public (add protect middleware if needed)
 */
router.post("/sale-report/ask-ai", askAiAboutSaleReport);

export default router;
