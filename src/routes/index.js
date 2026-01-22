/**
 * Routes Index
 * Centralized route aggregation
 * Exports all route modules for use in app.js
 */

import inventoryRouter from "./inventory.route.js";
import stockAuditLogRouter from "./stockAuditLog.route.js";
import warehouseProfileRouter from "./warehouseProfile.route.js";
import storefrontProfileRouter from "./storefrontProfile.route.js";
import warehouseInventoryRouter from "./warehouseInventory.route.js";
import adminRouter from "./admin.route.js";
import supplierProfileRouter from "./supplierProfile.route.js";
import creditPersonaRouter from "./creditPersona.route.js";
import expenseRouter from "./expense.route.js";
import purchasingRouter from "./purchasing.route.js";
import goodsRecievedNoteRouter from "./goodsRecievedNote.route.js";
import transferRouter from "./transfer.route.js";
import storefrontInventoryRouter from "./storefrontInventory.route.js";
import creditRecordRouter from "./creditRecord.route.js";
import orderRouter from "./order.route.js";
import saleReportRouter from "./saleReport.route.js";
import locationProfileRouter from "./locationProfile.route.js";
import socialMediaSaleInventoryRouter from "./socialMediaSaleInventory.route.js";

/**
 * All application routes
 * @returns {Object} Object containing all route routers
 */
export const routes = {
  inventoryRouter,
  stockAuditLogRouter,
  warehouseProfileRouter,
  storefrontProfileRouter,
  warehouseInventoryRouter,
  adminRouter,
  supplierProfileRouter,
  creditPersonaRouter,
  expenseRouter,
  purchasingRouter,
  goodsRecievedNoteRouter,
  transferRouter,
  storefrontInventoryRouter,
  creditRecordRouter,
  orderRouter,
  saleReportRouter,
  locationProfileRouter,
  socialMediaSaleInventoryRouter,
};

// Named exports for individual routes (for backward compatibility)
export {
  inventoryRouter,
  stockAuditLogRouter,
  warehouseProfileRouter,
  storefrontProfileRouter,
  warehouseInventoryRouter,
  adminRouter,
  supplierProfileRouter,
  creditPersonaRouter,
  expenseRouter,
  purchasingRouter,
  goodsRecievedNoteRouter,
  transferRouter,
  storefrontInventoryRouter,
  creditRecordRouter,
  orderRouter,
  saleReportRouter,
  locationProfileRouter,
  socialMediaSaleInventoryRouter,
};

// Default export (routes object)
export default routes;
