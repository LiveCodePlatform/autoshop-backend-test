import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import helmet from "helmet";

// ============================================
// Middleware & Config - New Architecture
// ============================================
import apiRateLimiter from "./middlewares/rateLimiter.middleware.js";
import configureCors from "./config/cors.config.js";
import { mmTimeZoneMiddleware } from "./middlewares/timezone.middleware.js";

// ============================================
// Error Handler - New Architecture
// ============================================
import globalErrorHandler from "./middlewares/errorHandler.middleware.js";
import AppError from "./errors/AppError.js";

// ============================================
// Routes - New Architecture
// ============================================
import inventoryRouter from "./routes/inventory.route.js";
import stockAuditLogRouter from "./routes/stockAuditLog.route.js";
import warehouseProfileRouter from "./routes/warehouseProfile.route.js";
import storefrontProfileRouter from "./routes/storefrontProfile.route.js";
import warehouseInventoryRouter from "./routes/warehouseInventory.route.js";
import adminRouter from "./routes/admin.route.js";
import supplierProfileRouter from "./routes/supplierProfile.route.js";
import creditPersonaRouter from "./routes/creditPersona.route.js";
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
app.use("/api/v2", inventoryRouter);
app.use("/api/v2", stockAuditLogRouter);
app.use("/api/v2", warehouseProfileRouter);
app.use("/api/v2", storefrontProfileRouter);
app.use("/api/v2", warehouseInventoryRouter);
app.use("/api/v2", adminRouter);
app.use("/api/v2", supplierProfileRouter);
app.use("/api/v2", creditPersonaRouter);
// ============================================
// 404 Error Handler - New Architecture
// ============================================
app.all("/*any", (req, res, next) => {
  const err = new AppError(
    404,
    `Can't find ${req.originalUrl} on the server!`,
    "NOT_FOUND"
  );
  next(err);
});

// ============================================
// Global Error Handler - New Architecture
// ============================================
app.use(globalErrorHandler);

export default app;
