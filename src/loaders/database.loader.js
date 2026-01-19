/**
 * Database Loader
 * Handles database connection initialization and setup
 * Uses configuration from config/db.config.js
 */

import mongoose from "mongoose";
import { dbConfig, validateDbConfig } from "../config/db.config.js";

/**
 * Load and connect to database
 * @returns {Promise<mongoose.Connection>}
 */
export const loadDatabase = async () => {
  try {
    // Validate configuration first
    validateDbConfig();

    // Apply mongoose global settings (not connection options)
    if (dbConfig.mongooseOptions?.strictQuery !== undefined) {
      mongoose.set("strictQuery", dbConfig.mongooseOptions.strictQuery);
    }

    // Connect to database using config
    // Only pass valid MongoDB connection options (not mongoose settings)
    const conn = await mongoose.connect(
      dbConfig.uri,
      dbConfig.connectionOptions || {}
    );

    console.log(`✅ Database Connected: ${conn.connection.host}`);

    // Handle database connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ Database connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  Database disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ Database reconnected");
    });

    // Handle GRN index migration (one-time operation)
    await handleGRNIndexMigration();

    return conn;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
};

/**
 * Handle GRN index migration (one-time operation)
 * This allows multiple GRNs per PO for partial receiving
 * @private
 */
const handleGRNIndexMigration = async () => {
  try {
    const collection = mongoose.connection.db.collection("goodsrecievednotes");
    const indexes = await collection.indexes();

    // Find and drop the unique index on purchasingId if it exists
    const uniqueIndex = indexes.find(
      (index) =>
        index.key && index.key.purchasingId === 1 && index.unique === true
    );

    if (uniqueIndex) {
      await collection.dropIndex(uniqueIndex.name);
      console.log(
        `✓ Dropped unique index on purchasingId: ${uniqueIndex.name}`
      );
    }
  } catch (indexError) {
    // Index might not exist, which is fine
    if (indexError.code === 27 || indexError.codeName === "IndexNotFound") {
      // Index doesn't exist, which is expected after first run
    } else {
      console.log(
        "Note: Could not drop purchasingId unique index:",
        indexError.message
      );
    }
  }
};

export default {
  loadDatabase,
};
