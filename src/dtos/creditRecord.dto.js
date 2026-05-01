/**
 * Credit Record DTOs (Data Transfer Objects)
 * Transforms data between layers using types from types/creditRecord.types.js
 */

import {
  CREDIT_RECORD_FIELDS,
  CREDIT_RECORD_DEFAULTS,
} from "../types/creditRecord.types.js";

/**
 * Create Credit Record DTO
 * Transforms request data for creating credit record
 */
export class CreateCreditRecordDTO {
  constructor(data) {
    this.orderId = data[CREDIT_RECORD_FIELDS.ORDER_ID];
    this.creditPersonId = data[CREDIT_RECORD_FIELDS.CREDIT_PERSON_ID] || null;
    this.paidAmount = data[CREDIT_RECORD_FIELDS.PAID_AMOUNT];
    this.paymentDate = data[CREDIT_RECORD_FIELDS.PAYMENT_DATE] || new Date();
    this.paymentMethod =
      data[CREDIT_RECORD_FIELDS.PAYMENT_METHOD] ||
      CREDIT_RECORD_DEFAULTS.PAYMENT_METHOD;
    this.notes =
      data[CREDIT_RECORD_FIELDS.NOTES] || CREDIT_RECORD_DEFAULTS.NOTES;
    this.addedBy = data[CREDIT_RECORD_FIELDS.ADDED_BY];
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      [CREDIT_RECORD_FIELDS.ORDER_ID]: this.orderId,
      [CREDIT_RECORD_FIELDS.CREDIT_PERSON_ID]: this.creditPersonId,
      [CREDIT_RECORD_FIELDS.PAID_AMOUNT]: this.paidAmount,
      [CREDIT_RECORD_FIELDS.PAYMENT_DATE]: this.paymentDate,
      [CREDIT_RECORD_FIELDS.PAYMENT_METHOD]: this.paymentMethod,
      [CREDIT_RECORD_FIELDS.NOTES]: this.notes,
      [CREDIT_RECORD_FIELDS.ADDED_BY]: this.addedBy,
      [CREDIT_RECORD_FIELDS.IS_DELETED]: CREDIT_RECORD_DEFAULTS.IS_DELETED,
      [CREDIT_RECORD_FIELDS.DELETED_AT]: CREDIT_RECORD_DEFAULTS.DELETED_AT,
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
 * Update Credit Record DTO
 * Transforms request data for updating credit record
 */
export class UpdateCreditRecordDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[CREDIT_RECORD_FIELDS.ORDER_ID] !== undefined)
      this.orderId = data[CREDIT_RECORD_FIELDS.ORDER_ID];
    if (data[CREDIT_RECORD_FIELDS.CREDIT_PERSON_ID] !== undefined)
      this.creditPersonId = data[CREDIT_RECORD_FIELDS.CREDIT_PERSON_ID] || null;
    if (data[CREDIT_RECORD_FIELDS.PAID_AMOUNT] !== undefined)
      this.paidAmount = data[CREDIT_RECORD_FIELDS.PAID_AMOUNT];
    if (data[CREDIT_RECORD_FIELDS.PAYMENT_DATE] !== undefined)
      this.paymentDate = data[CREDIT_RECORD_FIELDS.PAYMENT_DATE];
    if (data[CREDIT_RECORD_FIELDS.PAYMENT_METHOD] !== undefined)
      this.paymentMethod = data[CREDIT_RECORD_FIELDS.PAYMENT_METHOD];
    if (data[CREDIT_RECORD_FIELDS.NOTES] !== undefined)
      this.notes = data[CREDIT_RECORD_FIELDS.NOTES] || null;
    if (data[CREDIT_RECORD_FIELDS.ADDED_BY] !== undefined)
      this.addedBy = data[CREDIT_RECORD_FIELDS.ADDED_BY];
  }

  /**
   * Convert to database update format
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.orderId !== undefined)
      updateData[CREDIT_RECORD_FIELDS.ORDER_ID] = this.orderId;
    if (this.creditPersonId !== undefined)
      updateData[CREDIT_RECORD_FIELDS.CREDIT_PERSON_ID] = this.creditPersonId;
    if (this.paidAmount !== undefined)
      updateData[CREDIT_RECORD_FIELDS.PAID_AMOUNT] = this.paidAmount;
    if (this.paymentDate !== undefined)
      updateData[CREDIT_RECORD_FIELDS.PAYMENT_DATE] = this.paymentDate;
    if (this.paymentMethod !== undefined)
      updateData[CREDIT_RECORD_FIELDS.PAYMENT_METHOD] = this.paymentMethod;
    if (this.notes !== undefined)
      updateData[CREDIT_RECORD_FIELDS.NOTES] = this.notes;
    if (this.addedBy !== undefined)
      updateData[CREDIT_RECORD_FIELDS.ADDED_BY] = this.addedBy;

    return updateData;
  }
}

/**
 * Credit Record Response DTO
 * Transforms database model to API response format
 */
