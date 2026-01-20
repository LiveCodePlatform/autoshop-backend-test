/**
 * Warehouse Profile Service
 * Business logic layer for WarehouseProfile operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { LocationProfileRepository } from "../repositories/locationProfile.repository.js";
import {
  CreateWarehouseProfileDTO,
  UpdateWarehouseProfileDTO,
  LocationProfileResponseDTO,
  LocationProfileListResponseDTO,
} from "../dtos/locationProfile.dto.js";
import { ValidationError, NotFoundError, CastError } from "../errors/errorTypes.js";
import {
  LOCATION_PROFILE_FIELDS,
  LOCATION_TYPE,
  LOCATION_STATUS,
} from "../types/locationProfile.types.js";
import { validatePhoneNumber } from "../shared/utils/phoneValidation.utils.js";
import mongoose from "mongoose";

export class WarehouseProfileService {
  /**
   * @param {LocationProfileRepository} repository - Injected repository instance
   */
  constructor(repository) {
    this.repository = repository || new LocationProfileRepository();
  }

  /**
   * Create new warehouse profile
   * @param {Object} data - Request data (legacy field names)
   * @returns {Promise<LocationProfileResponseDTO>} Created warehouse profile DTO
   * @throws {ValidationError} If uniqueness check fails or phone validation fails
   */
  async createWarehouseProfile(data) {
    // Transform data using DTO (handles legacy field names)
    const dto = new CreateWarehouseProfileDTO(data);
    const warehouseData = dto.toModel();

    // Business logic: Validate phone number
    const phoneValidation = validatePhoneNumber(
      warehouseData[LOCATION_PROFILE_FIELDS.LOCATION_PHONE],
      "MM"
    );
    if (!phoneValidation.isValid) {
      throw new ValidationError(phoneValidation.error, "warehousePhone");
    }
    // Use formatted phone number
    warehouseData[LOCATION_PROFILE_FIELDS.LOCATION_PHONE] =
      phoneValidation.formattedNumber;

    // Business logic: Check uniqueness of warehouseCode
    if (warehouseData[LOCATION_PROFILE_FIELDS.LOCATION_CODE]) {
      const existingCode = await this.repository.findOne({
        type: LOCATION_TYPE.WAREHOUSE,
        locationCode: warehouseData[LOCATION_PROFILE_FIELDS.LOCATION_CODE],
        isDeleted: false,
      });
      if (existingCode) {
        throw new ValidationError(
          "Warehouse code already exists",
          "warehouseCode"
        );
      }
    }

    // Business logic: Check uniqueness of warehouseName
    if (warehouseData[LOCATION_PROFILE_FIELDS.LOCATION_NAME]) {
      const existingName = await this.repository.findOne({
        type: LOCATION_TYPE.WAREHOUSE,
        locationName: warehouseData[LOCATION_PROFILE_FIELDS.LOCATION_NAME],
        isDeleted: false,
      });
      if (existingName) {
        throw new ValidationError(
          "Warehouse name already exists",
          "warehouseName"
        );
      }
    }

    // Create warehouse profile
    const newWarehouseProfile = await this.repository.create(warehouseData);

    // Return DTO
    return new LocationProfileResponseDTO(newWarehouseProfile);
  }

  /**
   * Get all warehouse profiles with pagination and filters
   * @param {Object} queryParams - Query parameters
   * @returns {Promise<LocationProfileListResponseDTO>} List of warehouse profile DTOs with pagination
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

    // Build query - exclude soft deleted by default, filter by warehouse type
    const query = { type: LOCATION_TYPE.WAREHOUSE };

    if (!includeDeleted || includeDeleted === "false") {
      query[LOCATION_PROFILE_FIELDS.IS_DELETED] = false;
    }

    if (status) {
      query[LOCATION_PROFILE_FIELDS.STATUS] = status;
    }

    if (search) {
      query.$or = [
        {
          [LOCATION_PROFILE_FIELDS.LOCATION_NAME]: {
            $regex: search,
            $options: "i",
          },
        },
        {
          [LOCATION_PROFILE_FIELDS.LOCATION_CODE]: {
            $regex: search,
            $options: "i",
          },
        },
        {
          [LOCATION_PROFILE_FIELDS.LOCATION_ADDRESS]: {
            $regex: search,
            $options: "i",
          },
        },
        {
          [LOCATION_PROFILE_FIELDS.MANAGER_NAME]: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const warehouses = await this.repository.find(query, {
      sort,
      skip,
      limit: limitNum,
    });

    // Get total count for pagination
    const total = await this.repository.countDocuments(query);

    // Return list DTO with pagination
    return new LocationProfileListResponseDTO(warehouses, {
      page: pageNum,
      limit: limitNum,
      total,
    });
  }

  /**
   * Get warehouse profile by ID
   * @param {string} id - Warehouse profile ID
   * @returns {Promise<LocationProfileResponseDTO>} Warehouse profile DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If warehouse profile not found
   */
  async getWarehouseProfileById(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid warehouse profile ID format", "id");
    }

    // Find warehouse profile
    const warehouse = await this.repository.findOne({
      _id: id,
      type: LOCATION_TYPE.WAREHOUSE,
      isDeleted: false,
    });

    if (!warehouse) {
      throw new NotFoundError("Warehouse profile", id);
    }

    // Return DTO
    return new LocationProfileResponseDTO(warehouse);
  }

  /**
   * Update warehouse profile
   * @param {string} id - Warehouse profile ID
   * @param {Object} data - Update data (legacy field names)
   * @returns {Promise<LocationProfileResponseDTO>} Updated warehouse profile DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If warehouse profile not found
   * @throws {ValidationError} If uniqueness check fails, phone validation fails, or no fields to update
   */
  async updateWarehouseProfile(id, data) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid warehouse profile ID format", "id");
    }

    // Check if warehouse exists and is not deleted
    const existingWarehouse = await this.repository.findOne({
      _id: id,
      type: LOCATION_TYPE.WAREHOUSE,
      isDeleted: false,
    });

    if (!existingWarehouse) {
      throw new NotFoundError("Warehouse profile", id);
    }

    // Transform data using DTO (handles legacy field names)
    const dto = new UpdateWarehouseProfileDTO(data);
    const updateData = dto.toUpdateModel();

    // Business logic: Check if warehouseCode is being updated and validate uniqueness
    if (updateData[LOCATION_PROFILE_FIELDS.LOCATION_CODE] !== undefined) {
      const codeToCheck = updateData[LOCATION_PROFILE_FIELDS.LOCATION_CODE];
      if (codeToCheck !== existingWarehouse.locationCode) {
        const existingCode = await this.repository.findOne({
          type: LOCATION_TYPE.WAREHOUSE,
          locationCode: codeToCheck,
          isDeleted: false,
          _id: { $ne: id },
        });
        if (existingCode) {
          throw new ValidationError(
            "Warehouse code already exists",
            "warehouseCode"
          );
        }
      }
    }

    // Business logic: Check if warehouseName is being updated and validate uniqueness
    if (updateData[LOCATION_PROFILE_FIELDS.LOCATION_NAME] !== undefined) {
      const nameToCheck = updateData[LOCATION_PROFILE_FIELDS.LOCATION_NAME];
      if (nameToCheck !== existingWarehouse.locationName) {
        const existingName = await this.repository.findOne({
          type: LOCATION_TYPE.WAREHOUSE,
          locationName: nameToCheck,
          isDeleted: false,
          _id: { $ne: id },
        });
        if (existingName) {
          throw new ValidationError(
            "Warehouse name already exists",
            "warehouseName"
          );
        }
      }
    }

    // Business logic: Validate and format phone number if provided
    if (updateData[LOCATION_PROFILE_FIELDS.LOCATION_PHONE] !== undefined) {
      const phoneValidation = validatePhoneNumber(
        updateData[LOCATION_PROFILE_FIELDS.LOCATION_PHONE],
        "MM"
      );
      if (!phoneValidation.isValid) {
        throw new ValidationError(phoneValidation.error, "warehousePhone");
      }
      // Use formatted phone number
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_PHONE] =
        phoneValidation.formattedNumber;
    }

    // Business logic: Check if there are any fields to update
    if (Object.keys(updateData).length === 0) {
      throw new ValidationError("No valid fields to update", "body");
    }

    // Update the warehouse profile
    const updatedWarehouse = await this.repository.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Return DTO
    return new LocationProfileResponseDTO(updatedWarehouse);
  }
}

export default WarehouseProfileService;
