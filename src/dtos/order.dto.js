/**
 * Order DTOs (Data Transfer Objects)
 * Transforms data between layers using types from types/order.types.js
 */

import {
  ORDER_FIELDS,
  ORDER_DEFAULTS,
  ORDER_STATUS,
  PAYMENT_TYPE,
  PAYMENT_METHOD,
  isValidOrderStatus,
  isValidPaymentType,
  isValidPaymentMethod,
} from "../types/order.types.js";

/**
 * Create Order DTO
 * Transforms request data for creating order
 */
export class CreateOrderDTO {
  constructor(data) {
    this.storefrontId = data[ORDER_FIELDS.STOREFRONT_ID];
    this.ordersProducts = data[ORDER_FIELDS.ORDERS_PRODUCTS] || [];
    this.creditPersonId =
      data[ORDER_FIELDS.CREDIT_PERSON_ID] || ORDER_DEFAULTS.CREDIT_PERSON_ID;
    this.subTotal = data[ORDER_FIELDS.SUB_TOTAL] || ORDER_DEFAULTS.SUB_TOTAL;
    this.tax = data[ORDER_FIELDS.TAX] || ORDER_DEFAULTS.TAX;
    this.discount = data[ORDER_FIELDS.DISCOUNT] || ORDER_DEFAULTS.DISCOUNT;
    this.finalAmount = data[ORDER_FIELDS.FINAL_AMOUNT];
    this.paidAmount = data[ORDER_FIELDS.PAID_AMOUNT];
    this.orderStatus =
      data[ORDER_FIELDS.ORDER_STATUS] || ORDER_DEFAULTS.ORDER_STATUS;
    this.soldBy = data[ORDER_FIELDS.SOLD_BY];
    this.paymentType =
      data[ORDER_FIELDS.PAYMENT_TYPE] || ORDER_DEFAULTS.PAYMENT_TYPE;
    this.paymentMethod =
      data[ORDER_FIELDS.PAYMENT_METHOD] || ORDER_DEFAULTS.PAYMENT_METHOD;
  }

