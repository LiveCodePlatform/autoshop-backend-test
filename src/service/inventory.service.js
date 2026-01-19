/**
 * Inventory Service
 * Business logic layer for Inventory operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { InventoryRepository } from "../repositories/inventory.repository.js";
import {
  CreateInventoryDTO,
  InventoryResponseDTO,
} from "../dtos/inventory.dto.js";
import { ValidationError } from "../errors/errorTypes.js";
import { INVENTORY_FIELDS } from "../types/inventory.types.js";

export class InventoryService {
  constructor() {
    this.repository = new InventoryRepository();
  }

  /**
   * Create new inventory item
   * @param {Object} data - Request data
   * @returns {Promise<InventoryResponseDTO>} Created inventory DTO
   * @throws {ValidationError} If uniqueness check fails
   */
  async createInventory(data) {
    // Transform data using DTO
    const dto = new CreateInventoryDTO(data);
    const inventoryData = dto.toModel();

    // Business logic: Check uniqueness for productCode
    if (inventoryData[INVENTORY_FIELDS.PRODUCT_CODE]) {
      const existingProduct = await this.repository.findOne({
        productCode: inventoryData[INVENTORY_FIELDS.PRODUCT_CODE].toUpperCase(),
      });
      if (existingProduct) {
        throw new ValidationError(
          "Product code already exists",
          INVENTORY_FIELDS.PRODUCT_CODE
        );
      }
    }

    // Business logic: Check uniqueness for SKU
    if (inventoryData[INVENTORY_FIELDS.SKU]) {
      const existingSKU = await this.repository.findOne({
        SKU: inventoryData[INVENTORY_FIELDS.SKU].toUpperCase(),
      });
      if (existingSKU) {
        throw new ValidationError(
          "SKU already exists",
          INVENTORY_FIELDS.SKU
        );
      }
    }

    // Business logic: Check uniqueness for barcode
    if (inventoryData[INVENTORY_FIELDS.BARCODE]) {
      const existingBarcode = await this.repository.findOne({
        barcode: inventoryData[INVENTORY_FIELDS.BARCODE],
      });
      if (existingBarcode) {
        throw new ValidationError(
          "Barcode already exists",
          INVENTORY_FIELDS.BARCODE
        );
      }
    }

    // Business logic: Check uniqueness for saleCode
    if (inventoryData[INVENTORY_FIELDS.SALE_CODE]) {
      const existingSaleCode = await this.repository.findOne({
        saleCode: inventoryData[INVENTORY_FIELDS.SALE_CODE].toUpperCase(),
      });
      if (existingSaleCode) {
        throw new ValidationError(
          "Sale code already exists",
          INVENTORY_FIELDS.SALE_CODE
        );
      }
    }

    // Create inventory
    const newInventory = await this.repository.create(inventoryData);

    // Return DTO
    return new InventoryResponseDTO(newInventory);
  }
}

export default InventoryService;
