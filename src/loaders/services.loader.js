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
import { LocationProfileService } from "../services/locationProfile.service.js";
import { WarehouseProfileService } from "../services/warehouseProfile.service.js";
import { StorefrontProfileService } from "../services/storefrontProfile.service.js";
import { WarehouseInventoryRepository } from "../repositories/warehouseStock.repository.js";
import { WarehouseInventoryService } from "../services/warehouseInventory.service.js";
import { StorefrontInventoryRepository } from "../repositories/storefrontInventory.repository.js";
import { StorefrontInventoryService } from "../services/storefrontInventory.service.js";
import { AdminRepository } from "../repositories/admin.repository.js";
import { AdminService } from "../services/admin.service.js";
import { SupplierProfileRepository } from "../repositories/supplierProfile.repository.js";
import { SupplierProfileService } from "../services/supplierProfile.service.js";
import { CreditPersonaRepository } from "../repositories/creditPersona.repository.js";
import { CreditPersonaService } from "../services/creditPersona.service.js";
import { ExpenseRepository } from "../repositories/expense.repository.js";
import { ExpenseService } from "../services/expense.service.js";
import { PurchasingRepository } from "../repositories/purchasing.repository.js";
import { PurchasingService } from "../services/purchasing.service.js";
import { TransferRepository } from "../repositories/transfer.repository.js";
import { TransferService } from "../services/transfer.service.js";
import { GoodsRecievedNoteRepository } from "../repositories/goodsRecievedNote.repository.js";
import { GoodsRecievedNoteService } from "../services/goodsRecievedNote.service.js";
import { CreditRecordRepository } from "../repositories/creditRecord.repository.js";
import { CreditRecordService } from "../services/creditRecord.service.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { OrderService } from "../services/order.service.js";
import { SaleReportService } from "../services/saleReport.service.js";
import { SocialMediaSaleInventoryRepository } from "../repositories/socialMediaSaleInventory.repository.js";
import { SocialMediaSaleInventoryService } from "../services/socialMediaSaleInventory.service.js";

// ============================================
// Repository Instances (Singleton)
// ============================================
let inventoryRepository = null;
let stockAuditLogRepository = null;
let locationProfileRepository = null;
let warehouseInventoryRepository = null;
let storefrontInventoryRepository = null;
let adminRepository = null;
let supplierProfileRepository = null;
let creditPersonaRepository = null;
let expenseRepository = null;
let purchasingRepository = null;
let transferRepository = null;
let goodsRecievedNoteRepository = null;
let creditRecordRepository = null;
let orderRepository = null;
let socialMediaSaleInventoryRepository = null;

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

export const getStorefrontInventoryRepository = () => {
  if (!storefrontInventoryRepository) {
    storefrontInventoryRepository = new StorefrontInventoryRepository();
  }
  return storefrontInventoryRepository;
};

export const getAdminRepository = () => {
  if (!adminRepository) {
    adminRepository = new AdminRepository();
  }
  return adminRepository;
};

export const getSupplierProfileRepository = () => {
  if (!supplierProfileRepository) {
    supplierProfileRepository = new SupplierProfileRepository();
  }
  return supplierProfileRepository;
};

export const getCreditPersonaRepository = () => {
  if (!creditPersonaRepository) {
    creditPersonaRepository = new CreditPersonaRepository();
  }
  return creditPersonaRepository;
};

export const getExpenseRepository = () => {
  if (!expenseRepository) {
    expenseRepository = new ExpenseRepository();
  }
  return expenseRepository;
};

export const getPurchasingRepository = () => {
  if (!purchasingRepository) {
    purchasingRepository = new PurchasingRepository();
  }
  return purchasingRepository;
};

export const getTransferRepository = () => {
  if (!transferRepository) {
    transferRepository = new TransferRepository();
  }
  return transferRepository;
};

export const getGoodsRecievedNoteRepository = () => {
  if (!goodsRecievedNoteRepository) {
    goodsRecievedNoteRepository = new GoodsRecievedNoteRepository();
  }
  return goodsRecievedNoteRepository;
};

export const getCreditRecordRepository = () => {
  if (!creditRecordRepository) {
    creditRecordRepository = new CreditRecordRepository();
  }
  return creditRecordRepository;
};

export const getOrderRepository = () => {
  if (!orderRepository) {
    orderRepository = new OrderRepository();
  }
  return orderRepository;
};

export const getSocialMediaSaleInventoryRepository = () => {
  if (!socialMediaSaleInventoryRepository) {
    socialMediaSaleInventoryRepository = new SocialMediaSaleInventoryRepository();
  }
  return socialMediaSaleInventoryRepository;
};

// ============================================
// Service Instances (Singleton with DI)
// ============================================
let inventoryService = null;
let stockAuditLogService = null;
let locationProfileService = null;
let warehouseProfileService = null;
let storefrontProfileService = null;
let warehouseInventoryService = null;
let storefrontInventoryService = null;
let adminService = null;
let supplierProfileService = null;
let creditPersonaService = null;
let expenseService = null;
let purchasingService = null;
let transferService = null;
let goodsRecievedNoteService = null;
let creditRecordService = null;
let orderService = null;
let saleReportService = null;
let socialMediaSaleInventoryService = null;

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

