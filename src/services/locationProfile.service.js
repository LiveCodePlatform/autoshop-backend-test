/**
 * Location Profile Service
 * Business logic layer for LocationProfile operations (unified for both warehouse and storefront)
 * Uses repositories for data access and DTOs for data transformation
 */

import {
  ValidationError,
  NotFoundError,
  CastError,
} from "../errors/errorTypes.js";
import mongoose from "mongoose";
import { LocationProfileRepository } from "../repositories/locationProfile.repository.js";
import {
  LocationProfileResponseDTO,
  LocationProfileListResponseDTO,
} from "../dtos/locationProfile.dto.js";

export class LocationProfileService {
  /**
   * @param {LocationProfileRepository} repository - Injected repository instance (optional, fallback creates new instance)
   */
  constructor(repository) {
    this.repository = repository || new LocationProfileRepository();
  }

  /**
   * Get all location profiles with pagination and filters
   * Matches legacy logic exactly - supports both warehouse and storefront types
   * @param {Object} queryParams - Query parameters
   * @returns {Promise<Object>} List of location profiles with pagination
   */
  async getAllLocationProfiles(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDeleted = false,
    } = queryParams;

    // Build query
    const query = {};

    // Filter by type if provided (warehouse or storefront)
    if (type) {
      if (!["warehouse", "storefront"].includes(type)) {
        throw new ValidationError(
          "Type must be either 'warehouse' or 'storefront'",
        );
      }
      query.type = type;
    }

    // Exclude soft deleted by default
    if (!includeDeleted || includeDeleted === "false") {
      query.isDeleted = false;
    }

    // Filter by status if provided
    if (status) {
      if (!["active", "inactive"].includes(status)) {
        throw new ValidationError(
          "Status must be either 'active' or 'inactive'",
        );
      }
      query.status = status;
    }

    // Search functionality
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
    const locations = await this.repository.find(query, {
      sort,
      skip,
      limit: limitNum,
    });

    // Get total count for pagination
    const total = await this.repository.countDocuments(query);

    return new LocationProfileListResponseDTO(locations, {
      page: pageNum,
      limit: limitNum,
      total: total,
    });
  }

  /**
   * Get location profile by ID
   * Matches legacy logic exactly
   * @param {string} id - Location profile ID
   * @returns {Promise<Object>} Location profile
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If location profile not found
   */
  async getLocationProfileById(id) {
    // Validate ID format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid location profile ID format", "id");
    }

    // Find location profile (matches legacy exactly - uses repository)
    const location = await this.repository.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!location) {
      throw new NotFoundError("Location profile not found", id);
    }

    // Return DTO
    return new LocationProfileResponseDTO(location);
  }
}
