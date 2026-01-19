/**
 * Database Configuration
 * Contains database connection settings and configuration
 * This is configuration only - no actual connection happens here
 */

import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

/**
 * Database Configuration Object
 */
export const dbConfig = {
  uri: process.env.MONGODB_URI,
  // Mongoose global settings (not connection options)
  mongooseOptions: {
    strictQuery: false,
  },
  // MongoDB connection options (passed to mongoose.connect())
  connectionOptions: {
    // Add valid MongoDB connection options here if needed
    // maxPoolSize: 10,
    // serverSelectionTimeoutMS: 5000,
    // socketTimeoutMS: 45000,
  },
};

/**
 * Validate database configuration
 * @throws {Error} If required configuration is missing
 */
export const validateDbConfig = () => {
  if (!dbConfig.uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }
  return true;
};

export default dbConfig;
