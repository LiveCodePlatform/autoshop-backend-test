/**
 * Storefront Profile Service
 * Business logic layer for StorefrontProfile operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { LocationProfileRepository } from "../repositories/locationProfile.repository.js";
import {
  CreateStorefrontProfileDTO,
  UpdateStorefrontProfileDTO,
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

export class StorefrontProfileService {
  /**
   * @param {LocationProfileRepository} repository - Injected repository instance
   */
  constructor(repository) {
    this.repository = repository || new LocationProfileRepository();
  }

  /**
   * Create new storefront profile
   * @param {Object} data - Request data (legacy field names)
   * @returns {Promise<LocationProfileResponseDTO>} Created storefront profile DTO
   * @throws {ValidationError} If uniqueness check fails or phone validation fails
   */
  async createStorefrontProfile(data) {
    // Transform data using DTO (handles legacy field names)
    const dto = new CreateStorefrontProfileDTO(data);
    const storefrontData = dto.toModel();

    // Business logic: Validate phone number
    const phoneValidation = validatePhoneNumber(
      storefrontData[LOCATION_PROFILE_FIELDS.LOCATION_PHONE],
      "MM"
    );
    if (!phoneValidation.isValid) {
      throw new ValidationError(phoneValidation.error, "storefrontPhone");
    }
    // Use formatted phone number
    storefrontData[LOCATION_PROFILE_FIELDS.LOCATION_PHONE] =
      phoneValidation.formattedNumber;

    // Business logic: Check uniqueness of storefrontCode
    if (storefrontData[LOCATION_PROFILE_FIELDS.LOCATION_CODE]) {
      const existingCode = await this.repository.findOne({
        type: LOCATION_TYPE.STOREFRONT,
        locationCode: storefrontData[LOCATION_PROFILE_FIELDS.LOCATION_CODE],
        isDeleted: false,
      });
      if (existingCode) {
        throw new ValidationError(
          "Storefront code already exists",
          "storefrontCode"
        );
      }
    }

    // Business logic: Check uniqueness of storefrontName
    if (storefrontData[LOCATION_PROFILE_FIELDS.LOCATION_NAME]) {
      const existingName = await this.repository.findOne({
        type: LOCATION_TYPE.STOREFRONT,
        locationName: storefrontData[LOCATION_PROFILE_FIELDS.LOCATION_NAME],
        isDeleted: false,
      });
      if (existingName) {
        throw new ValidationError(
          "Storefront name already exists",
          "storefrontName"
        );
      }
    }

    // Create storefront profile
    const newStorefrontProfile = await this.repository.create(storefrontData);

    // Return DTO
    return new LocationProfileResponseDTO(newStorefrontProfile);
  }

  /**
   * Get all storefront profiles with pagination and filters
   * @param {Object} queryParams - Query parameters
   * @returns {Promise<LocationProfileListResponseDTO>} List of storefront profile DTOs with pagination
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

    // Build query - exclude soft deleted by default, filter by storefront type
    const query = { type: LOCATION_TYPE.STOREFRONT };

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
    const storefronts = await this.repository.find(query, {
      sort,
      skip,
      limit: limitNum,
    });

    // Get total count for pagination
    const total = await this.repository.countDocuments(query);

    // Return list DTO with pagination
    return new LocationProfileListResponseDTO(storefronts, {
      page: pageNum,
      limit: limitNum,
      total,
    });
  }

  /**
   * Get storefront profile by ID
   * @param {string} id - Storefront profile ID
   * @returns {Promise<LocationProfileResponseDTO>} Storefront profile DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If storefront profile not found
   */
  async getStorefrontProfileById(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid storefront profile ID format", "id");
    }

    // Find storefront profile
    const storefront = await this.repository.findOne({
      _id: id,
      type: LOCATION_TYPE.STOREFRONT,
      isDeleted: false,
    });

    if (!storefront) {
      throw new NotFoundError("Storefront profile", id);
    }

    // Return DTO
    return new LocationProfileResponseDTO(storefront);
  }

  /**
   * Update storefront profile
   * @param {string} id - Storefront profile ID
   * @param {Object} data - Update data (legacy field names)
   * @returns {Promise<LocationProfileResponseDTO>} Updated storefront profile DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If storefront profile not found
   * @throws {ValidationError} If uniqueness check fails, phone validation fails, or no fields to update
   */
  async updateStorefrontProfile(id, data) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid storefront profile ID format", "id");
    }

    // Check if storefront exists and is not deleted
    const existingStorefront = await this.repository.findOne({
      _id: id,
      type: LOCATION_TYPE.STOREFRONT,
      isDeleted: false,
    });

    if (!existingStorefront) {
      throw new NotFoundError("Storefront profile", id);
    }

    // Transform data using DTO (handles legacy field names)
    const dto = new UpdateStorefrontProfileDTO(data);
    const updateData = dto.toUpdateModel();

    // Business logic: Check if storefrontCode is being updated and validate uniqueness
    if (updateData[LOCATION_PROFILE_FIELDS.LOCATION_CODE] !== undefined) {
      const codeToCheck = updateData[LOCATION_PROFILE_FIELDS.LOCATION_CODE];
      if (codeToCheck !== existingStorefront.locationCode) {
        const existingCode = await this.repository.findOne({
          type: LOCATION_TYPE.STOREFRONT,
          locationCode: codeToCheck,
          isDeleted: false,
          _id: { $ne: id },
        });
        if (existingCode) {
          throw new ValidationError(
            "Storefront code already exists",
            "storefrontCode"
          );
        }
      }
    }

    // Business logic: Check if storefrontName is being updated and validate uniqueness
    if (updateData[LOCATION_PROFILE_FIELDS.LOCATION_NAME] !== undefined) {
      const nameToCheck = updateData[LOCATION_PROFILE_FIELDS.LOCATION_NAME];
      if (nameToCheck !== existingStorefront.locationName) {
        const existingName = await this.repository.findOne({
          type: LOCATION_TYPE.STOREFRONT,
          locationName: nameToCheck,
          isDeleted: false,
          _id: { $ne: id },
        });
        if (existingName) {
          throw new ValidationError(
            "Storefront name already exists",
            "storefrontName"
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
        throw new ValidationError(phoneValidation.error, "storefrontPhone");
      }
      // Use formatted phone number
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_PHONE] =
        phoneValidation.formattedNumber;
    }

    // Business logic: Check if there are any fields to update
    if (Object.keys(updateData).length === 0) {
      throw new ValidationError("No valid fields to update", "body");
    }

    // Update the storefront profile
    const updatedStorefront = await this.repository.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Return DTO
    return new LocationProfileResponseDTO(updatedStorefront);
  }
}

export default StorefrontProfileService;
