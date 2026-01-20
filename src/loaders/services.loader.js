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

// ============================================
// Repository Instances (Singleton)
// ============================================
let inventoryRepository = null;

export const getInventoryRepository = () => {
  if (!inventoryRepository) {
    inventoryRepository = new InventoryRepository();
  }
  return inventoryRepository;
};

// ============================================
// Service Instances (Singleton with DI)
// ============================================
let inventoryService = null;

export const getInventoryService = () => {
  if (!inventoryService) {
    // Inject repository dependency
    const repository = getInventoryRepository();
    inventoryService = new InventoryService(repository);
  }
  return inventoryService;
};

// ============================================
// Loader Function
// ============================================
export const loadServices = () => {
  console.log("📦 Loading services and repositories...");

  // Initialize all services (this will create singletons)
  getInventoryService();

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
  console.log("✅ Services shutdown complete");
};

export default {
  loadServices,
  shutdownServices,
  getInventoryRepository,
  getInventoryService,
};
