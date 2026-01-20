/**
 * Application Loaders
 * Centralized initialization and dependency injection
 *
 * This file loads and initializes all application dependencies:
 * - Database connections
 * - Services
 * - Repositories
 * - External services (Redis, etc.)
 *
 * Usage:
 * import { loadApp } from './loaders/index.js';
 * await loadApp();
 */

import { loadDatabase } from "./database.loader.js";
import { loadServices } from "./services.loader.js";
// import { loadRedis } from "./redis.loader.js"; // Optional: if using Redis

/**
 * Load all application dependencies
 * Call this before starting the server
 *
 * @returns {Promise<void>}
 */
export const loadApp = async () => {
  try {
    console.log("🚀 Loading application dependencies...");

    // Load database connection
    await loadDatabase();

    // Load services/repositories (DI container)
    loadServices();

    // Load Redis (if needed)
    // await loadRedis();

    console.log("✅ All dependencies loaded successfully!");
  } catch (error) {
    console.error("❌ Failed to load application dependencies:", error);
    throw error;
  }
};

/**
 * Gracefully shutdown all connections
 * Call this when shutting down the server
 *
 * @returns {Promise<void>}
 */
export const shutdownApp = async () => {
  try {
    console.log("🛑 Shutting down application...");

    // Shutdown services
    const { shutdownServices } = await import("./services.loader.js");
    shutdownServices();

    // Close database connection
    const mongoose = await import("mongoose");
    if (mongoose.default.connection.readyState === 1) {
      await mongoose.default.connection.close();
      console.log("✅ Database connection closed");
    }

    // Close Redis connection (if used)
    // await closeRedis();

    console.log("✅ Application shutdown complete");
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    throw error;
  }
};

export default {
  loadApp,
  shutdownApp,
};