export const getLocationProfileService = () => {
  if (!locationProfileService) {
    // Inject repository dependency
    const repository = getLocationProfileRepository();
    locationProfileService = new LocationProfileService(repository);
  }
  return locationProfileService;
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

export const getStorefrontInventoryService = () => {
  if (!storefrontInventoryService) {
    // Inject repository dependencies
    const repository = getStorefrontInventoryRepository();
    const inventoryRepository = getInventoryRepository();
    const locationRepository = getLocationProfileRepository();
    const stockAuditLogService = getStockAuditLogService();
    storefrontInventoryService = new StorefrontInventoryService(
      repository,
      inventoryRepository,
      locationRepository,
      stockAuditLogService
    );
  }
  return storefrontInventoryService;
};

export const getAdminService = () => {
  if (!adminService) {
    // Inject repository dependency
    const repository = getAdminRepository();
    adminService = new AdminService(repository);
  }
  return adminService;
};

export const getSupplierProfileService = () => {
  if (!supplierProfileService) {
    // Inject repository dependency
    const repository = getSupplierProfileRepository();
    supplierProfileService = new SupplierProfileService(repository);
  }
  return supplierProfileService;
};

export const getCreditPersonaService = () => {
  if (!creditPersonaService) {
    // Inject repository dependency
    const repository = getCreditPersonaRepository();
    creditPersonaService = new CreditPersonaService(repository);
  }
  return creditPersonaService;
};

export const getExpenseService = () => {
  if (!expenseService) {
    // Inject repository dependency
    const repository = getExpenseRepository();
    expenseService = new ExpenseService(repository);
  }
  return expenseService;
};

export const getPurchasingService = () => {
  if (!purchasingService) {
    // Inject repository dependencies
    const repository = getPurchasingRepository();
    const inventoryRepository = getInventoryRepository();
    purchasingService = new PurchasingService(repository, inventoryRepository);
  }
  return purchasingService;
};

export const getTransferService = () => {
  if (!transferService) {
    // Inject repository dependencies
    const repository = getTransferRepository();
    const locationRepository = getLocationProfileRepository();
    const inventoryRepository = getInventoryRepository();
    const warehouseInventoryRepository = getWarehouseInventoryRepository();
    const storefrontInventoryRepository = getStorefrontInventoryRepository();
    const goodsRecievedNoteRepository = getGoodsRecievedNoteRepository();
    transferService = new TransferService(
      repository,
      locationRepository,
      inventoryRepository,
      warehouseInventoryRepository,
      storefrontInventoryRepository,
      goodsRecievedNoteRepository
    );
  }
  return transferService;
};

export const getGoodsRecievedNoteService = () => {
  if (!goodsRecievedNoteService) {
    // Inject repository dependencies
    const repository = getGoodsRecievedNoteRepository();
    const purchasingRepository = getPurchasingRepository();
    const inventoryRepository = getInventoryRepository();
    goodsRecievedNoteService = new GoodsRecievedNoteService(
      repository,
      purchasingRepository,
      inventoryRepository
    );
  }
  return goodsRecievedNoteService;
};

export const getCreditRecordService = () => {
  if (!creditRecordService) {
    // Inject repository dependencies
    const repository = getCreditRecordRepository();
    const orderRepository = getOrderRepository();
    const creditPersonaRepository = getCreditPersonaRepository();
    creditRecordService = new CreditRecordService(repository, orderRepository, creditPersonaRepository);
  }
  return creditRecordService;
};

export const getOrderService = () => {
  if (!orderService) {
    // Inject repository dependencies
    const repository = getOrderRepository();
    const storefrontInventoryRepository = getStorefrontInventoryRepository();
    const locationProfileRepository = getLocationProfileRepository();
    const inventoryRepository = getInventoryRepository();
    const creditPersonaRepository = getCreditPersonaRepository();
    orderService = new OrderService(
      repository,
      storefrontInventoryRepository,
      locationProfileRepository,
      inventoryRepository,
      creditPersonaRepository
    );
  }
  return orderService;
};

export const getSaleReportService = () => {
  if (!saleReportService) {
    // Inject repository dependencies
    const orderRepository = getOrderRepository();
    const locationProfileRepository = getLocationProfileRepository();
    const creditRecordRepository = getCreditRecordRepository();
    saleReportService = new SaleReportService(
      orderRepository,
      locationProfileRepository,
      creditRecordRepository
    );
  }
  return saleReportService;
};

export const getSocialMediaSaleInventoryService = () => {
  if (!socialMediaSaleInventoryService) {
    // Inject repository dependencies
    const repository = getSocialMediaSaleInventoryRepository();
    const inventoryRepository = getInventoryRepository();
    socialMediaSaleInventoryService = new SocialMediaSaleInventoryService(
      repository,
      inventoryRepository
    );
  }
  return socialMediaSaleInventoryService;
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
  getSupplierProfileService();
  getCreditPersonaService();
  getExpenseService();
  getPurchasingService();
  getTransferService();
  getGoodsRecievedNoteService();
  getCreditRecordService();
  getOrderService();
  getSaleReportService();
  getSocialMediaSaleInventoryService();

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
  supplierProfileRepository = null;
  supplierProfileService = null;
  creditPersonaRepository = null;
  creditPersonaService = null;
  expenseRepository = null;
  expenseService = null;
  purchasingRepository = null;
  purchasingService = null;
  transferRepository = null;
  transferService = null;
  goodsRecievedNoteRepository = null;
  goodsRecievedNoteService = null;
  creditRecordRepository = null;
  creditRecordService = null;
  orderRepository = null;
  orderService = null;
  saleReportService = null;
  socialMediaSaleInventoryRepository = null;
  socialMediaSaleInventoryService = null;
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
  getSupplierProfileRepository,
  getSupplierProfileService,
  getCreditPersonaRepository,
  getCreditPersonaService,
  getExpenseRepository,
  getExpenseService,
  getPurchasingRepository,
  getPurchasingService,
  getTransferRepository,
  getTransferService,
  getGoodsRecievedNoteRepository,
  getGoodsRecievedNoteService,
  getCreditRecordRepository,
  getCreditRecordService,
  getOrderRepository,
  getOrderService,
  getSaleReportService,
  getSocialMediaSaleInventoryRepository,
  getSocialMediaSaleInventoryService,
};