  /**
   * Convert to database model format
   * @returns {Object}
   */
  toModel() {
    return {
      [ORDER_FIELDS.STOREFRONT_ID]: this.storefrontId,
      [ORDER_FIELDS.ORDERS_PRODUCTS]: this.ordersProducts.map((product) => ({
        [ORDER_FIELDS.INVENTORY_ID]: product[ORDER_FIELDS.INVENTORY_ID],
        [ORDER_FIELDS.QUANTITY]: product[ORDER_FIELDS.QUANTITY],
        [ORDER_FIELDS.UNIT_PRICE]: product[ORDER_FIELDS.UNIT_PRICE],
      })),
      [ORDER_FIELDS.CREDIT_PERSON_ID]: this.creditPersonId,
      [ORDER_FIELDS.SUB_TOTAL]: this.subTotal,
      [ORDER_FIELDS.TAX]: this.tax,
      [ORDER_FIELDS.DISCOUNT]: this.discount,
      [ORDER_FIELDS.FINAL_AMOUNT]: this.finalAmount,
      [ORDER_FIELDS.PAID_AMOUNT]: this.paidAmount,
      [ORDER_FIELDS.ORDER_STATUS]: this.orderStatus,
      [ORDER_FIELDS.SOLD_BY]: this.soldBy,
      [ORDER_FIELDS.PAYMENT_TYPE]: this.paymentType,
      [ORDER_FIELDS.PAYMENT_METHOD]: this.paymentMethod,
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
 * Update Order DTO
 * Transforms request data for updating order
 */
export class UpdateOrderDTO {
  constructor(data) {
    // Only set properties that are provided
    if (data[ORDER_FIELDS.ORDER_STATUS] !== undefined) {
      const status = data[ORDER_FIELDS.ORDER_STATUS];
      if (isValidOrderStatus(status)) {
        this.orderStatus = status;
      } else {
        throw new Error(
          `Invalid order status. Must be one of: ${Object.values(ORDER_STATUS).join(", ")}`
        );
      }
    }

    if (data[ORDER_FIELDS.CREDIT_PERSON_ID] !== undefined) {
      this.creditPersonId =
        data[ORDER_FIELDS.CREDIT_PERSON_ID] || ORDER_DEFAULTS.CREDIT_PERSON_ID;
    }

    if (data[ORDER_FIELDS.SUB_TOTAL] !== undefined) {
      this.subTotal = data[ORDER_FIELDS.SUB_TOTAL];
    }

    if (data[ORDER_FIELDS.TAX] !== undefined) {
      this.tax = data[ORDER_FIELDS.TAX];
    }

    if (data[ORDER_FIELDS.DISCOUNT] !== undefined) {
      this.discount = data[ORDER_FIELDS.DISCOUNT];
    }

    if (data[ORDER_FIELDS.FINAL_AMOUNT] !== undefined) {
      this.finalAmount = data[ORDER_FIELDS.FINAL_AMOUNT];
    }

    if (data[ORDER_FIELDS.PAID_AMOUNT] !== undefined) {
      this.paidAmount = data[ORDER_FIELDS.PAID_AMOUNT];
    }

    if (data[ORDER_FIELDS.PAYMENT_TYPE] !== undefined) {
      const type = data[ORDER_FIELDS.PAYMENT_TYPE];
      if (isValidPaymentType(type)) {
        this.paymentType = type;
      } else {
        throw new Error(
          `Invalid payment type. Must be one of: ${Object.values(PAYMENT_TYPE).join(", ")}`
        );
      }
    }

    if (data[ORDER_FIELDS.PAYMENT_METHOD] !== undefined) {
      const method = data[ORDER_FIELDS.PAYMENT_METHOD];
      if (isValidPaymentMethod(method)) {
        this.paymentMethod = method;
      } else {
        throw new Error(
          `Invalid payment method. Must be one of: ${Object.values(PAYMENT_METHOD).join(", ")}`
        );
      }
    }
  }

  /**
   * Convert to database update format
   * @returns {Object}
   */
  toUpdateModel() {
    const updateData = {};

    if (this.orderStatus !== undefined)
      updateData[ORDER_FIELDS.ORDER_STATUS] = this.orderStatus;
    if (this.creditPersonId !== undefined)
      updateData[ORDER_FIELDS.CREDIT_PERSON_ID] = this.creditPersonId;
    if (this.subTotal !== undefined)
      updateData[ORDER_FIELDS.SUB_TOTAL] = this.subTotal;
    if (this.tax !== undefined) updateData[ORDER_FIELDS.TAX] = this.tax;
    if (this.discount !== undefined)
      updateData[ORDER_FIELDS.DISCOUNT] = this.discount;
    if (this.finalAmount !== undefined)
      updateData[ORDER_FIELDS.FINAL_AMOUNT] = this.finalAmount;
    if (this.paidAmount !== undefined)
      updateData[ORDER_FIELDS.PAID_AMOUNT] = this.paidAmount;
    if (this.paymentType !== undefined)
      updateData[ORDER_FIELDS.PAYMENT_TYPE] = this.paymentType;
    if (this.paymentMethod !== undefined)
      updateData[ORDER_FIELDS.PAYMENT_METHOD] = this.paymentMethod;

    return updateData;
  }
}

/**
 * Order Response DTO
 * Transforms database model to API response format
 */
export class OrderResponseDTO {
  constructor(orderModel) {
    this.id = orderModel._id || orderModel.id;
    this.orderNumber = orderModel[ORDER_FIELDS.ORDER_NUMBER] || null;
    this.storefrontId = orderModel[ORDER_FIELDS.STOREFRONT_ID];
    this.ordersProducts = orderModel[ORDER_FIELDS.ORDERS_PRODUCTS] || [];
    this.creditPersonId =
      orderModel[ORDER_FIELDS.CREDIT_PERSON_ID] || null;
    this.subTotal = orderModel[ORDER_FIELDS.SUB_TOTAL] || null;
    this.tax = orderModel[ORDER_FIELDS.TAX] || ORDER_DEFAULTS.TAX;
    this.discount = orderModel[ORDER_FIELDS.DISCOUNT] || ORDER_DEFAULTS.DISCOUNT;
    this.finalAmount = orderModel[ORDER_FIELDS.FINAL_AMOUNT];
    this.paidAmount = orderModel[ORDER_FIELDS.PAID_AMOUNT];
    this.extraChange =
      orderModel[ORDER_FIELDS.EXTRA_CHANGE] || ORDER_DEFAULTS.EXTRA_CHANGE;
    this.orderStatus =
      orderModel[ORDER_FIELDS.ORDER_STATUS] || ORDER_DEFAULTS.ORDER_STATUS;
    this.soldBy = orderModel[ORDER_FIELDS.SOLD_BY];
    this.isDeleted = orderModel[ORDER_FIELDS.IS_DELETED] || ORDER_DEFAULTS.IS_DELETED;
    this.deletedAt = orderModel[ORDER_FIELDS.DELETED_AT] || null;
    this.paymentType =
      orderModel[ORDER_FIELDS.PAYMENT_TYPE] || ORDER_DEFAULTS.PAYMENT_TYPE;
    this.paymentMethod =
      orderModel[ORDER_FIELDS.PAYMENT_METHOD] || ORDER_DEFAULTS.PAYMENT_METHOD;
    this.totalPaidAmount = orderModel.totalPaidAmount || null; // virtual
    this.remainingBalance = orderModel.remainingBalance || null; // virtual
    this.createdAt = orderModel[ORDER_FIELDS.CREATED_AT];
    this.updatedAt = orderModel[ORDER_FIELDS.UPDATED_AT];
  }

  /**
   * Convert to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      orderNumber: this.orderNumber,
      storefrontId: this.storefrontId,
      ordersProducts: this.ordersProducts,
      creditPersonId: this.creditPersonId,
      subTotal: this.subTotal,
      tax: this.tax,
      discount: this.discount,
      finalAmount: this.finalAmount,
      paidAmount: this.paidAmount,
      extraChange: this.extraChange,
      orderStatus: this.orderStatus,
      soldBy: this.soldBy,
      isDeleted: this.isDeleted,
      deletedAt: this.deletedAt,
      paymentType: this.paymentType,
      paymentMethod: this.paymentMethod,
      totalPaidAmount: this.totalPaidAmount,
      remainingBalance: this.remainingBalance,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convert to public format (exclude sensitive data if any)
   * @returns {Object}
   */
  toPublicJSON() {
    return this.toJSON(); // All fields are public for orders
  }

  /**
   * Static method to convert array of orders
   * @param {Array} orders
   * @returns {Array}
   */
  static fromArray(orders) {
    return orders.map((order) => new OrderResponseDTO(order).toJSON());
  }
}

/**
 * Order List Response DTO (with pagination)
 */
export class OrderListResponseDTO {
  constructor(orders, pagination, message = "Orders retrieved successfully") {
    this.orders = OrderResponseDTO.fromArray(orders);
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
      data: this.orders,
      pagination: this.pagination,
    };
  }
}

export default {
  CreateOrderDTO,
  UpdateOrderDTO,
  OrderResponseDTO,
  OrderListResponseDTO,
};
