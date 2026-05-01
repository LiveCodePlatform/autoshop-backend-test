/**
 * Social Media Sale Inventory DTOs (Data Transfer Objects)
 * Transforms data between layers using types from types/socialMediaSaleInventory.types.js
 */

import {
  SOCIAL_MEDIA_SALE_INVENTORY_FIELDS,
  SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS,
} from "../types/socialMediaSaleInventory.types.js";

/**
 * Create Social Media Sale Inventory DTO
 * Transforms request data for creating social media sale inventory
 */
export class CreateSocialMediaSaleInventoryDTO {
  constructor(data) {
    this.inventoryId = data[SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.INVENTORY_ID];
    this.quantity =
      data[SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.QUANTITY] !== undefined
        ? data[SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.QUANTITY]
        : SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS.QUANTITY;
    this.sellingGuidePrompt =
      data[SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.SELLING_GUIDE_PROMPT] !==
      undefined
        ? data[SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.SELLING_GUIDE_PROMPT]
        : SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS.SELLING_GUIDE_PROMPT;
    this.buyingGuidePrompt =
      data[SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.BUYING_GUIDE_PROMPT] !== undefined
        ? data[SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.BUYING_GUIDE_PROMPT]
        : SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS.BUYING_GUIDE_PROMPT;
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      [SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.INVENTORY_ID]: this.inventoryId,
      [SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.QUANTITY]: this.quantity,
      [SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.SELLING_GUIDE_PROMPT]:
        this.sellingGuidePrompt,
      [SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.BUYING_GUIDE_PROMPT]:
        this.buyingGuidePrompt,
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
 * Social Media Sale Inventory Response DTO
 * Transforms database model to API response format
 */
export class SocialMediaSaleInventoryResponseDTO {
  constructor(socialMediaSaleInventoryModel) {
    this._id = socialMediaSaleInventoryModel._id
      ? socialMediaSaleInventoryModel._id.toString()
      : socialMediaSaleInventoryModel.id;
    this.inventoryId =
      socialMediaSaleInventoryModel[
        SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.INVENTORY_ID
      ];
    this.quantity =
      socialMediaSaleInventoryModel[
        SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.QUANTITY
      ] || 0;
    this.sellingGuidePrompt =
      socialMediaSaleInventoryModel[
        SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.SELLING_GUIDE_PROMPT
      ] || SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS.SELLING_GUIDE_PROMPT;
    this.buyingGuidePrompt =
      socialMediaSaleInventoryModel[
        SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.BUYING_GUIDE_PROMPT
      ] || SOCIAL_MEDIA_SALE_INVENTORY_DEFAULTS.BUYING_GUIDE_PROMPT;
    this.isLowStock =
      socialMediaSaleInventoryModel[
        SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.IS_LOW_STOCK
      ] || false;
    this.lastUpdated =
      socialMediaSaleInventoryModel[
        SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.LAST_UPDATED
      ] ||
      socialMediaSaleInventoryModel[
        SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.CREATED_AT
      ];
    this.createdAt =
      socialMediaSaleInventoryModel[
        SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.CREATED_AT
      ];
    this.updatedAt =
      socialMediaSaleInventoryModel[
        SOCIAL_MEDIA_SALE_INVENTORY_FIELDS.UPDATED_AT
      ];
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      _id: this._id,
      inventoryId: this.inventoryId,
      quantity: this.quantity,
      sellingGuidePrompt: this.sellingGuidePrompt,
      buyingGuidePrompt: this.buyingGuidePrompt,
      isLowStock: this.isLowStock,
      lastUpdated: this.lastUpdated,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convert to public format (exclude sensitive data if any)
   * @returns {Object}
   */
  toPublicJSON() {
    return this.toJSON(); // All fields are public for social media sale inventory
  }

  /**
   * Static method to convert array of social media sale inventories
   * @param {Array} socialMediaSaleInventories
   * @returns {Array}
   */
  static fromArray(socialMediaSaleInventories) {
    return socialMediaSaleInventories.map((inventory) =>
      new SocialMediaSaleInventoryResponseDTO(inventory).toJSON(),
    );
  }
}

/**
 * Social Media Sale Inventory List Response DTO (with pagination)
 */
export class SocialMediaSaleInventoryListResponseDTO {
  constructor(
    socialMediaSaleInventories,
    pagination,
    message = "Social media sale inventory retrieved successfully",
  ) {
    this.socialMediaSaleInventories =
      SocialMediaSaleInventoryResponseDTO.fromArray(socialMediaSaleInventories);
    this.pagination = {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      totalItems: pagination.totalItems,
      itemsPerPage: pagination.itemsPerPage,
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
      data: this.socialMediaSaleInventories,
      pagination: this.pagination,
    };
  }
}

export default {
  CreateSocialMediaSaleInventoryDTO,
  SocialMediaSaleInventoryResponseDTO,
  SocialMediaSaleInventoryListResponseDTO,
};
