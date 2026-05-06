import express from "express";
import {
  createOnlineOrder,
  getAllOnlineOrders,
  getOnlineOrderById,
  updateOnlineOrderStatus,
  addOnlineOrderItems,
  removeOnlineOrderItems,
} from "../controllers/onlineOrder.controller.js";
import {
  protect,
  permissionGranted,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// Public route for placing orders (no protect middleware)
router.post("/online-orders", createOnlineOrder);

// Admin/Owner/Cashier routes for managing online orders
router.get(
  "/online-orders",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  getAllOnlineOrders,
);

router.get(
  "/online-orders/:id",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  getOnlineOrderById,
);

// Singular alias as requested by user
router.get(
  "/online-order/:id",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  getOnlineOrderById,
);

router.patch(
  "/online-orders/:id/status",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  updateOnlineOrderStatus,
);

router.post(
  "/online-orders/:id/items/add",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  addOnlineOrderItems,
);

router.post(
  "/online-orders/:id/items/remove",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  removeOnlineOrderItems,
);

export default router;
