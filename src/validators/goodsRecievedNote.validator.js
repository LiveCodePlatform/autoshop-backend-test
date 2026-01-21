/**
 * Goods Received Note (GRN) Validators
 * Request validation schemas for GRN endpoints
 * Uses types from types/goodsRecievedNote.types.js for field names and enums
 * All validation constraints/rules are defined here
 */

import Joi from "joi";
import mongoose from "mongoose";
import {
  GRN_FIELDS,
  GRN_LINE_ITEM_FIELDS,
  GRN_DEFAULTS,
  GRN_LINE_ITEM_DEFAULTS,
  GRN_STATUS,
  getValidStatuses,
} from "../types/goodsRecievedNote.types.js";

/**
 * Validation Constraints
 * All validation rules are defined here (not in types)
 */
const VALIDATION_CONSTRAINTS = {
  GRN_NUMBER: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
  },
  NOTES: {
    MAX_LENGTH: 1000,
  },
  LINE_ITEM_NOTES: {
    MAX_LENGTH: 500,
  },
  QUANTITY: {
    MIN: 0,
  },
  PRICE: {
    MIN: 0,
  },
};

/**
 * GRN Line Item schema validation (for lineItems array)
 */
const grnLineItemSchema = Joi.object({
  [GRN_LINE_ITEM_FIELDS.INVENTORY_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .required()
    .messages({
      "string.empty": "Inventory ID is required",
      "any.invalid": "Inventory ID must be a valid ObjectId",
      "any.required": "Inventory ID is required",
    }),

  [GRN_LINE_ITEM_FIELDS.RECEIVED_QUANTITY]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
    .required()
    .messages({
      "number.base": "Received quantity must be a number",
      "number.min": `Received quantity cannot be negative`,
      "any.required": "Received quantity is required",
    }),

  [GRN_LINE_ITEM_FIELDS.GOOD_QUANTITY]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
    .required()
    .messages({
      "number.base": "Good quantity must be a number",
      "number.min": `Good quantity cannot be negative`,
      "any.required": "Good quantity is required",
    }),

  [GRN_LINE_ITEM_FIELDS.BAD_QUANTITY]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
    .default(GRN_LINE_ITEM_DEFAULTS.BAD_QUANTITY)
    .optional()
    .messages({
      "number.base": "Bad quantity must be a number",
      "number.min": `Bad quantity cannot be negative`,
    }),

  [GRN_LINE_ITEM_FIELDS.TRANSFERRED_QUANTITY]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
    .default(GRN_LINE_ITEM_DEFAULTS.TRANSFERRED_QUANTITY)
    .optional()
    .messages({
      "number.base": "Transferred quantity must be a number",
      "number.min": `Transferred quantity cannot be negative`,
    }),

  [GRN_LINE_ITEM_FIELDS.UNIT_PRICE]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.PRICE.MIN)
    .required()
    .messages({
      "number.base": "Unit price must be a number",
      "number.min": `Unit price cannot be negative`,
      "any.required": "Unit price is required",
    }),

  [GRN_LINE_ITEM_FIELDS.TOTAL_PRICE]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.PRICE.MIN)
    .required()
    .messages({
      "number.base": "Total price must be a number",
      "number.min": `Total price cannot be negative`,
      "any.required": "Total price is required",
    }),

  [GRN_LINE_ITEM_FIELDS.NOTES]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.LINE_ITEM_NOTES.MAX_LENGTH)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": `Line item notes cannot exceed ${VALIDATION_CONSTRAINTS.LINE_ITEM_NOTES.MAX_LENGTH} characters`,
    }),
})
  .custom((value, helpers) => {
    // Custom validation: goodQuantity + badQuantity should equal receivedQuantity
    const receivedQty = value[GRN_LINE_ITEM_FIELDS.RECEIVED_QUANTITY] || 0;
    const goodQty = value[GRN_LINE_ITEM_FIELDS.GOOD_QUANTITY] || 0;
    const badQty = value[GRN_LINE_ITEM_FIELDS.BAD_QUANTITY] || 0;

    if (goodQty + badQty !== receivedQty) {
      return helpers.error("custom.quantityMismatch");
    }
    return value;
  }, "Quantity validation")
  .messages({
    "custom.quantityMismatch":
      "Good quantity + Bad quantity must equal Received quantity",
  })
  .custom((value, helpers) => {
    // Custom validation: totalPrice should equal goodQuantity * unitPrice
    const goodQty = value[GRN_LINE_ITEM_FIELDS.GOOD_QUANTITY] || 0;
    const unitPrice = value[GRN_LINE_ITEM_FIELDS.UNIT_PRICE] || 0;
    const totalPrice = value[GRN_LINE_ITEM_FIELDS.TOTAL_PRICE] || 0;
    const expectedTotal = goodQty * unitPrice;

    // Allow small floating point differences (0.01)
    if (Math.abs(totalPrice - expectedTotal) > 0.01) {
      return helpers.error("custom.priceMismatch");
    }
    return value;
  }, "Price validation")
  .messages({
    "custom.priceMismatch":
      "Total price must equal Good quantity × Unit price",
  });

