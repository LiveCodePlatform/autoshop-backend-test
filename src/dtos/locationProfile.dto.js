/**
 * Location Profile DTOs (Data Transfer Objects)
 * Transforms data between layers using types from types/locationProfile.types.js
 * 
 * Note: Handles both unified field names (locationCode) and legacy field names
 * (storefrontCode, warehouseCode) for backward compatibility
 */

import {
  LOCATION_PROFILE_FIELDS,
  STOREFRONT_PROFILE_FIELDS,
  WAREHOUSE_PROFILE_FIELDS,
  LOCATION_PROFILE_DEFAULTS,
  LOCATION_TYPE,
  LOCATION_STATUS,
  isValidLocationType,
  isValidStatus,
} from "../types/locationProfile.types.js";

/**
 * Create Location Profile DTO (Unified)
 * Transforms request data for creating location profile using unified field names
 */
export class CreateLocationProfileDTO {
  constructor(data) {
    this.type = data[LOCATION_PROFILE_FIELDS.TYPE];
    this.locationCode = data[LOCATION_PROFILE_FIELDS.LOCATION_CODE]?.toUpperCase().trim();
    this.locationName = data[LOCATION_PROFILE_FIELDS.LOCATION_NAME]?.trim();
    this.locationAddress = data[LOCATION_PROFILE_FIELDS.LOCATION_ADDRESS]?.trim();
    this.locationPhone = data[LOCATION_PROFILE_FIELDS.LOCATION_PHONE]?.trim();
    this.locationEmail =
      data[LOCATION_PROFILE_FIELDS.LOCATION_EMAIL]?.toLowerCase().trim() ||
      LOCATION_PROFILE_DEFAULTS.LOCATION_EMAIL;
    this.managerName =
      data[LOCATION_PROFILE_FIELDS.MANAGER_NAME]?.trim() ||
      LOCATION_PROFILE_DEFAULTS.MANAGER_NAME;
    this.status =
      data[LOCATION_PROFILE_FIELDS.STATUS] || LOCATION_PROFILE_DEFAULTS.STATUS;
    this.description =
      data[LOCATION_PROFILE_FIELDS.DESCRIPTION]?.trim() ||
      LOCATION_PROFILE_DEFAULTS.DESCRIPTION;
    this.notes =
      data[LOCATION_PROFILE_FIELDS.NOTES]?.trim() ||
      LOCATION_PROFILE_DEFAULTS.NOTES;
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      [LOCATION_PROFILE_FIELDS.TYPE]: this.type,
      [LOCATION_PROFILE_FIELDS.LOCATION_CODE]: this.locationCode,
      [LOCATION_PROFILE_FIELDS.LOCATION_NAME]: this.locationName,
      [LOCATION_PROFILE_FIELDS.LOCATION_ADDRESS]: this.locationAddress,
      [LOCATION_PROFILE_FIELDS.LOCATION_PHONE]: this.locationPhone,
      [LOCATION_PROFILE_FIELDS.LOCATION_EMAIL]: this.locationEmail,
      [LOCATION_PROFILE_FIELDS.MANAGER_NAME]: this.managerName,
      [LOCATION_PROFILE_FIELDS.STATUS]: this.status,
      [LOCATION_PROFILE_FIELDS.DESCRIPTION]: this.description,
      [LOCATION_PROFILE_FIELDS.NOTES]: this.notes,
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
 * Create Storefront Profile DTO (Legacy)
 * Transforms request data for creating storefront profile using legacy field names
 * Maps legacy fields to unified schema fields
 */
export class CreateStorefrontProfileDTO {
  constructor(data) {
    this.type = LOCATION_TYPE.STOREFRONT; // Always set to storefront
    this.locationCode = data[STOREFRONT_PROFILE_FIELDS.STOREFRONT_CODE]?.toUpperCase().trim();
    this.locationName = data[STOREFRONT_PROFILE_FIELDS.STOREFRONT_NAME]?.trim();
    this.locationAddress = data[STOREFRONT_PROFILE_FIELDS.STOREFRONT_ADDRESS]?.trim();
    this.locationPhone = data[STOREFRONT_PROFILE_FIELDS.STOREFRONT_PHONE]?.trim();
    this.locationEmail =
      data[STOREFRONT_PROFILE_FIELDS.STOREFRONT_EMAIL]?.toLowerCase().trim() ||
      LOCATION_PROFILE_DEFAULTS.LOCATION_EMAIL;
    this.managerName =
      data[STOREFRONT_PROFILE_FIELDS.MANAGER_NAME]?.trim() ||
      LOCATION_PROFILE_DEFAULTS.MANAGER_NAME;
    this.status =
      data[STOREFRONT_PROFILE_FIELDS.STATUS] || LOCATION_PROFILE_DEFAULTS.STATUS;
    this.description =
      data[STOREFRONT_PROFILE_FIELDS.DESCRIPTION]?.trim() ||
      LOCATION_PROFILE_DEFAULTS.DESCRIPTION;
    this.notes =
      data[STOREFRONT_PROFILE_FIELDS.NOTES]?.trim() ||
      LOCATION_PROFILE_DEFAULTS.NOTES;
  }

  /**
   * Convert to database model format (unified schema fields)
   * @returns {Object}
   */
  toModel() {
    return {
      [LOCATION_PROFILE_FIELDS.TYPE]: this.type,
      [LOCATION_PROFILE_FIELDS.LOCATION_CODE]: this.locationCode,
      [LOCATION_PROFILE_FIELDS.LOCATION_NAME]: this.locationName,
      [LOCATION_PROFILE_FIELDS.LOCATION_ADDRESS]: this.locationAddress,
      [LOCATION_PROFILE_FIELDS.LOCATION_PHONE]: this.locationPhone,
      [LOCATION_PROFILE_FIELDS.LOCATION_EMAIL]: this.locationEmail,
      [LOCATION_PROFILE_FIELDS.MANAGER_NAME]: this.managerName,
      [LOCATION_PROFILE_FIELDS.STATUS]: this.status,
      [LOCATION_PROFILE_FIELDS.DESCRIPTION]: this.description,
      [LOCATION_PROFILE_FIELDS.NOTES]: this.notes,
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
 * Create Warehouse Profile DTO (Legacy)
 * Transforms request data for creating warehouse profile using legacy field names
 * Maps legacy fields to unified schema fields
 */
export class CreateWarehouseProfileDTO {
  constructor(data) {
    this.type = LOCATION_TYPE.WAREHOUSE; // Always set to warehouse
    this.locationCode = data[WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_CODE]?.toUpperCase().trim();
    this.locationName = data[WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_NAME]?.trim();
    this.locationAddress = data[WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_ADDRESS]?.trim();
    this.locationPhone = data[WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_PHONE]?.trim();
    this.locationEmail =
      data[WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_EMAIL]?.toLowerCase().trim() ||
      LOCATION_PROFILE_DEFAULTS.LOCATION_EMAIL;
    this.managerName =
      data[WAREHOUSE_PROFILE_FIELDS.MANAGER_NAME]?.trim() ||
      LOCATION_PROFILE_DEFAULTS.MANAGER_NAME;
    this.status =
      data[WAREHOUSE_PROFILE_FIELDS.STATUS] || LOCATION_PROFILE_DEFAULTS.STATUS;
    this.description =
      data[WAREHOUSE_PROFILE_FIELDS.DESCRIPTION]?.trim() ||
      LOCATION_PROFILE_DEFAULTS.DESCRIPTION;
    this.notes =
      data[WAREHOUSE_PROFILE_FIELDS.NOTES]?.trim() ||
      LOCATION_PROFILE_DEFAULTS.NOTES;
  }

  /**
   * Convert to database model format (unified schema fields)
   * @returns {Object}
   */
  toModel() {
    return {
      [LOCATION_PROFILE_FIELDS.TYPE]: this.type,
      [LOCATION_PROFILE_FIELDS.LOCATION_CODE]: this.locationCode,
      [LOCATION_PROFILE_FIELDS.LOCATION_NAME]: this.locationName,
      [LOCATION_PROFILE_FIELDS.LOCATION_ADDRESS]: this.locationAddress,
      [LOCATION_PROFILE_FIELDS.LOCATION_PHONE]: this.locationPhone,
      [LOCATION_PROFILE_FIELDS.LOCATION_EMAIL]: this.locationEmail,
      [LOCATION_PROFILE_FIELDS.MANAGER_NAME]: this.managerName,
      [LOCATION_PROFILE_FIELDS.STATUS]: this.status,
      [LOCATION_PROFILE_FIELDS.DESCRIPTION]: this.description,
      [LOCATION_PROFILE_FIELDS.NOTES]: this.notes,
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
 * Update Location Profile DTO (Unified)
 * Transforms request data for updating location profile using unified field names
 */
export class UpdateLocationProfileDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[LOCATION_PROFILE_FIELDS.TYPE] !== undefined) {
      const type = data[LOCATION_PROFILE_FIELDS.TYPE];
      if (isValidLocationType(type)) {
        this.type = type;
      } else {
        throw new Error(
          `Invalid location type. Must be one of: ${Object.values(LOCATION_TYPE).join(", ")}`
        );
      }
    }
    if (data[LOCATION_PROFILE_FIELDS.LOCATION_CODE] !== undefined)
      this.locationCode = data[LOCATION_PROFILE_FIELDS.LOCATION_CODE]?.toUpperCase().trim();
    if (data[LOCATION_PROFILE_FIELDS.LOCATION_NAME] !== undefined)
      this.locationName = data[LOCATION_PROFILE_FIELDS.LOCATION_NAME]?.trim();
    if (data[LOCATION_PROFILE_FIELDS.LOCATION_ADDRESS] !== undefined)
      this.locationAddress = data[LOCATION_PROFILE_FIELDS.LOCATION_ADDRESS]?.trim();
    if (data[LOCATION_PROFILE_FIELDS.LOCATION_PHONE] !== undefined)
      this.locationPhone = data[LOCATION_PROFILE_FIELDS.LOCATION_PHONE]?.trim();
    if (data[LOCATION_PROFILE_FIELDS.LOCATION_EMAIL] !== undefined)
      this.locationEmail =
        data[LOCATION_PROFILE_FIELDS.LOCATION_EMAIL]?.toLowerCase().trim() || null;
    if (data[LOCATION_PROFILE_FIELDS.MANAGER_NAME] !== undefined)
      this.managerName = data[LOCATION_PROFILE_FIELDS.MANAGER_NAME]?.trim() || null;
    if (data[LOCATION_PROFILE_FIELDS.STATUS] !== undefined) {
      const status = data[LOCATION_PROFILE_FIELDS.STATUS];
      if (isValidStatus(status)) {
        this.status = status;
      } else {
        throw new Error(
          `Invalid status. Must be one of: ${Object.values(LOCATION_STATUS).join(", ")}`
        );
      }
    }
    if (data[LOCATION_PROFILE_FIELDS.DESCRIPTION] !== undefined)
      this.description = data[LOCATION_PROFILE_FIELDS.DESCRIPTION]?.trim() || null;
    if (data[LOCATION_PROFILE_FIELDS.NOTES] !== undefined)
      this.notes = data[LOCATION_PROFILE_FIELDS.NOTES]?.trim() || null;
  }

  /**
   * Convert to database update format
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.type !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.TYPE] = this.type;
    if (this.locationCode !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_CODE] = this.locationCode;
    if (this.locationName !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_NAME] = this.locationName;
    if (this.locationAddress !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_ADDRESS] = this.locationAddress;
    if (this.locationPhone !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_PHONE] = this.locationPhone;
    if (this.locationEmail !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_EMAIL] = this.locationEmail;
    if (this.managerName !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.MANAGER_NAME] = this.managerName;
    if (this.status !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.STATUS] = this.status;
    if (this.description !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.DESCRIPTION] = this.description;
    if (this.notes !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.NOTES] = this.notes;

    return updateData;
  }
}

/**
 * Update Storefront Profile DTO (Legacy)
 * Transforms request data for updating storefront profile using legacy field names
 * Maps legacy fields to unified schema fields
 */
export class UpdateStorefrontProfileDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[STOREFRONT_PROFILE_FIELDS.STOREFRONT_CODE] !== undefined)
      this.locationCode = data[STOREFRONT_PROFILE_FIELDS.STOREFRONT_CODE]?.toUpperCase().trim();
    if (data[STOREFRONT_PROFILE_FIELDS.STOREFRONT_NAME] !== undefined)
      this.locationName = data[STOREFRONT_PROFILE_FIELDS.STOREFRONT_NAME]?.trim();
    if (data[STOREFRONT_PROFILE_FIELDS.STOREFRONT_ADDRESS] !== undefined)
      this.locationAddress = data[STOREFRONT_PROFILE_FIELDS.STOREFRONT_ADDRESS]?.trim();
    if (data[STOREFRONT_PROFILE_FIELDS.STOREFRONT_PHONE] !== undefined)
      this.locationPhone = data[STOREFRONT_PROFILE_FIELDS.STOREFRONT_PHONE]?.trim();
    if (data[STOREFRONT_PROFILE_FIELDS.STOREFRONT_EMAIL] !== undefined)
      this.locationEmail =
        data[STOREFRONT_PROFILE_FIELDS.STOREFRONT_EMAIL]?.toLowerCase().trim() || null;
    if (data[STOREFRONT_PROFILE_FIELDS.MANAGER_NAME] !== undefined)
      this.managerName = data[STOREFRONT_PROFILE_FIELDS.MANAGER_NAME]?.trim() || null;
    if (data[STOREFRONT_PROFILE_FIELDS.STATUS] !== undefined) {
      const status = data[STOREFRONT_PROFILE_FIELDS.STATUS];
      if (isValidStatus(status)) {
        this.status = status;
      } else {
        throw new Error(
          `Invalid status. Must be one of: ${Object.values(LOCATION_STATUS).join(", ")}`
        );
      }
    }
    if (data[STOREFRONT_PROFILE_FIELDS.DESCRIPTION] !== undefined)
      this.description = data[STOREFRONT_PROFILE_FIELDS.DESCRIPTION]?.trim() || null;
    if (data[STOREFRONT_PROFILE_FIELDS.NOTES] !== undefined)
      this.notes = data[STOREFRONT_PROFILE_FIELDS.NOTES]?.trim() || null;
  }

  /**
   * Convert to database update format (unified schema fields)
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.locationCode !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_CODE] = this.locationCode;
    if (this.locationName !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_NAME] = this.locationName;
    if (this.locationAddress !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_ADDRESS] = this.locationAddress;
    if (this.locationPhone !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_PHONE] = this.locationPhone;
    if (this.locationEmail !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_EMAIL] = this.locationEmail;
    if (this.managerName !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.MANAGER_NAME] = this.managerName;
    if (this.status !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.STATUS] = this.status;
    if (this.description !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.DESCRIPTION] = this.description;
    if (this.notes !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.NOTES] = this.notes;

    return updateData;
  }
}

/**
 * Update Warehouse Profile DTO (Legacy)
 * Transforms request data for updating warehouse profile using legacy field names
 * Maps legacy fields to unified schema fields
 */
export class UpdateWarehouseProfileDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_CODE] !== undefined)
      this.locationCode = data[WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_CODE]?.toUpperCase().trim();
    if (data[WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_NAME] !== undefined)
      this.locationName = data[WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_NAME]?.trim();
    if (data[WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_ADDRESS] !== undefined)
      this.locationAddress = data[WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_ADDRESS]?.trim();
    if (data[WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_PHONE] !== undefined)
      this.locationPhone = data[WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_PHONE]?.trim();
    if (data[WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_EMAIL] !== undefined)
      this.locationEmail =
        data[WAREHOUSE_PROFILE_FIELDS.WAREHOUSE_EMAIL]?.toLowerCase().trim() || null;
    if (data[WAREHOUSE_PROFILE_FIELDS.MANAGER_NAME] !== undefined)
      this.managerName = data[WAREHOUSE_PROFILE_FIELDS.MANAGER_NAME]?.trim() || null;
    if (data[WAREHOUSE_PROFILE_FIELDS.STATUS] !== undefined) {
      const status = data[WAREHOUSE_PROFILE_FIELDS.STATUS];
      if (isValidStatus(status)) {
        this.status = status;
      } else {
        throw new Error(
          `Invalid status. Must be one of: ${Object.values(LOCATION_STATUS).join(", ")}`
        );
      }
    }
    if (data[WAREHOUSE_PROFILE_FIELDS.DESCRIPTION] !== undefined)
      this.description = data[WAREHOUSE_PROFILE_FIELDS.DESCRIPTION]?.trim() || null;
    if (data[WAREHOUSE_PROFILE_FIELDS.NOTES] !== undefined)
      this.notes = data[WAREHOUSE_PROFILE_FIELDS.NOTES]?.trim() || null;
  }

