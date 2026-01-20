/**
 * Credit Persona DTOs (Data Transfer Objects)
 * Transforms data between layers using types from types/creditPersona.types.js
 */

import {
  CREDIT_PERSONA_FIELDS,
  CREDIT_PERSONA_DEFAULTS,
} from "../types/creditPersona.types.js";

/**
 * Create Credit Persona DTO
 * Transforms request data for creating credit persona
 */
export class CreateCreditPersonaDTO {
  constructor(data) {
    this.name = data[CREDIT_PERSONA_FIELDS.NAME];
    this.phone = data[CREDIT_PERSONA_FIELDS.PHONE] || null;
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      [CREDIT_PERSONA_FIELDS.NAME]: this.name,
      [CREDIT_PERSONA_FIELDS.PHONE]: this.phone,
      [CREDIT_PERSONA_FIELDS.BLACKLIST]: CREDIT_PERSONA_DEFAULTS.BLACKLIST,
      [CREDIT_PERSONA_FIELDS.BLACKLIST_REASON]:
        CREDIT_PERSONA_DEFAULTS.BLACKLIST_REASON,
      [CREDIT_PERSONA_FIELDS.BLACKLIST_DATE]:
        CREDIT_PERSONA_DEFAULTS.BLACKLIST_DATE,
    };
  }

  /**
   * Get safe object (exclude sensitive data if any)
   * @returns {Object}
   */
  toSafeObject() {
    return this.toModel();
  }
}

/**
 * Update Credit Persona DTO
 * Transforms request data for updating credit persona
 */
export class UpdateCreditPersonaDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[CREDIT_PERSONA_FIELDS.NAME] !== undefined)
      this.name = data[CREDIT_PERSONA_FIELDS.NAME];
    if (data[CREDIT_PERSONA_FIELDS.PHONE] !== undefined)
      this.phone = data[CREDIT_PERSONA_FIELDS.PHONE] || null;
    if (data[CREDIT_PERSONA_FIELDS.BLACKLIST] !== undefined)
      this.blacklist = data[CREDIT_PERSONA_FIELDS.BLACKLIST];
    if (data[CREDIT_PERSONA_FIELDS.BLACKLIST_REASON] !== undefined)
      this.blacklistReason =
        data[CREDIT_PERSONA_FIELDS.BLACKLIST_REASON] || null;
    if (data[CREDIT_PERSONA_FIELDS.BLACKLIST_DATE] !== undefined)
      this.blacklistDate = data[CREDIT_PERSONA_FIELDS.BLACKLIST_DATE] || null;
  }

  /**
   * Convert to database update format
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.name !== undefined)
      updateData[CREDIT_PERSONA_FIELDS.NAME] = this.name;
    if (this.phone !== undefined)
      updateData[CREDIT_PERSONA_FIELDS.PHONE] = this.phone;
    if (this.blacklist !== undefined)
      updateData[CREDIT_PERSONA_FIELDS.BLACKLIST] = this.blacklist;
    if (this.blacklistReason !== undefined)
      updateData[CREDIT_PERSONA_FIELDS.BLACKLIST_REASON] = this.blacklistReason;
    if (this.blacklistDate !== undefined)
      updateData[CREDIT_PERSONA_FIELDS.BLACKLIST_DATE] = this.blacklistDate;

    return updateData;
  }
}

/**
 * Credit Persona Response DTO
 * Transforms database model to API response format
 */
export class CreditPersonaResponseDTO {
  constructor(creditPersonaModel) {
    this.id = creditPersonaModel._id || creditPersonaModel.id;
    this.name = creditPersonaModel[CREDIT_PERSONA_FIELDS.NAME];
    this.phone =
      creditPersonaModel[CREDIT_PERSONA_FIELDS.PHONE] || null;
    this.blacklist =
      creditPersonaModel[CREDIT_PERSONA_FIELDS.BLACKLIST] !== undefined
        ? creditPersonaModel[CREDIT_PERSONA_FIELDS.BLACKLIST]
        : CREDIT_PERSONA_DEFAULTS.BLACKLIST;
    this.blacklistReason =
      creditPersonaModel[CREDIT_PERSONA_FIELDS.BLACKLIST_REASON] ||
      CREDIT_PERSONA_DEFAULTS.BLACKLIST_REASON;
    this.blacklistDate =
      creditPersonaModel[CREDIT_PERSONA_FIELDS.BLACKLIST_DATE] ||
      CREDIT_PERSONA_DEFAULTS.BLACKLIST_DATE;
    this.createdAt = creditPersonaModel[CREDIT_PERSONA_FIELDS.CREATED_AT];
    this.updatedAt = creditPersonaModel[CREDIT_PERSONA_FIELDS.UPDATED_AT];
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      blacklist: this.blacklist,
      blacklistReason: this.blacklistReason,
      blacklistDate: this.blacklistDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convert to public format (exclude sensitive data if any)
   * @returns {Object}
   */
  toPublicJSON() {
    return this.toJSON(); // All fields are public for credit persona
  }

  /**
   * Static method to convert array of credit personas
   * @param {Array} creditPersonas
   * @returns {Array}
   */
  static fromArray(creditPersonas) {
    return creditPersonas.map(
      (creditPersona) => new CreditPersonaResponseDTO(creditPersona).toJSON()
    );
  }
}

/**
 * Credit Persona List Response DTO (with pagination)
 */
export class CreditPersonaListResponseDTO {
  constructor(creditPersonas, pagination) {
    this.creditPersonas =
      CreditPersonaResponseDTO.fromArray(creditPersonas);
    this.pagination = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    };
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      success: true,
      data: this.creditPersonas,
      pagination: this.pagination,
    };
  }
}

export default {
  CreateCreditPersonaDTO,
  UpdateCreditPersonaDTO,
  CreditPersonaResponseDTO,
  CreditPersonaListResponseDTO,
};