export class CreditRecordResponseDTO {
  constructor(creditRecordModel) {
    this._id = creditRecordModel._id
      ? creditRecordModel._id.toString()
      : creditRecordModel.id;
    this.orderId = creditRecordModel[CREDIT_RECORD_FIELDS.ORDER_ID];
    this.creditPersonId =
      creditRecordModel[CREDIT_RECORD_FIELDS.CREDIT_PERSON_ID] || null;
    this.paidAmount = creditRecordModel[CREDIT_RECORD_FIELDS.PAID_AMOUNT];
    this.paymentDate = creditRecordModel[CREDIT_RECORD_FIELDS.PAYMENT_DATE];
    this.paymentMethod =
      creditRecordModel[CREDIT_RECORD_FIELDS.PAYMENT_METHOD] ||
      CREDIT_RECORD_DEFAULTS.PAYMENT_METHOD;
    this.notes =
      creditRecordModel[CREDIT_RECORD_FIELDS.NOTES] ||
      CREDIT_RECORD_DEFAULTS.NOTES;
    this.addedBy = creditRecordModel[CREDIT_RECORD_FIELDS.ADDED_BY];
    this.isDeleted =
      creditRecordModel[CREDIT_RECORD_FIELDS.IS_DELETED] !== undefined
        ? creditRecordModel[CREDIT_RECORD_FIELDS.IS_DELETED]
        : CREDIT_RECORD_DEFAULTS.IS_DELETED;
    this.deletedAt =
      creditRecordModel[CREDIT_RECORD_FIELDS.DELETED_AT] ||
      CREDIT_RECORD_DEFAULTS.DELETED_AT;
    this.createdAt = creditRecordModel[CREDIT_RECORD_FIELDS.CREATED_AT];
    this.updatedAt = creditRecordModel[CREDIT_RECORD_FIELDS.UPDATED_AT];
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      _id: this._id,
      orderId: this.orderId,
      creditPersonId: this.creditPersonId,
      paidAmount: this.paidAmount,
      paymentDate: this.paymentDate,
      paymentMethod: this.paymentMethod,
      notes: this.notes,
      addedBy: this.addedBy,
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
    return this.toJSON(); // All fields are public for credit record
  }

  /**
   * Static method to convert array of credit records
   * @param {Array} creditRecords
   * @returns {Array}
   */
  static fromArray(creditRecords) {
    return creditRecords.map((creditRecord) =>
      new CreditRecordResponseDTO(creditRecord).toJSON(),
    );
  }
}

/**
 * Credit Record List Response DTO (with pagination)
 */
export class CreditRecordListResponseDTO {
  constructor(
    creditRecords,
    pagination,
    message = "Credit records retrieved successfully",
  ) {
    this.creditRecords = CreditRecordResponseDTO.fromArray(creditRecords);
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
      data: this.creditRecords,
      pagination: this.pagination,
    };
  }
}

export default {
  CreateCreditRecordDTO,
  UpdateCreditRecordDTO,
  CreditRecordResponseDTO,
  CreditRecordListResponseDTO,
};
