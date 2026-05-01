/**
 * Storefront Profile Service
 * Business logic layer for StorefrontProfile operations
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
  CreateStorefrontProfileDTO,
  UpdateStorefrontProfileDTO,
  LocationProfileResponseDTO,
  LocationProfileListResponseDTO,
} from "../dtos/locationProfile.dto.js";

export class StorefrontProfileService {
  /**
   * @param {LocationProfileRepository} repository - Injected repository instance (optional, fallback creates new instance)
   */
  constructor(repository) {
    this.repository = repository || new LocationProfileRepository();
  }

  /**
   * Create new storefront profile
   * Matches legacy logic exactly
   * @param {Object} data - Request data (storefrontCode, storefrontName, storefrontAddress, storefrontPhone, storefrontEmail, managerName, status, description, notes)
   * @returns {Promise<Object>} Created storefront profile
   * @throws {ValidationError} If uniqueness check fails or phone validation fails
   */
  async createStorefrontProfile(data) {
    const {
      storefrontCode,
      storefrontName,
      storefrontAddress,
      storefrontPhone,
      storefrontEmail,
      managerName,
      status,
      description,
      notes,
    } = data;

    // Check if storefrontCode already exists (matches legacy exactly - uses repository)
    if (storefrontCode) {
      const existingCode = await this.repository.findOne({
        type: "storefront",
        locationCode: storefrontCode.toUpperCase(),
        isDeleted: false,
      });
      if (existingCode) {
        throw new ValidationError("Storefront code already exists");
      }
    }

    // Check if storefrontName already exists (matches legacy exactly - uses repository)
    if (storefrontName) {
      const existingName = await this.repository.findOne({
        type: "storefront",
        locationName: storefrontName.trim(),
        isDeleted: false,
      });
      if (existingName) {
        throw new ValidationError("Storefront name already exists");
      }
    }

    // Validate phone number (matches legacy exactly)
    const phoneValidation = validatePhoneNumber(storefrontPhone, "MM");
    if (!phoneValidation.isValid) {
      throw new ValidationError(phoneValidation.error);
    }

    // Use formatted phone number in data for DTO
    const dataWithFormattedPhone = {
      ...data,
      storefrontPhone: phoneValidation.formattedNumber,
    };

    // Transform data using DTO
    const dto = new CreateStorefrontProfileDTO(dataWithFormattedPhone);

    // Create storefront profile (matches legacy exactly - uses repository)
    const newStorefrontProfile = await this.repository.create(dto.toModel());

    // Return DTO
    return new LocationProfileResponseDTO(newStorefrontProfile);
  }

  /**
   * Get all storefront profiles with pagination and filters
   * Matches legacy logic exactly
   * @param {Object} queryParams - Query parameters
   * @returns {Promise<Object>} List of storefront profiles with pagination
   */
  async getAllStorefrontProfiles(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDeleted = false,
    } = queryParams;

    // Build query - exclude soft deleted by default, filter by storefront type (matches legacy exactly)
    const query = { type: "storefront" };

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
    const storefronts = await this.repository.find(query, {
      sort,
      skip,
      limit: limitNum,
    });

    // Get total count for pagination
    const total = await this.repository.countDocuments(query);

    return new LocationProfileListResponseDTO(storefronts, {
      page: pageNum,
      limit: limitNum,
      total: total,
    });
  }

  /**
   * Get storefront profile by ID
   * Matches legacy logic exactly
   * @param {string} id - Storefront profile ID
   * @returns {Promise<Object>} Storefront profile
   * @throws {ValidationError} If invalid ID format
   * @throws {NotFoundError} If storefront profile not found
   */
  async getStorefrontProfileById(id) {
    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid storefront profile ID format");
    }

    // Find storefront profile (matches legacy exactly - uses repository)
    const storefront = await this.repository.findOne({
      _id: id,
      type: "storefront",
      isDeleted: false,
    });

    if (!storefront) {
      throw new NotFoundError("Storefront profile not found", id);
    }

    return new LocationProfileResponseDTO(storefront);
  }

  /**
   * Update storefront profile
   * Matches legacy logic exactly
   * @param {string} id - Storefront profile ID
   * @param {Object} data - Update data (storefrontCode, storefrontName, storefrontAddress, storefrontPhone, storefrontEmail, managerName, status, description, notes)
   * @returns {Promise<Object>} Updated storefront profile
   * @throws {ValidationError} If invalid ID format, uniqueness check fails, phone validation fails, or no fields to update
   * @throws {NotFoundError} If storefront profile not found
   */
  async updateStorefrontProfile(id, data) {
    const {
      storefrontCode,
      storefrontName,
      storefrontAddress,
      storefrontPhone,
      storefrontEmail,
      managerName,
      status,
      description,
      notes,
    } = data;

    // Validate MongoDB ObjectId format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError("Invalid storefront profile ID format");
    }

    // Check if storefront exists and is not deleted (matches legacy exactly - uses repository)
    const existingStorefront = await this.repository.findOne({
      _id: id,
      type: "storefront",
      isDeleted: false,
    });

    if (!existingStorefront) {
      throw new NotFoundError("Storefront profile not found", id);
    }

    // Build update fields object (matches legacy exactly - field by field)
    const updateFields = {};

    // Check if storefrontCode is being updated and validate uniqueness (matches legacy exactly)
    if (storefrontCode !== undefined) {
      const codeToCheck = storefrontCode.toUpperCase().trim();
      if (codeToCheck !== existingStorefront.locationCode) {
        const existingCode = await this.repository.findOne({
          type: "storefront",
          locationCode: codeToCheck,
          isDeleted: false,
          _id: { $ne: id },
        });
        if (existingCode) {
          throw new ValidationError("Storefront code already exists");
        }
      }
      updateFields.locationCode = codeToCheck;
    }

    // Check if storefrontName is being updated and validate uniqueness (matches legacy exactly)
    if (storefrontName !== undefined) {
      const nameToCheck = storefrontName.trim();
      if (nameToCheck !== existingStorefront.locationName) {
        const existingName = await this.repository.findOne({
          type: "storefront",
          locationName: nameToCheck,
          isDeleted: false,
          _id: { $ne: id },
        });
        if (existingName) {
          throw new ValidationError("Storefront name already exists");
        }
      }
      updateFields.locationName = nameToCheck;
    }

    // Update address if provided (matches legacy exactly)
    if (storefrontAddress !== undefined) {
      updateFields.locationAddress = storefrontAddress.trim();
    }

    // Validate and update phone number if provided (matches legacy exactly)
    if (storefrontPhone !== undefined) {
      const phoneValidation = validatePhoneNumber(storefrontPhone, "MM");
      if (!phoneValidation.isValid) {
        throw new ValidationError(phoneValidation.error);
      }
      updateFields.locationPhone = phoneValidation.formattedNumber;
    }

    // Update email if provided (matches legacy exactly)
    if (storefrontEmail !== undefined) {
      updateFields.locationEmail = storefrontEmail
        ? storefrontEmail.toLowerCase().trim()
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
    if (storefrontPhone !== undefined) {
      const dataWithFormattedPhone = {
        ...data,
        storefrontPhone: updateFields.locationPhone,
      };
      const dto = new UpdateStorefrontProfileDTO(dataWithFormattedPhone);
      updateData = dto.toUpdateModel();
      // Merge with other fields that DTO might not handle
      Object.keys(updateFields).forEach((key) => {
        if (updateData[key] === undefined && updateFields[key] !== undefined) {
          updateData[key] = updateFields[key];
        }
      });
    }

    // Update the storefront profile (matches legacy exactly - uses repository)
    const updatedStorefront = await this.repository.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    // Return DTO
    return new LocationProfileResponseDTO(updatedStorefront);
  }
}

export default StorefrontProfileService;
