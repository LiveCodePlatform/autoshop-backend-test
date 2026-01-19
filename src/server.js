import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import process from "node:process";
import app from "./app.js";
import { loadApp, shutdownApp } from "./loaders/index.js";

/**
 * Start Server Function
 * Loads all dependencies and starts the Express server
 */
const startServer = async () => {
  try {
    // Load all application dependencies (database, services, etc.)
    await loadApp();

    const port = process.env.PORT || 5000;

    // Start Express server
    const server = app.listen(port, () => {
      console.log(`🚀 SERVER is Running at PORT: ${port}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Graceful shutdown handlers
    process.on("SIGTERM", async () => {
      console.log("🛑 SIGTERM received. Shutting down gracefully...");
      server.close(async () => {
        await shutdownApp();
        process.exit(0);
      });
    });

    process.on("SIGINT", async () => {
      console.log("🛑 SIGINT received. Shutting down gracefully...");
      server.close(async () => {
        await shutdownApp();
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle uncaught exceptions (synchronous errors)
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception occurred!");
  console.error("Error Name:", err.name);
  console.error("Error Message:", err.message);
  console.error("Stack:", err.stack);
  console.error("🛑 Server is shutting down due to uncaught exception!");
  process.exit(1);
});

// Handle unhandled promise rejections (asynchronous errors)
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection occurred!");
  console.error("Error Name:", err?.name || "Unknown");
  console.error("Error Message:", err?.message || err);
  console.error("Stack:", err?.stack || "No stack trace");
  console.error("🛑 Server is shutting down due to unhandled rejection!");
  process.exit(1);
});

// Start the server
startServer();
