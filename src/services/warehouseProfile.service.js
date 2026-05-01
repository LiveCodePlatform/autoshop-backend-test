/**
 * Warehouse Profile Service
 * Business logic layer for WarehouseProfile operations
 * Uses repositories for data access and DTOs for data transformation
 */

import {
  ValidationError,
  NotFoundError,
  CastError,
} from "../errors/errorTypes.js";
import { validatePhoneNumber } from "../shared/utils/phoneValidation.utils.js";
import mongoose from "mongoose";
import { LocationProfileRepository } from "../repositories/locationProfile.repository.js";
import {
  CreateWarehouseProfileDTO,
  UpdateWarehouseProfileDTO,
  LocationProfileResponseDTO,
  LocationProfileListResponseDTO,
} from "../dtos/locationProfile.dto.js";

export class WarehouseProfileService {
  /**
   * @param {LocationProfileRepository} repository - Injected repository instance (optional, fallback creates new instance)
   */
  constructor(repository) {
    this.repository = repository || new LocationProfileRepository();
  }

  /**
   * Create new warehouse profile
   * Matches legacy logic exactly
   * @param {Object} data - Request data (warehouseCode, warehouseName, warehouseAddress, warehousePhone, warehouseEmail, managerName, status, description, notes)
   * @returns {Promise<Object>} Created warehouse profile
   * @throws {ValidationError} If uniqueness check fails or phone validation fails
   */
  async createWarehouseProfile(data) {
    const {
      warehouseCode,
      warehouseName,
      warehouseAddress,
      warehousePhone,
      warehouseEmail,
      managerName,
      status,
      description,
      notes,
    } = data;

    // Check if warehouseCode already exists (matches legacy exactly - uses repository)
    if (warehouseCode) {
      const existingCode = await this.repository.findOne({
        type: "warehouse",
        locationCode: warehouseCode.toUpperCase(),
        isDeleted: false,
      });
      if (existingCode) {
        throw new ValidationError("Warehouse code already exists");
      }
    }

    // Check if warehouseName already exists (matches legacy exactly - uses repository)
    if (warehouseName) {
      const existingName = await this.repository.findOne({
        type: "warehouse",
        locationName: warehouseName.trim(),
        isDeleted: false,
      });
      if (existingName) {
        throw new ValidationError("Warehouse name already exists");
      }
    }

    // Validate phone number (matches legacy exactly)
    const phoneValidation = validatePhoneNumber(warehousePhone, "MM");
    if (!phoneValidation.isValid) {
      throw new ValidationError(phoneValidation.error);
    }

    // Use formatted phone number in data for DTO
    const dataWithFormattedPhone = {
      ...data,
      warehousePhone: phoneValidation.formattedNumber,
    };

    // Transform data using DTO
    const dto = new CreateWarehouseProfileDTO(dataWithFormattedPhone);

    // Create warehouse profile (matches legacy exactly - uses repository)
    const newWarehouseProfile = await this.repository.create(dto.toModel());

    // Return DTO
    return new LocationProfileResponseDTO(newWarehouseProfile);
  }

  /**
   * Get all warehouse profiles with pagination and filters
   * Matches legacy logic exactly
   * @param {Object} queryParams - Query parameters
   * @returns {Promise<Object>} List of warehouse profiles with pagination
   */
  async getAllWarehouseProfiles(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDeleted = false,
    } = queryParams;

    // Build query - exclude soft deleted by default, filter by warehouse type (matches legacy exactly)
    const query = { type: "warehouse" };

    if (!includeDeleted || includeDeleted === "false") {
      query.isDeleted = false;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { locationName: { $regex: search, $options: "i" } },
        { locationCode: { $regex: search, $options: "i" } },
        { locationAddress: { $regex: search, $options: "i" } },
        { managerName: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query (matches legacy exactly - uses repository)
    const warehouses = await this.repository.find(query, {
      sort,
      skip,
      limit: limitNum,
    });

    // Get total count for pagination
    const total = await this.repository.countDocuments(query);

    return new LocationProfileListResponseDTO(warehouses, {
      page: pageNum,
      limit: limitNum,
      total: total,
    });
  }

  /**
   * Get warehouse profile by ID
   * Matches legacy logic exactly
   * @param {string} id - Warehouse profile ID
   * @returns {Promise<Object>} Warehouse profile
   * @throws {ValidationError} If invalid ID format
   * @throws {NotFoundError} If warehouse profile not found
   */
  async getWarehouseProfileById(id) {
    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid warehouse profile ID format");
    }

    // Find warehouse profile (matches legacy exactly - uses repository)
    const warehouse = await this.repository.findOne({
      _id: id,
      type: "warehouse",
      isDeleted: false,
    });

    if (!warehouse) {
      throw new NotFoundError("Warehouse profile not found", id);
    }

    return new LocationProfileResponseDTO(warehouse);
  }