  /**
   * Convert to database update format (unified schema fields)
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.locationCode !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_CODE] = this.locationCode;
    if (this.locationName !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_NAME] = this.locationName;
    if (this.locationAddress !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_ADDRESS] = this.locationAddress;
    if (this.locationPhone !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_PHONE] = this.locationPhone;
    if (this.locationEmail !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.LOCATION_EMAIL] = this.locationEmail;
    if (this.managerName !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.MANAGER_NAME] = this.managerName;
    if (this.status !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.STATUS] = this.status;
    if (this.description !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.DESCRIPTION] = this.description;
    if (this.notes !== undefined)
      updateData[LOCATION_PROFILE_FIELDS.NOTES] = this.notes;

    return updateData;
  }
}

/**
 * Location Profile Response DTO
 * Transforms database model to API response format
 * Always uses unified schema field names regardless of input field names
 */
export class LocationProfileResponseDTO {
  constructor(locationProfileModel) {
    this.id = locationProfileModel._id || locationProfileModel.id;
    this.type = locationProfileModel[LOCATION_PROFILE_FIELDS.TYPE];
    this.locationCode = locationProfileModel[LOCATION_PROFILE_FIELDS.LOCATION_CODE];
    this.locationName = locationProfileModel[LOCATION_PROFILE_FIELDS.LOCATION_NAME];
    this.locationAddress = locationProfileModel[LOCATION_PROFILE_FIELDS.LOCATION_ADDRESS];
    this.locationPhone = locationProfileModel[LOCATION_PROFILE_FIELDS.LOCATION_PHONE];
    this.locationEmail =
      locationProfileModel[LOCATION_PROFILE_FIELDS.LOCATION_EMAIL] || null;
    this.managerName =
      locationProfileModel[LOCATION_PROFILE_FIELDS.MANAGER_NAME] || null;
    this.status =
      locationProfileModel[LOCATION_PROFILE_FIELDS.STATUS] ||
      LOCATION_STATUS.ACTIVE;
    this.description =
      locationProfileModel[LOCATION_PROFILE_FIELDS.DESCRIPTION] ||
      LOCATION_PROFILE_DEFAULTS.DESCRIPTION;
    this.notes =
      locationProfileModel[LOCATION_PROFILE_FIELDS.NOTES] ||
      LOCATION_PROFILE_DEFAULTS.NOTES;
    this.isDeleted =
      locationProfileModel[LOCATION_PROFILE_FIELDS.IS_DELETED] || false;
    this.deletedAt =
      locationProfileModel[LOCATION_PROFILE_FIELDS.DELETED_AT] || null;
    this.createdAt = locationProfileModel[LOCATION_PROFILE_FIELDS.CREATED_AT];
    this.updatedAt = locationProfileModel[LOCATION_PROFILE_FIELDS.UPDATED_AT];
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      locationCode: this.locationCode,
      locationName: this.locationName,
      locationAddress: this.locationAddress,
      locationPhone: this.locationPhone,
      locationEmail: this.locationEmail,
      managerName: this.managerName,
      status: this.status,
      description: this.description,
      notes: this.notes,
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
    // Exclude isDeleted and deletedAt from public response
    const publicData = this.toJSON();
    delete publicData.isDeleted;
    delete publicData.deletedAt;
    return publicData;
  }

  /**
   * Static method to convert array of location profiles
   * @param {Array} locationProfiles
   * @returns {Array}
   */
  static fromArray(locationProfiles) {
    return locationProfiles.map(
      (profile) => new LocationProfileResponseDTO(profile).toJSON()
    );
  }
}

/**
 * Location Profile List Response DTO (with pagination)
 */
export class LocationProfileListResponseDTO {
  constructor(locationProfiles, pagination) {
    this.locationProfiles = LocationProfileResponseDTO.fromArray(locationProfiles);
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
      data: this.locationProfiles,
      pagination: this.pagination,
    };
  }
}

export default {
  CreateLocationProfileDTO,
  CreateStorefrontProfileDTO,
  CreateWarehouseProfileDTO,
  UpdateLocationProfileDTO,
  UpdateStorefrontProfileDTO,
  UpdateWarehouseProfileDTO,
  LocationProfileResponseDTO,
  LocationProfileListResponseDTO,
};
