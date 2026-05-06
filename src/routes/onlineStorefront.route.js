import express from "express";
import {
  getOnlineStorefront,
  updateOnlineStorefront,
  getAllOnlineStorefrontInventory,
  getOnlineStorefrontInventoryById,
  transferToOnlineStorefront,
  updateOnlineStorefrontQuantity,
  addProductsToOnlineStorefront,
} from "../controllers/onlineStorefront.controller.js";
import {
  protect,
  permissionGranted,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// Online storefront profile (singleton)
router.get(
  "/online-storefront",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  getOnlineStorefront,
);

router.patch(
  "/online-storefront",
  protect,
  permissionGranted("owner", "admin"),
  updateOnlineStorefront,
);

// Online storefront inventory
router.get("/online-storefront/inventory", getAllOnlineStorefrontInventory);

router.get(
  "/online-storefront/inventory/:id",
  getOnlineStorefrontInventoryById,
);

router.post(
  "/online-storefront/inventory",
  protect,
  permissionGranted("owner", "admin"),
  addProductsToOnlineStorefront,
);

router.patch(
  "/online-storefront/inventory/:id/quantity",
  protect,
  permissionGranted("owner", "admin"),
  updateOnlineStorefrontQuantity,
);

// Transfer stock from warehouse to online storefront
router.post(
  "/online-storefront/transfer",
  protect,
  permissionGranted("owner", "admin"),
  transferToOnlineStorefront,
);

export default router;
