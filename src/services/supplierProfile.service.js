/**
 * Supplier Profile Service
 * Business logic layer for SupplierProfile operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { SupplierProfileRepository } from "../repositories/supplierProfile.repository.js";
import {
  CreateSupplierProfileDTO,
  UpdateSupplierProfileDTO,
  SupplierProfileResponseDTO,
  SupplierProfileListResponseDTO,
} from "../dtos/supplierProfile.dto.js";
import { NotFoundError, CastError, ValidationError } from "../errors/errorTypes.js";
import { SUPPLIER_PROFILE_FIELDS } from "../types/supplierProfile.types.js";
import mongoose from "mongoose";

export class SupplierProfileService {
  /**
   * @param {SupplierProfileRepository} repository - Injected repository instance (optional, fallback creates new instance)
   */
  constructor(repository) {
    this.repository = repository || new SupplierProfileRepository();
  }

  /**
   * Create new supplier profile
   * @param {Object} data - Request data
   * @returns {Promise<SupplierProfileResponseDTO>} Created supplier profile DTO
   */
  async createSupplierProfile(data) {
    // Transform data using DTO
    const dto = new CreateSupplierProfileDTO(data);
    const supplierProfileData = dto.toModel();

    // Create supplier profile
    const newSupplierProfile = await this.repository.create(supplierProfileData);

    // Return DTO
    return new SupplierProfileResponseDTO(newSupplierProfile);
  }

  /**
   * Get all supplier profiles with pagination and filters
   * @param {Object} queryParams - Query parameters (page, limit, search, sortBy, sortOrder, includeDeleted, isDeleted)
   * @returns {Promise<SupplierProfileListResponseDTO>} List of supplier profile DTOs with pagination
   */
  async getAllSupplierProfiles(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDeleted = false,
      isDeleted,
    } = queryParams;

    // Build query
    const query = {};

    // Handle isDeleted filter
    if (isDeleted !== undefined) {
      // If isDeleted is explicitly provided, use its boolean value
      query[SUPPLIER_PROFILE_FIELDS.IS_DELETED] =
        isDeleted === "true" || isDeleted === true;
    } else if (!includeDeleted || includeDeleted === "false") {
      // If includeDeleted is false or not provided, default to non-deleted only
      query[SUPPLIER_PROFILE_FIELDS.IS_DELETED] = false;
    }
    // If includeDeleted is true and isDeleted is not provided, don't filter by isDeleted (show all)

    // Search filter
    if (search) {
      query[SUPPLIER_PROFILE_FIELDS.SUPPLIER_NAME] = {
        $regex: search,
        $options: "i",
      };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const supplierProfiles = await this.repository.find(query, {
      sort,
      skip,
      limit: limitNum,
    });

    // Get total count for pagination
    const total = await this.repository.countDocuments(query);

    // Return list DTO with pagination (DTO expects raw models, transforms internally)
    return new SupplierProfileListResponseDTO(supplierProfiles, {
      page: pageNum,
      limit: limitNum,
      total,
    });
  }

  /**
   * Get supplier profile by ID
   * @param {string} id - Supplier profile ID
   * @returns {Promise<SupplierProfileResponseDTO>} Supplier profile DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If supplier profile not found
   */
  async getSupplierProfileById(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid supplier profile ID format", "id");
    }

    // Find supplier profile
    const supplierProfile = await this.repository.findById(id);

    if (!supplierProfile) {
      throw new NotFoundError("Supplier profile", id);
    }

    // Return DTO
    return new SupplierProfileResponseDTO(supplierProfile);
  }

  /**
   * Update supplier profile
   * @param {string} id - Supplier profile ID
   * @param {Object} data - Update data
   * @returns {Promise<SupplierProfileResponseDTO>} Updated supplier profile DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If supplier profile not found
   */
  async updateSupplierProfile(id, data) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid supplier profile ID format", "id");
    }

    // Check if supplier profile exists
    const existingSupplierProfile = await this.repository.findById(id);
    if (!existingSupplierProfile) {
      throw new NotFoundError("Supplier profile", id);
    }

    // Transform data using DTO
    const dto = new UpdateSupplierProfileDTO(data);
    const updateData = dto.toUpdateModel();

    // Update supplier profile
    const updatedSupplierProfile = await this.repository.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedSupplierProfile) {
      throw new NotFoundError("Supplier profile", id);
    }

    // Return DTO
    return new SupplierProfileResponseDTO(updatedSupplierProfile);
  }

  /**
   * Soft delete supplier profile
   * @param {string} id - Supplier profile ID
   * @returns {Promise<SupplierProfileResponseDTO>} Soft deleted supplier profile DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If supplier profile not found
   * @throws {ValidationError} If supplier profile is already soft deleted
   */
  async softDeleteSupplierProfile(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid supplier profile ID format", "id");
    }

    // Find supplier profile
    const supplierProfile = await this.repository.findById(id);
    if (!supplierProfile) {
      throw new NotFoundError("Supplier profile", id);
    }

    // Business logic: Check if already soft deleted
    if (supplierProfile[SUPPLIER_PROFILE_FIELDS.IS_DELETED]) {
      throw new ValidationError(
        "Supplier profile is already soft deleted",
        SUPPLIER_PROFILE_FIELDS.IS_DELETED
      );
    }

    // Soft delete supplier profile
    const softDeletedSupplierProfile = await this.repository.findByIdAndUpdate(
      id,
      {
        $set: {
          [SUPPLIER_PROFILE_FIELDS.IS_DELETED]: true,
          [SUPPLIER_PROFILE_FIELDS.DELETED_AT]: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!softDeletedSupplierProfile) {
      throw new NotFoundError("Supplier profile", id);
    }

    // Return DTO
    return new SupplierProfileResponseDTO(softDeletedSupplierProfile);
  }

  /**
   * Restore soft deleted supplier profile
   * @param {string} id - Supplier profile ID
   * @returns {Promise<SupplierProfileResponseDTO>} Restored supplier profile DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If supplier profile not found
   * @throws {ValidationError} If supplier profile is not soft deleted
   */
  async restoreSupplierProfile(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid supplier profile ID format", "id");
    }

    // Find supplier profile
    const supplierProfile = await this.repository.findById(id);
    if (!supplierProfile) {
      throw new NotFoundError("Supplier profile", id);
    }

    // Business logic: Check if not soft deleted
    if (!supplierProfile[SUPPLIER_PROFILE_FIELDS.IS_DELETED]) {
      throw new ValidationError(
        "Supplier profile is not soft deleted",
        SUPPLIER_PROFILE_FIELDS.IS_DELETED
      );
    }

    // Restore supplier profile
    const restoredSupplierProfile = await this.repository.findByIdAndUpdate(
      id,
      {
        $set: {
          [SUPPLIER_PROFILE_FIELDS.IS_DELETED]: false,
          [SUPPLIER_PROFILE_FIELDS.DELETED_AT]: null,
        },
      },
      { new: true, runValidators: true }
    );

    if (!restoredSupplierProfile) {
      throw new NotFoundError("Supplier profile", id);
    }

    // Return DTO
    return new SupplierProfileResponseDTO(restoredSupplierProfile);
  }

  /**
   * Hard delete supplier profile
   * @param {string} id - Supplier profile ID
   * @returns {Promise<SupplierProfileResponseDTO>} Deleted supplier profile DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If supplier profile not found
   */
  async deleteSupplierProfile(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid supplier profile ID format", "id");
    }

    // Delete supplier profile
    const deletedSupplierProfile = await this.repository.findByIdAndDelete(id);

    if (!deletedSupplierProfile) {
      throw new NotFoundError("Supplier profile", id);
    }

    // Return DTO
    return new SupplierProfileResponseDTO(deletedSupplierProfile);
  }
}

export default SupplierProfileService;
