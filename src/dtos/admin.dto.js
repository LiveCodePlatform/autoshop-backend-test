/**
 * Admin DTOs (Data Transfer Objects)
 * Transforms data between layers using types from types/admin.types.js
 */

import {
  ADMIN_FIELDS,
  ADMIN_DEFAULTS,
  ADMIN_ROLE,
  isValidRole,
} from "../types/admin.types.js";

/**
 * Create Admin DTO
 * Transforms request data for creating admin
 */
export class CreateAdminDTO {
  constructor(data) {
    this.name = data[ADMIN_FIELDS.NAME]?.trim();
    this.password = data[ADMIN_FIELDS.PASSWORD];
    this.confirmPassword = data[ADMIN_FIELDS.CONFIRM_PASSWORD];
    this.role = data[ADMIN_FIELDS.ROLE] || ADMIN_DEFAULTS.ROLE;
    this.locationId = data[ADMIN_FIELDS.LOCATION_ID] || ADMIN_DEFAULTS.LOCATION_ID;
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    const modelData = {
      [ADMIN_FIELDS.NAME]: this.name,
      [ADMIN_FIELDS.PASSWORD]: this.password,
      [ADMIN_FIELDS.CONFIRM_PASSWORD]: this.confirmPassword,
      [ADMIN_FIELDS.ROLE]: this.role,
    };

    // Only include locationId if it's provided (not null)
    if (this.locationId) {
      modelData[ADMIN_FIELDS.LOCATION_ID] = this.locationId;
    }

    return modelData;
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
 * Update Admin DTO
 * Transforms request data for updating admin
 */
export class UpdateAdminDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[ADMIN_FIELDS.NAME] !== undefined)
      this.name = data[ADMIN_FIELDS.NAME]?.trim();
    if (data[ADMIN_FIELDS.PASSWORD] !== undefined)
      this.password = data[ADMIN_FIELDS.PASSWORD];
    if (data[ADMIN_FIELDS.CONFIRM_PASSWORD] !== undefined)
      this.confirmPassword = data[ADMIN_FIELDS.CONFIRM_PASSWORD];
    if (data[ADMIN_FIELDS.ROLE] !== undefined) {
      const role = data[ADMIN_FIELDS.ROLE];
      if (isValidRole(role)) {
        this.role = role;
      } else {
        throw new Error(
          `Invalid role. Must be one of: ${Object.values(ADMIN_ROLE).join(", ")}`
        );
      }
    }
    if (data[ADMIN_FIELDS.LOCATION_ID] !== undefined)
      this.locationId = data[ADMIN_FIELDS.LOCATION_ID] || null;
    if (data[ADMIN_FIELDS.LAST_ACTIVE_AT] !== undefined)
      this.lastActiveAt = data[ADMIN_FIELDS.LAST_ACTIVE_AT];
  }

  /**
   * Convert to database update format
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.name !== undefined)
      updateData[ADMIN_FIELDS.NAME] = this.name;
    if (this.password !== undefined) {
      updateData[ADMIN_FIELDS.PASSWORD] = this.password;
      // confirmPassword is handled by the model's pre-save hook
      updateData[ADMIN_FIELDS.CONFIRM_PASSWORD] = this.confirmPassword;
    }
    if (this.role !== undefined)
      updateData[ADMIN_FIELDS.ROLE] = this.role;
    if (this.locationId !== undefined)
      updateData[ADMIN_FIELDS.LOCATION_ID] = this.locationId;
    if (this.lastActiveAt !== undefined)
      updateData[ADMIN_FIELDS.LAST_ACTIVE_AT] = this.lastActiveAt;

    // Always update updatedAt
    updateData[ADMIN_FIELDS.UPDATED_AT] = new Date();

    return updateData;
  }
}

/**
 * Admin Response DTO
 * Transforms database model to API response format
 */
export class AdminResponseDTO {
  constructor(adminModel) {
    this.id = adminModel._id || adminModel.id;
    this.name = adminModel[ADMIN_FIELDS.NAME];
    this.role = adminModel[ADMIN_FIELDS.ROLE] || ADMIN_DEFAULTS.ROLE;
    this.locationId = adminModel[ADMIN_FIELDS.LOCATION_ID] || null;
    this.lastActiveAt = adminModel[ADMIN_FIELDS.LAST_ACTIVE_AT] || null;
    this.createdAt = adminModel[ADMIN_FIELDS.CREATED_AT];
    this.updatedAt = adminModel[ADMIN_FIELDS.UPDATED_AT] || null;
    // Note: password, confirmPassword, softDeleted, and deletedAt are never included in response
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      locationId: this.locationId,
      lastActiveAt: this.lastActiveAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convert to public format (exclude sensitive data)
   * @returns {Object}
   */
  toPublicJSON() {
    return this.toJSON(); // Already excludes sensitive data
  }

  /**
   * Static method to convert array of admins
   * @param {Array} admins
   * @returns {Array}
   */
  static fromArray(admins) {
    return admins.map((admin) => new AdminResponseDTO(admin).toJSON());
  }
}

/**
 * Admin List Response DTO (with pagination)
 */
export class AdminListResponseDTO {
  constructor(admins, pagination) {
    this.admins = AdminResponseDTO.fromArray(admins);
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
      data: this.admins,
      pagination: this.pagination,
    };
  }
}

/**
 * Login Response DTO
 * Transforms admin model and token to login response format
 */
export class LoginResponseDTO {
  constructor(adminModel, token) {
    this.admin = new AdminResponseDTO(adminModel);
    this.token = token;
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      admin: this.admin.toJSON(),
      token: this.token,
    };
  }
}

/**
 * Signup Response DTO
 * Transforms admin model and token to signup response format
 */
export class SignupResponseDTO {
  constructor(adminModel, token) {
    this.admin = new AdminResponseDTO(adminModel);
    this.token = token;
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      admin: this.admin.toJSON(),
      token: this.token,
    };
  }
}

export default {
  CreateAdminDTO,
  UpdateAdminDTO,
  AdminResponseDTO,
  AdminListResponseDTO,
  LoginResponseDTO,
  SignupResponseDTO,
};
