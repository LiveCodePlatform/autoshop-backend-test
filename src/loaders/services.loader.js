/**
 * Services Loader
 * Dependency Injection wiring for services and repositories
 *
 * This file creates and wires up all service and repository instances
 * following the Dependency Injection pattern.
 *
 * Usage:
 * import { getInventoryService } from './loaders/services.loader.js';
 * const service = getInventoryService();
 */

import { InventoryRepository } from "../repositories/inventory.repository.js";
import { InventoryService } from "../services/inventory.service.js";
import { StockAuditLogRepository } from "../repositories/stockAuditLog.repository.js";
import { StockAuditLogService } from "../services/stockAuditLog.service.js";
import { LocationProfileRepository } from "../repositories/locationProfile.repository.js";
import { WarehouseProfileService } from "../services/warehouseProfile.service.js";
import { StorefrontProfileService } from "../services/storefrontProfile.service.js";
import { WarehouseInventoryRepository } from "../repositories/warehouseStock.repository.js";
import { WarehouseInventoryService } from "../services/warehouseInventory.service.js";
import { AdminRepository } from "../repositories/admin.repository.js";
import { AdminService } from "../services/admin.service.js";

// ============================================
// Repository Instances (Singleton)
// ============================================
let inventoryRepository = null;
let stockAuditLogRepository = null;
let locationProfileRepository = null;
let warehouseInventoryRepository = null;
let adminRepository = null;

export const getInventoryRepository = () => {
  if (!inventoryRepository) {
    inventoryRepository = new InventoryRepository();
  }
  return inventoryRepository;
};

export const getStockAuditLogRepository = () => {
  if (!stockAuditLogRepository) {
    stockAuditLogRepository = new StockAuditLogRepository();
  }
  return stockAuditLogRepository;
};

export const getLocationProfileRepository = () => {
  if (!locationProfileRepository) {
    locationProfileRepository = new LocationProfileRepository();
  }
  return locationProfileRepository;
};

export const getWarehouseInventoryRepository = () => {
  if (!warehouseInventoryRepository) {
    warehouseInventoryRepository = new WarehouseInventoryRepository();
  }
  return warehouseInventoryRepository;
};

export const getAdminRepository = () => {
  if (!adminRepository) {
    adminRepository = new AdminRepository();
  }
  return adminRepository;
};

// ============================================
// Service Instances (Singleton with DI)
// ============================================
let inventoryService = null;
let stockAuditLogService = null;
let warehouseProfileService = null;
let storefrontProfileService = null;
let warehouseInventoryService = null;
let adminService = null;

export const getInventoryService = () => {
  if (!inventoryService) {
    // Inject repository dependency
    const repository = getInventoryRepository();
    inventoryService = new InventoryService(repository);
  }
  return inventoryService;
};

export const getStockAuditLogService = () => {
  if (!stockAuditLogService) {
    // Inject repository dependency
    const repository = getStockAuditLogRepository();
    stockAuditLogService = new StockAuditLogService(repository);
  }
  return stockAuditLogService;
};

export const getWarehouseProfileService = () => {
  if (!warehouseProfileService) {
    // Inject repository dependency
    const repository = getLocationProfileRepository();
    warehouseProfileService = new WarehouseProfileService(repository);
  }
  return warehouseProfileService;
};

export const getStorefrontProfileService = () => {
  if (!storefrontProfileService) {
    // Inject repository dependency
    const repository = getLocationProfileRepository();
    storefrontProfileService = new StorefrontProfileService(repository);
  }
  return storefrontProfileService;
};

export const getWarehouseInventoryService = () => {
  if (!warehouseInventoryService) {
    // Inject repository dependencies
    const repository = getWarehouseInventoryRepository();
    const inventoryRepository = getInventoryRepository();
    const locationRepository = getLocationProfileRepository();
    const stockAuditLogService = getStockAuditLogService();
    warehouseInventoryService = new WarehouseInventoryService(
      repository,
      inventoryRepository,
      locationRepository,
      stockAuditLogService
    );
  }
  return warehouseInventoryService;
};

export const getAdminService = () => {
  if (!adminService) {
    // Inject repository dependency
    const repository = getAdminRepository();
    adminService = new AdminService(repository);
  }
  return adminService;
};

// ============================================
// Loader Function
// ============================================
export const loadServices = () => {
  console.log("📦 Loading services and repositories...");

  // Initialize all services (this will create singletons)
  getInventoryService();
  getStockAuditLogService();
  getWarehouseProfileService();
  getStorefrontProfileService();
  getWarehouseInventoryService();
  getAdminService();

  console.log("✅ Services and repositories loaded successfully!");
};

// ============================================
// Shutdown Function (for cleanup if needed)
// ============================================
export const shutdownServices = () => {
  console.log("🛑 Shutting down services...");
  // Reset singletons (if needed for testing or cleanup)
  inventoryRepository = null;
  inventoryService = null;
  stockAuditLogRepository = null;
  stockAuditLogService = null;
  locationProfileRepository = null;
  warehouseProfileService = null;
  storefrontProfileService = null;
  warehouseInventoryRepository = null;
  warehouseInventoryService = null;
  adminRepository = null;
  adminService = null;
  console.log("✅ Services shutdown complete");
};

export default {
  loadServices,
  shutdownServices,
  getInventoryRepository,
  getInventoryService,
  getStockAuditLogRepository,
  getStockAuditLogService,
  getLocationProfileRepository,
  getWarehouseProfileService,
  getStorefrontProfileService,
  getWarehouseInventoryRepository,
  getWarehouseInventoryService,
  getAdminRepository,
  getAdminService,
};