/**
 * Validation schema for creating GRN
 */
export const createGRNSchema = Joi.object({
  [GRN_FIELDS.GRN_NUMBER]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.GRN_NUMBER.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.GRN_NUMBER.MAX_LENGTH)
    .uppercase()
    .optional()
    .messages({
      "string.min": `GRN number must be at least ${VALIDATION_CONSTRAINTS.GRN_NUMBER.MIN_LENGTH} character`,
      "string.max": `GRN number cannot exceed ${VALIDATION_CONSTRAINTS.GRN_NUMBER.MAX_LENGTH} characters`,
    }),

  [GRN_FIELDS.PURCHASING_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .required()
    .messages({
      "string.empty": "Purchasing ID is required",
      "any.invalid": "Purchasing ID must be a valid ObjectId",
      "any.required": "Purchasing ID is required",
    }),

  [GRN_FIELDS.GRN_DATE]: Joi.date()
    .optional()
    .messages({
      "date.base": "GRN date must be a valid date",
    }),

  [GRN_FIELDS.STATUS]: Joi.string()
    .valid(...getValidStatuses())
    .default(GRN_DEFAULTS.STATUS)
    .optional()
    .messages({
      "any.only": `Status must be one of: ${getValidStatuses().join(", ")}`,
    }),

  [GRN_FIELDS.LINE_ITEMS]: Joi.array()
    .items(grnLineItemSchema)
    .min(1)
    .required()
    .messages({
      "array.base": "Line items must be an array",
      "array.min": "At least one line item is required",
      "any.required": "Line items are required",
    }),

  [GRN_FIELDS.NOTES]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH)
    .default(GRN_DEFAULTS.NOTES)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": `Notes cannot exceed ${VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH} characters`,
    }),

  [GRN_FIELDS.TOTAL_AMOUNT]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.PRICE.MIN)
    .required()
    .messages({
      "number.base": "Total amount must be a number",
      "number.min": `Total amount cannot be negative`,
      "any.required": "Total amount is required",
    }),
})
  .custom((value, helpers) => {
    // Custom validation: Validate that totalAmount matches sum of line items totalPrice
    if (value[GRN_FIELDS.LINE_ITEMS] && value[GRN_FIELDS.TOTAL_AMOUNT]) {
      const calculatedTotal = value[GRN_FIELDS.LINE_ITEMS].reduce(
        (sum, item) => {
          const itemTotal = item[GRN_LINE_ITEM_FIELDS.TOTAL_PRICE] || 0;
          return sum + itemTotal;
        },
        0
      );

      // Allow small floating point differences (0.01)
      if (
        Math.abs(calculatedTotal - value[GRN_FIELDS.TOTAL_AMOUNT]) > 0.01
      ) {
        return helpers.error("custom.totalAmountMismatch");
      }
    }
    return value;
  }, "Total amount validation")
  .messages({
    "custom.totalAmountMismatch":
      "Total amount must match the sum of all line items totalPrice",
  });

/**
 * Validation schema for updating GRN
 */
