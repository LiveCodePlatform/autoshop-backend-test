/**
 * Credit Persona Service
 * Business logic layer for CreditPersona operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { CreditPersonaRepository } from "../repositories/creditPersona.repository.js";
import {
  CreateCreditPersonaDTO,
  UpdateCreditPersonaDTO,
  CreditPersonaResponseDTO,
  CreditPersonaListResponseDTO,
} from "../dtos/creditPersona.dto.js";
import { NotFoundError, CastError } from "../errors/errorTypes.js";
import { CREDIT_PERSONA_FIELDS } from "../types/creditPersona.types.js";
import mongoose from "mongoose";

export class CreditPersonaService {
  /**
   * @param {CreditPersonaRepository} repository - Injected repository instance (optional, fallback creates new instance)
   */
  constructor(repository) {
    this.repository = repository || new CreditPersonaRepository();
  }

  /**
   * Create new credit persona
   * @param {Object} data - Request data
   * @returns {Promise<CreditPersonaResponseDTO>} Created credit persona DTO
   */
  async createCreditPerson(data) {
    // Transform data using DTO
    const dto = new CreateCreditPersonaDTO(data);
    const creditPersonData = dto.toModel();

    // Create credit persona
    const newCreditPerson = await this.repository.create(creditPersonData);

    // Return DTO
    return new CreditPersonaResponseDTO(newCreditPerson);
  }

  /**
   * Get all credit personas with pagination and filters
   * @param {Object} queryParams - Query parameters (page, limit, search, sortBy, sortOrder)
   * @returns {Promise<CreditPersonaListResponseDTO>} List of credit persona DTOs with pagination
   */
  async getAllCreditPersons(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = queryParams;

    // Build query
    const query = {};

    // Search filter (search by name or phone)
    if (search) {
      query.$or = [
        { [CREDIT_PERSONA_FIELDS.NAME]: { $regex: search, $options: "i" } },
        { [CREDIT_PERSONA_FIELDS.PHONE]: { $regex: search, $options: "i" } },
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
    const creditPersons = await this.repository.find(query, {
      sort,
      skip,
      limit: limitNum,
    });

    // Get total count for pagination
    const total = await this.repository.countDocuments(query);

    // Return list DTO with pagination (DTO expects raw models, transforms internally)
    return new CreditPersonaListResponseDTO(creditPersons, {
      page: pageNum,
      limit: limitNum,
      total,
    });
  }

  /**
   * Get credit persona by ID
   * @param {string} id - Credit persona ID
   * @returns {Promise<CreditPersonaResponseDTO>} Credit persona DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If credit persona not found
   */
  async getCreditPersonById(id) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid credit person ID format", "id");
    }

    // Find credit persona
    const creditPerson = await this.repository.findById(id);

    if (!creditPerson) {
      throw new NotFoundError("Credit person", id);
    }

    // Return DTO
    return new CreditPersonaResponseDTO(creditPerson);
  }

  /**
   * Update credit persona
   * @param {string} id - Credit persona ID
   * @param {Object} data - Update data
   * @returns {Promise<CreditPersonaResponseDTO>} Updated credit persona DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If credit persona not found
   */
  async updateCreditPerson(id, data) {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid credit person ID format", "id");
    }

    // Check if credit persona exists
    const existingCreditPerson = await this.repository.findById(id);
    if (!existingCreditPerson) {
      throw new NotFoundError("Credit person", id);
    }

    // Transform data using DTO
    const dto = new UpdateCreditPersonaDTO(data);
    const updateData = dto.toUpdateModel();

    // Update credit persona
    const updatedCreditPerson = await this.repository.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedCreditPerson) {
      throw new NotFoundError("Credit person", id);
    }

    // Return DTO
    return new CreditPersonaResponseDTO(updatedCreditPerson);
  }
}

export default CreditPersonaService;
