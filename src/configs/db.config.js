import mongoose from "mongoose";
import dotenv from "dotenv";
import OnlineStorefront from "../models/onlineStorefront.model.js";
dotenv.config();

export const Db = async () => {
  try {
    mongoose.set("strictQuery", false);
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Database Connected: ${conn.connection.host}`);

    // Drop unique index on purchasingId for GRN model (one-time migration)
    // This allows multiple GRNs per PO for partial receiving
    try {
      const collection =
        mongoose.connection.db.collection("goodsrecievednotes");
      const indexes = await collection.indexes();

      // Find and drop the unique index on purchasingId if it exists
      const uniqueIndex = indexes.find(
        (index) =>
          index.key && index.key.purchasingId === 1 && index.unique === true,
      );

      if (uniqueIndex) {
        await collection.dropIndex(uniqueIndex.name);
        console.log(
          `✓ Dropped unique index on purchasingId: ${uniqueIndex.name}`,
        );
      }
    } catch (indexError) {
      // Index might not exist, which is fine
      if (indexError.code === 27 || indexError.codeName === "IndexNotFound") {
        // Index doesn't exist, which is expected after first run
      } else {
        console.log(
          "Note: Could not drop purchasingId unique index:",
          indexError.message,
        );
      }
    }

    // Ensure default online storefront exists (singleton)
    try {
      const existing = await OnlineStorefront.findOne({
        singletonKey: "default",
        isDeleted: false,
      });
      if (!existing) {
        await OnlineStorefront.create({
          singletonKey: "default",
          name: "Online Storefront",
          description: "Default online storefront",
          status: "active",
        });
        console.log("✓ Default online storefront created");
      } else {
        console.log("✓ Default online storefront already exists");
      }
    } catch (osError) {
      console.log(
        "Note: Could not create default online storefront:",
        osError.message,
      );
    }
  } catch (error) {
    console.log("Database connection failed:", error.message);
    process.exit(1);
  }
};

export default Db;
