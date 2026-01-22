/**
 * Supplier Profile Service
 * Business logic layer for SupplierProfile operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { NotFoundError, CastError, ValidationError } from "../errors/errorTypes.js";
import mongoose from "mongoose";
import { SupplierProfileRepository } from "../repositories/supplierProfile.repository.js";
import {
  CreateSupplierProfileDTO,
  UpdateSupplierProfileDTO,
  SupplierProfileResponseDTO,
  SupplierProfileListResponseDTO,
} from "../dtos/supplierProfile.dto.js";

export class SupplierProfileService {
  /**
   * @param {SupplierProfileRepository} repository - Injected repository instance (optional, fallback creates new instance)
   */
  constructor(repository) {
    this.repository = repository || new SupplierProfileRepository();
  }

  /**
   * Create new supplier profile
   * Matches legacy logic exactly
   * @param {Object} data - Request data (supplierName, contactNumber)
   * @returns {Promise<Object>} Created supplier profile
   */
  async createSupplierProfile(data) {
    const { supplierName, contactNumber } = data;

    // Validate required fields (matches legacy exactly)
    if (!supplierName || !contactNumber) {
      throw new ValidationError("All fields are required");
    }

    // Transform data using DTO
    const dto = new CreateSupplierProfileDTO(data);
    
    // Create supplier profile (matches legacy exactly - uses repository)
    const supplier = await this.repository.create(dto.toModel());

    // Return DTO
    return new SupplierProfileResponseDTO(supplier);
  }

  /**
   * Get all supplier profiles with pagination and filters
   * Matches legacy logic exactly
   * @param {Object} queryParams - Query parameters (page, limit, search, sortBy, sortOrder, includeDeleted, isDeleted)
   * @returns {Promise<Object>} List of supplier profiles with pagination
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

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    let query = {};

    // Handle isDeleted filter (matches legacy exactly)
    if (isDeleted !== undefined) {
      // If isDeleted is explicitly provided, use its boolean value
      query.isDeleted = isDeleted === "true" || isDeleted === true;
    } else if (!includeDeleted || includeDeleted === "false") {
      // If includeDeleted is false or not provided, default to non-deleted only
      query.isDeleted = false;
    }
    // If includeDeleted is true and isDeleted is not provided, don't filter by isDeleted (show all)

    if (search) {
      query.supplierName = { $regex: search, $options: "i" };
    }

    // Execute query (matches legacy exactly - uses repository)
    let suppliers = await this.repository.find(query, {
      sort,
      skip,
      limit: limitNum,
    });
    let total = await this.repository.countDocuments(query);

    return new SupplierProfileListResponseDTO(suppliers, {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
    });
  }

  /**
   * Get supplier profile by ID
   * Matches legacy logic exactly
   * @param {string} id - Supplier profile ID
   * @returns {Promise<Object>} Supplier profile
   * @throws {NotFoundError} If supplier profile not found
   */
  async getSupplierProfileById(id) {
    // Find supplier profile (matches legacy exactly - uses repository)
    const supplier = await this.repository.findById(id);
    if (!supplier) {
      throw new NotFoundError("Supplier profile not found", id);
    }
    return new SupplierProfileResponseDTO(supplier);
  }

  /**
   * Update supplier profile
   * Matches legacy logic exactly
   * @param {string} id - Supplier profile ID
   * @param {Object} data - Update data (supplierName, contactNumber)
   * @returns {Promise<Object>} Updated supplier profile
   * @throws {ValidationError} If invalid ID format
   * @throws {NotFoundError} If supplier profile not found
   */
  async updateSupplierProfile(id, data) {
    const { supplierName, contactNumber } = data;

    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid supplier profile ID format");
    }

    // Transform data using DTO
    const dto = new UpdateSupplierProfileDTO(data);
    const updateData = dto.toUpdateModel();

    // Update supplier profile (matches legacy exactly - uses repository with $set)
    const supplier = await this.repository.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!supplier) {
      throw new NotFoundError("Supplier profile not found", id);
    }

    // Return DTO
    return new SupplierProfileResponseDTO(supplier);
  }

  /**
   * Soft delete supplier profile
   * Matches legacy logic exactly
   * @param {string} id - Supplier profile ID
   * @returns {Promise<Object>} Soft deleted supplier profile
   * @throws {ValidationError} If invalid ID format or already soft deleted
   * @throws {NotFoundError} If supplier profile not found
   */
  async softDeleteSupplierProfile(id) {
    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid supplier profile ID format");
    }

    // Find supplier profile (matches legacy exactly - uses repository)
    const supplier = await this.repository.findById(id);
    if (!supplier) {
      throw new NotFoundError("Supplier profile not found", id);
    }

    // Check if already soft deleted (matches legacy exactly)
    if (supplier.isDeleted) {
      throw new ValidationError("Supplier profile is already soft deleted");
    }

    // Soft delete supplier profile (matches legacy exactly - uses Date.now() instead of new Date())
    const softDeletedSupplier = await this.repository.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true, deletedAt: Date.now() } },
      { new: true, runValidators: true }
    );

    if (!softDeletedSupplier) {
      throw new NotFoundError("Supplier profile not found", id);
    }

    // Return DTO
    return new SupplierProfileResponseDTO(softDeletedSupplier);
  }

  /**
   * Restore soft deleted supplier profile
   * Matches legacy logic exactly
   * @param {string} id - Supplier profile ID
   * @returns {Promise<Object>} Restored supplier profile
   * @throws {ValidationError} If invalid ID format or not soft deleted
   * @throws {NotFoundError} If supplier profile not found
   */
  async restoreSupplierProfile(id) {
    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid supplier profile ID format");
    }

    // Find supplier profile (matches legacy exactly - uses repository)
    const supplier = await this.repository.findById(id);
    if (!supplier) {
      throw new NotFoundError("Supplier profile not found", id);
    }

    // Check if not soft deleted (matches legacy exactly)
    if (!supplier.isDeleted) {
      throw new ValidationError("Supplier profile is not soft deleted");
    }

    // Restore supplier profile (matches legacy exactly - uses repository)
    const restoredSupplier = await this.repository.findByIdAndUpdate(
      id,
      { $set: { isDeleted: false, deletedAt: null } },
      { new: true, runValidators: true }
    );

    if (!restoredSupplier) {
      throw new NotFoundError("Supplier profile not found", id);
    }

    // Return DTO
    return new SupplierProfileResponseDTO(restoredSupplier);
  }

  /**
   * Hard delete supplier profile
   * Matches legacy logic exactly
   * @param {string} id - Supplier profile ID
   * @returns {Promise<Object>} Deleted supplier profile
   * @throws {ValidationError} If invalid ID format
   * @throws {NotFoundError} If supplier profile not found
   */
  async deleteSupplierProfile(id) {
    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid supplier profile ID format");
    }

    // Delete supplier profile (matches legacy exactly - uses repository)
    const deletedSupplier = await this.repository.findByIdAndDelete(id);
    if (!deletedSupplier) {
      throw new NotFoundError("Supplier profile not found", id);
    }

    // Return DTO
    return new SupplierProfileResponseDTO(deletedSupplier);
  }
}

export default SupplierProfileService;