  /**
   * Update warehouse profile
   * Matches legacy logic exactly
   * @param {string} id - Warehouse profile ID
   * @param {Object} data - Update data (warehouseCode, warehouseName, warehouseAddress, warehousePhone, warehouseEmail, managerName, status, description, notes)
   * @returns {Promise<Object>} Updated warehouse profile
   * @throws {ValidationError} If invalid ID format, uniqueness check fails, phone validation fails, or no fields to update
   * @throws {NotFoundError} If warehouse profile not found
   */
  async updateWarehouseProfile(id, data) {
    const {
      warehouseCode,
      warehouseName,
      warehouseAddress,
      warehousePhone,
      warehouseEmail,
      managerName,
      status,
      description,
      notes,
    } = data;

    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid warehouse profile ID format");
    }

    // Check if warehouse exists and is not deleted (matches legacy exactly - uses repository)
    const existingWarehouse = await this.repository.findOne({
      _id: id,
      type: "warehouse",
      isDeleted: false,
    });

    if (!existingWarehouse) {
      throw new NotFoundError("Warehouse profile not found", id);
    }

    // Build update fields object (matches legacy exactly - field by field)
    const updateFields = {};

    // Check if warehouseCode is being updated and validate uniqueness (matches legacy exactly)
    if (warehouseCode !== undefined) {
      const codeToCheck = warehouseCode.toUpperCase().trim();
      if (codeToCheck !== existingWarehouse.locationCode) {
        const existingCode = await this.repository.findOne({
          type: "warehouse",
          locationCode: codeToCheck,
          isDeleted: false,
          _id: { $ne: id },
        });
        if (existingCode) {
          throw new ValidationError("Warehouse code already exists");
        }
      }
      updateFields.locationCode = codeToCheck;
    }

    // Check if warehouseName is being updated and validate uniqueness (matches legacy exactly)
    if (warehouseName !== undefined) {
      const nameToCheck = warehouseName.trim();
      if (nameToCheck !== existingWarehouse.locationName) {
        const existingName = await this.repository.findOne({
          type: "warehouse",
          locationName: nameToCheck,
          isDeleted: false,
          _id: { $ne: id },
        });
        if (existingName) {
          throw new ValidationError("Warehouse name already exists");
        }
      }
      updateFields.locationName = nameToCheck;
    }

    // Update address if provided (matches legacy exactly)
    if (warehouseAddress !== undefined) {
      updateFields.locationAddress = warehouseAddress.trim();
    }

    // Validate and update phone number if provided (matches legacy exactly)
    if (warehousePhone !== undefined) {
      const phoneValidation = validatePhoneNumber(warehousePhone, "MM");
      if (!phoneValidation.isValid) {
        throw new ValidationError(phoneValidation.error);
      }
      updateFields.locationPhone = phoneValidation.formattedNumber;
    }

    // Update email if provided (matches legacy exactly)
    if (warehouseEmail !== undefined) {
      updateFields.locationEmail = warehouseEmail
        ? warehouseEmail.toLowerCase().trim()
        : null;
    }

    // Update manager name if provided (matches legacy exactly)
    if (managerName !== undefined) {
      updateFields.managerName = managerName ? managerName.trim() : null;
    }

    // Update status if provided (matches legacy exactly)
    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) {
        throw new ValidationError(
          "Status must be either 'active' or 'inactive'",
        );
      }
      updateFields.status = status;
    }

    // Update description if provided (matches legacy exactly)
    if (description !== undefined) {
      updateFields.description = description.trim();
    }

    // Update notes if provided (matches legacy exactly)
    if (notes !== undefined) {
      updateFields.notes = notes.trim();
    }

    // Check if there are any fields to update (matches legacy exactly)
    if (Object.keys(updateFields).length === 0) {
      throw new ValidationError("No valid fields to update");
    }

    // Use DTO for phone formatting if phone is being updated
    let updateData = updateFields;
    if (warehousePhone !== undefined) {
      const dataWithFormattedPhone = {
        ...data,
        warehousePhone: updateFields.locationPhone,
      };
      const dto = new UpdateWarehouseProfileDTO(dataWithFormattedPhone);
      updateData = dto.toUpdateModel();
      // Merge with other fields that DTO might not handle
      Object.keys(updateFields).forEach((key) => {
        if (updateData[key] === undefined && updateFields[key] !== undefined) {
          updateData[key] = updateFields[key];
        }
      });
    }

    // Update the warehouse profile (matches legacy exactly - uses repository)
    const updatedWarehouse = await this.repository.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    // Return DTO
    return new LocationProfileResponseDTO(updatedWarehouse);
  }
}

export default WarehouseProfileService;
