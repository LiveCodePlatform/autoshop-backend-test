/**
 * Supplier Profile DTOs (Data Transfer Objects)
 * Transforms data between layers using types from types/supplierProfile.types.js
 */

import {
  SUPPLIER_PROFILE_FIELDS,
  SUPPLIER_PROFILE_DEFAULTS,
} from "../types/supplierProfile.types.js";

/**
 * Create Supplier Profile DTO
 * Transforms request data for creating supplier profile
 */
export class CreateSupplierProfileDTO {
  constructor(data) {
    this.supplierName = data[SUPPLIER_PROFILE_FIELDS.SUPPLIER_NAME];
    this.contactNumber = data[SUPPLIER_PROFILE_FIELDS.CONTACT_NUMBER];
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      [SUPPLIER_PROFILE_FIELDS.SUPPLIER_NAME]: this.supplierName,
      [SUPPLIER_PROFILE_FIELDS.CONTACT_NUMBER]: this.contactNumber,
      [SUPPLIER_PROFILE_FIELDS.IS_DELETED]:
        SUPPLIER_PROFILE_DEFAULTS.IS_DELETED,
      [SUPPLIER_PROFILE_FIELDS.DELETED_AT]:
        SUPPLIER_PROFILE_DEFAULTS.DELETED_AT,
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
 * Update Supplier Profile DTO
 * Transforms request data for updating supplier profile
 */
export class UpdateSupplierProfileDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[SUPPLIER_PROFILE_FIELDS.SUPPLIER_NAME] !== undefined)
      this.supplierName = data[SUPPLIER_PROFILE_FIELDS.SUPPLIER_NAME];
    if (data[SUPPLIER_PROFILE_FIELDS.CONTACT_NUMBER] !== undefined)
      this.contactNumber = data[SUPPLIER_PROFILE_FIELDS.CONTACT_NUMBER];
  }

  /**
   * Convert to database update format
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.supplierName !== undefined)
      updateData[SUPPLIER_PROFILE_FIELDS.SUPPLIER_NAME] = this.supplierName;
    if (this.contactNumber !== undefined)
      updateData[SUPPLIER_PROFILE_FIELDS.CONTACT_NUMBER] = this.contactNumber;

    return updateData;
  }
}

/**
 * Supplier Profile Response DTO
 * Transforms database model to API response format
 */
export class SupplierProfileResponseDTO {
  constructor(supplierProfileModel) {
    this._id = supplierProfileModel._id
      ? supplierProfileModel._id.toString()
      : supplierProfileModel.id;
    this.supplierName =
      supplierProfileModel[SUPPLIER_PROFILE_FIELDS.SUPPLIER_NAME];
    this.contactNumber =
      supplierProfileModel[SUPPLIER_PROFILE_FIELDS.CONTACT_NUMBER];
    this.isDeleted =
      supplierProfileModel[SUPPLIER_PROFILE_FIELDS.IS_DELETED] ||
      SUPPLIER_PROFILE_DEFAULTS.IS_DELETED;
    this.deletedAt =
      supplierProfileModel[SUPPLIER_PROFILE_FIELDS.DELETED_AT] ||
      SUPPLIER_PROFILE_DEFAULTS.DELETED_AT;
    this.createdAt = supplierProfileModel[SUPPLIER_PROFILE_FIELDS.CREATED_AT];
    this.updatedAt = supplierProfileModel[SUPPLIER_PROFILE_FIELDS.UPDATED_AT];
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      _id: this._id,
      supplierName: this.supplierName,
      contactNumber: this.contactNumber,
      isDeleted: this.isDeleted,
      deletedAt: this.deletedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convert to public format (exclude sensitive data if any)
   * @returns {Object}
   */
  toPublicJSON() {
    return this.toJSON(); // All fields are public for supplier profile
  }

  /**
   * Static method to convert array of supplier profiles
   * @param {Array} supplierProfiles
   * @returns {Array}
   */
  static fromArray(supplierProfiles) {
    return supplierProfiles.map((supplierProfile) =>
      new SupplierProfileResponseDTO(supplierProfile).toJSON(),
    );
  }
}

/**
 * Supplier Profile List Response DTO (with pagination)
 */
export class SupplierProfileListResponseDTO {
  constructor(
    supplierProfiles,
    pagination,
    message = "Supplier profiles retrieved successfully",
  ) {
    this.supplierProfiles =
      SupplierProfileResponseDTO.fromArray(supplierProfiles);
    this.pagination = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    };
    this.message = message;
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      success: true,
      message: this.message,
      data: this.supplierProfiles,
      pagination: this.pagination,
    };
  }
}

export default {
  CreateSupplierProfileDTO,
  UpdateSupplierProfileDTO,
  SupplierProfileResponseDTO,
  SupplierProfileListResponseDTO,
};
