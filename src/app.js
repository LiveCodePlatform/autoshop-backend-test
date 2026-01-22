import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import helmet from "helmet";

// ============================================
// Middleware & Config - New Architecture
// ============================================
import apiRateLimiter from "./middlewares/rateLimiter.middleware.js";
import { configureCors } from "./config/index.js";
import { mmTimeZoneMiddleware } from "./middlewares/timezone.middleware.js";

// ============================================
// Error Handler - New Architecture
// ============================================
import globalErrorHandler from "./middlewares/errorHandler.middleware.js";
import AppError from "./errors/AppError.js";

// ============================================
// Routes - New Architecture
// ============================================
import {
  adminRouter,
  inventoryRouter,
  stockAuditLogRouter,
  warehouseProfileRouter,
  storefrontProfileRouter,
  warehouseInventoryRouter,
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
} from "./routes/index.js";
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
app.use("/api/v2", adminRouter);
app.use("/api/v2", inventoryRouter);
app.use("/api/v2", stockAuditLogRouter);
app.use("/api/v2", warehouseProfileRouter);
app.use("/api/v2", storefrontProfileRouter);
app.use("/api/v2", warehouseInventoryRouter);
app.use("/api/v2", supplierProfileRouter);
app.use("/api/v2", creditPersonaRouter);
app.use("/api/v2", expenseRouter);
app.use("/api/v2", purchasingRouter);
app.use("/api/v2", goodsRecievedNoteRouter);
app.use("/api/v2", transferRouter);
app.use("/api/v2", storefrontInventoryRouter);
app.use("/api/v2", creditRecordRouter);
app.use("/api/v2", orderRouter);
app.use("/api/v2", saleReportRouter);
app.use("/api/v2", locationProfileRouter);
app.use("/api/v2", socialMediaSaleInventoryRouter);
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
