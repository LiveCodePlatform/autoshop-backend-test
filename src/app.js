import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import helmet from "helmet";

// ============================================
// Middleware & Config - New Architecture
// ============================================
import apiRateLimiter from "./middleware/rateLimiter.middleware.js";
import configureCors from "./config/cors.config.js";
import { mmTimeZoneMiddleware } from "./middleware/timezone.middleware.js";

// ============================================
// Error Handler - Backward Compatible
// ============================================
// OLD: Uses error.controller.js (for existing features) - DEFAULT
// NEW: Uses middlewares/errorHandler.middleware.js (for new features)
//
// To use new error handler, set USE_NEW_ERROR_HANDLER=true in .env
// Otherwise, defaults to old error.controller.js for backward compatibility

// Default: Import old error handler (backward compatibility)
import globalErrorHandlerOld from "./controllers/error.controller.js";
import CustomError from "./utils/customError.js";

// Initialize with old handler (will be replaced if new one is used)
let globalErrorHandler = globalErrorHandlerOld;

// Feature flag: Use new error handler if enabled
const USE_NEW_ERROR_HANDLER = process.env.USE_NEW_ERROR_HANDLER === "true";

if (USE_NEW_ERROR_HANDLER) {
  try {
    // NEW: Try to use new error handler from middlewares/
    const errorHandlerModule = await import(
      "./middleware/errorHandler.middleware.js"
    );
    globalErrorHandler =
      errorHandlerModule.globalErrorHandler || errorHandlerModule.default;
    console.log("✅ Using new error handler (enhanced architecture)");
  } catch (error) {
    // Fallback to old handler if new one doesn't exist or fails to load
    console.log(
      "📦 New error handler not available, using legacy handler:",
      error.message
    );
    globalErrorHandler = globalErrorHandlerOld;
  }
}

// ============================================
// Routes - Keep all routes (old and new will coexist)
// ============================================
import inventoryRouter from "./routes/inventory.route.js";
import warehouseProfileRouter from "./routes/warehouseProfile.route.js";
import storefrontProfileRouter from "./routes/storefrontProfile.route.js";
import locationProfileRouter from "./routes/locationProfile.route.js";
import storefrontInventoryRouter from "./routes/storefrontInventory.route.js";
import supplierProfileRouter from "./routes/supplierProfile.route.js";
import purchasingRouter from "./routes/purchasing.route.js";
import warehouseRouter from "./routes/warehouse.route.js";
import grnRouter from "./routes/grn.route.js";
import transferRouter from "./routes/transfer.route.js";
import orderRouter from "./routes/order.route.js";
import creditRecordRouter from "./routes/creditRecord.route.js";
import creditPersonaRouter from "./routes/creditPersona.route.js";
import adminRouter from "./routes/admin.route.js";
import expenseRouter from "./routes/expense.route.js";
import stockAuditLogRouter from "./routes/stockAuditLog.route.js";
import saleReportRouter from "./routes/saleReport.route.js";

// ============================================
// Express App Setup
// ============================================
const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration
app.use(configureCors());

// Trust proxy (for rate limiting behind proxies)
app.set("trust proxy", 1);

// Rate limiting
app.use(apiRateLimiter(60, 60 * 1000)); // 60 requests per minute

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10kb" }));

// Timezone middleware
app.use(mmTimeZoneMiddleware);

// ============================================
// Route Mounting
// ============================================
app.use("/api/v1", inventoryRouter);
app.use("/api/v1", warehouseProfileRouter);
app.use("/api/v1", storefrontProfileRouter);
app.use("/api/v1", locationProfileRouter);
app.use("/api/v1", storefrontInventoryRouter);
app.use("/api/v1", supplierProfileRouter);
app.use("/api/v1", purchasingRouter);
app.use("/api/v1", warehouseRouter);
app.use("/api/v1", grnRouter);
app.use("/api/v1", transferRouter);
app.use("/api/v1", orderRouter);
app.use("/api/v1", creditRecordRouter);
app.use("/api/v1", creditPersonaRouter);
app.use("/api/v1", adminRouter);
app.use("/api/v1", expenseRouter);
app.use("/api/v1", stockAuditLogRouter);
app.use("/api/v1", saleReportRouter);

// ============================================
// 404 Error Handler - Backward Compatible
// ============================================
app.all("/*any", (req, res, next) => {
  const err = new CustomError(
    404,
    `Can't find ${req.originalUrl} on the server!`
  );
  next(err);
});

// ============================================
// Global Error Handler - Backward Compatible
// ============================================
app.use(globalErrorHandler);

export default app;