export const updateGRNSchema = Joi.object({
  [GRN_FIELDS.GRN_NUMBER]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.GRN_NUMBER.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.GRN_NUMBER.MAX_LENGTH)
    .uppercase()
    .optional()
    .messages({
      "string.min": `GRN number must be at least ${VALIDATION_CONSTRAINTS.GRN_NUMBER.MIN_LENGTH} character`,
      "string.max": `GRN number cannot exceed ${VALIDATION_CONSTRAINTS.GRN_NUMBER.MAX_LENGTH} characters`,
    }),

  [GRN_FIELDS.PURCHASING_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .optional()
    .messages({
      "any.invalid": "Purchasing ID must be a valid ObjectId",
    }),

  [GRN_FIELDS.GRN_DATE]: Joi.date()
    .optional()
    .messages({
      "date.base": "GRN date must be a valid date",
    }),

  [GRN_FIELDS.STATUS]: Joi.string()
    .valid(...getValidStatuses())
    .optional()
    .messages({
      "any.only": `Status must be one of: ${getValidStatuses().join(", ")}`,
    }),

  [GRN_FIELDS.LINE_ITEMS]: Joi.array()
    .items(grnLineItemSchema)
    .min(1)
    .optional()
    .messages({
      "array.base": "Line items must be an array",
      "array.min": "At least one line item is required",
    }),

  [GRN_FIELDS.NOTES]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": `Notes cannot exceed ${VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH} characters`,
    }),

  [GRN_FIELDS.TOTAL_AMOUNT]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.PRICE.MIN)
    .optional()
    .messages({
      "number.base": "Total amount must be a number",
      "number.min": `Total amount cannot be negative`,
    }),
})
  .custom((value, helpers) => {
    // Custom validation: If lineItems or totalAmount are updated, validate they match
    if (value[GRN_FIELDS.LINE_ITEMS] && value[GRN_FIELDS.TOTAL_AMOUNT]) {
      const calculatedTotal = value[GRN_FIELDS.LINE_ITEMS].reduce(
        (sum, item) => {
          const itemTotal = item[GRN_LINE_ITEM_FIELDS.TOTAL_PRICE] || 0;
          return sum + itemTotal;
        },
        0
      );

      // Allow small floating point differences (0.01)
      if (
        Math.abs(calculatedTotal - value[GRN_FIELDS.TOTAL_AMOUNT]) > 0.01
      ) {
        return helpers.error("custom.totalAmountMismatch");
      }
    }
    return value;
  }, "Total amount validation")
  .messages({
    "custom.totalAmountMismatch":
      "Total amount must match the sum of all line items totalPrice",
  })
  .min(1); // At least one field must be provided

/**
 * Validation schema for updating GRN status only
 */
export const updateGRNStatusSchema = Joi.object({
  [GRN_FIELDS.STATUS]: Joi.string()
    .valid(...getValidStatuses())
    .required()
    .messages({
      "any.only": `Status must be one of: ${getValidStatuses().join(", ")}`,
      "any.required": "Status is required",
    }),
});

/**
 * Validation schema for updating GRN line items only
 */
export const updateGRNLineItemsSchema = Joi.object({
  [GRN_FIELDS.LINE_ITEMS]: Joi.array()
    .items(
      Joi.object({
        lineItemId: Joi.string()
          .trim()
          .custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
              return helpers.error("any.invalid");
            }
            return value;
          })
          .required()
          .messages({
            "string.empty": "Line item ID is required",
            "any.invalid": "Line item ID must be a valid ObjectId",
            "any.required": "Line item ID is required",
          }),
        [GRN_LINE_ITEM_FIELDS.GOOD_QUANTITY]: Joi.number()
          .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
          .required()
          .messages({
            "number.base": "Good quantity must be a number",
            "number.min": `Good quantity cannot be negative`,
            "any.required": "Good quantity is required",
          }),
        [GRN_LINE_ITEM_FIELDS.BAD_QUANTITY]: Joi.number()
          .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
          .required()
          .messages({
            "number.base": "Bad quantity must be a number",
            "number.min": `Bad quantity cannot be negative`,
            "any.required": "Bad quantity is required",
          }),
        [GRN_LINE_ITEM_FIELDS.NOTES]: Joi.string()
          .trim()
          .max(VALIDATION_CONSTRAINTS.LINE_ITEM_NOTES.MAX_LENGTH)
          .allow(null, "")
          .optional()
          .messages({
            "string.max": `Line item notes cannot exceed ${VALIDATION_CONSTRAINTS.LINE_ITEM_NOTES.MAX_LENGTH} characters`,
          }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Line items must be an array",
      "array.min": "At least one line item is required",
      "any.required": "Line items are required",
    }),
});

/**
 * Validation middleware for creating GRN
 */
export const validateCreateGRN = (req, res, next) => {
  const { error, value } = createGRNSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.body = value;
  next();
};

/**
 * Validation middleware for updating GRN
 */
export const validateUpdateGRN = (req, res, next) => {
  const { error, value } = updateGRNSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.body = value;
  next();
};

/**
 * Validation middleware for updating GRN status only
 */
export const validateUpdateGRNStatus = (req, res, next) => {
  const { error, value } = updateGRNStatusSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.body = value;
  next();
};

/**
 * Validation middleware for updating GRN line items only
 */
export const validateUpdateGRNLineItems = (req, res, next) => {
  const { error, value } = updateGRNLineItemsSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.body = value;
  next();
};

// Export constraints for model use if needed (optional)
export { VALIDATION_CONSTRAINTS };

export default {
  createGRNSchema,
  updateGRNSchema,
  updateGRNStatusSchema,
  updateGRNLineItemsSchema,
  validateCreateGRN,
  validateUpdateGRN,
  validateUpdateGRNStatus,
  validateUpdateGRNLineItems,
  VALIDATION_CONSTRAINTS,
};
