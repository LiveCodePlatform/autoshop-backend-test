/**
 * Sale Report Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getSaleReportService } from "../loaders/services.loader.js";

class SaleReportController {
  /**
   * @param {SaleReportService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getSaleReportService();
  }

  /**
   * Get sale report for a specific storefront or all storefronts
   * GET /api/sale-reports
   */
  getSaleReportByStorefrontId = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.getSaleReportByStorefrontId(req.query);

    res.status(200).json({
      success: true,
      message: "Sale report fetched successfully",
      data: result,
    });
  });

  /**
   * Get payment method breakdown report for a specific storefront or all storefronts (paid orders only)
   * GET /api/sale-reports/payment-methods
   */
  getPaymentMethodReportByStorefrontId = asyncErrorHandler(
    async (req, res, next) => {
      const result =
        await this.service.getPaymentMethodReportByStorefrontId(req.query);

      res.status(200).json({
        success: true,
        message: "Payment method report fetched successfully",
        data: result,
      });
    }
  );

  /**
   * Get credit sale report with credit records breakdown for a specific storefront or all storefronts
   * GET /api/sale-reports/credit
   */
  getCreditSaleReportByStorefrontId = asyncErrorHandler(
    async (req, res, next) => {
      const result =
        await this.service.getCreditSaleReportByStorefrontId(req.query);

      res.status(200).json({
        success: true,
        message: "Credit sale report fetched successfully",
        data: result,
      });
    }
  );

  /**
   * Get product/stock sales statistics for a specific storefront or all storefronts
   * GET /api/sale-reports/products
   */
  getProductSalesReportByStorefrontId = asyncErrorHandler(
    async (req, res, next) => {
      const result =
        await this.service.getProductSalesReportByStorefrontId(req.query);

      res.status(200).json({
        success: true,
        message: "Product sales report fetched successfully",
        data: result,
      });
    }
  );
}

// Export instance
const saleReportController = new SaleReportController();
export const {
  getSaleReportByStorefrontId,
  getPaymentMethodReportByStorefrontId,
  getCreditSaleReportByStorefrontId,
  getProductSalesReportByStorefrontId,
} = saleReportController;

export default saleReportController;
