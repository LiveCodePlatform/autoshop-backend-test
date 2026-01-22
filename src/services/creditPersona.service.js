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
import { NotFoundError, CastError, ValidationError } from "../errors/errorTypes.js";
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
   * Matches legacy logic exactly
   * @param {Object} data - Request data (name, phone)
   * @returns {Promise<CreditPersonaResponseDTO>} Created credit persona DTO
   * @throws {ValidationError} If validation fails
   */
  async createCreditPerson(data) {
    const { name, phone } = data;

    // Validate required fields (matches legacy exactly)
    if (!name || !phone) {
      throw new ValidationError("Name and phone are required", "name, phone");
    }

    // Create credit persona (matches legacy exactly)
    const creditPerson = await this.repository.create({ name, phone });

    // Return DTO
    return new CreditPersonaResponseDTO(creditPerson);
  }

  /**
   * Get all credit personas
   * Matches legacy logic exactly - no pagination or filters
   * @returns {Promise<Array>} Array of credit persona DTOs
   */
  async getAllCreditPersons() {
    // Find all credit persons (matches legacy exactly - no filters, no pagination)
    const creditPersons = await this.repository.find({});

    // Return array of DTOs (matches legacy structure)
    return creditPersons.map(
      (creditPerson) => new CreditPersonaResponseDTO(creditPerson)
    );
  }

  /**
   * Get credit persona by ID
   * Matches legacy logic exactly - no ID validation, no not found check
   * @param {string} id - Credit persona ID
   * @returns {Promise<CreditPersonaResponseDTO|null>} Credit persona DTO or null if not found
   */
  async getCreditPersonById(id) {
    // Find credit persona (matches legacy exactly - no validation, no not found check)
    const creditPerson = await this.repository.findById(id);

    // Return null if not found (matches legacy behavior - returns null in data field)
    if (!creditPerson) {
      return null;
    }

    // Return DTO (matches legacy structure)
    return new CreditPersonaResponseDTO(creditPerson);
  }

  /**
   * Update credit persona
   * Matches legacy logic exactly
   * @param {string} id - Credit persona ID
   * @param {Object} data - Update data (name, phone)
   * @returns {Promise<CreditPersonaResponseDTO>} Updated credit persona DTO
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If credit persona not found
   */
  async updateCreditPerson(id, data) {
    const { name, phone } = data;

    // Validate ID format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CastError("Invalid credit person ID format", "id");
    }

    // Update credit persona (matches legacy exactly - direct update, no existence check before)
    const creditPerson = await this.repository.findByIdAndUpdate(
      id,
      { name, phone },
      { new: true }
    );

    // Check if not found (matches legacy exactly)
    if (!creditPerson) {
      throw new NotFoundError("Credit person not found", id);
    }

    // Return DTO
    return new CreditPersonaResponseDTO(creditPerson);
  }
}

export default CreditPersonaService;
