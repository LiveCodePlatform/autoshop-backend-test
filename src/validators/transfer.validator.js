/**
 * Transfer Validators
 * Request validation schemas for transfer endpoints
 * Uses types from types/transfer.types.js for field names and enums
 * All validation constraints/rules are defined here
 */

import Joi from "joi";
import mongoose from "mongoose";
import {
  TRANSFER_FIELDS,
  TRANSFER_LINE_ITEM_FIELDS,
  TRANSFER_DEFAULTS,
  TRANSFER_STATUS,
  TRANSFER_SOURCE_TYPE,
  getValidStatuses,
  getValidSourceTypes,
} from "../types/transfer.types.js";

/**
 * Validation Constraints
 * All validation rules are defined here (not in types)
 */
const VALIDATION_CONSTRAINTS = {
  TRANSFER_NUMBER: {
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
};

/**
 * Transfer Line Item schema validation for CREATE request (for lineItems array)
 * User can provide either productCode or inventoryId
 */
const createTransferLineItemSchema = Joi.object({
  // productCode is optional - can use inventoryId instead
  productCode: Joi.string()
    .trim()
    .optional()
    .messages({
      "string.empty": "Product code cannot be empty",
    }),

  // inventoryId is optional - can use productCode instead
  [TRANSFER_LINE_ITEM_FIELDS.INVENTORY_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .optional()
    .messages({
      "any.invalid": "Inventory ID must be a valid ObjectId",
    }),

  [TRANSFER_LINE_ITEM_FIELDS.QUANTITY]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
    .required()
    .messages({
      "number.base": "Transfer quantity must be a number",
      "number.min": `Transfer quantity cannot be negative`,
      "any.required": "Transfer quantity is required",
    }),

  [TRANSFER_LINE_ITEM_FIELDS.GRN_LINE_ITEM_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .allow(null, "")
    .optional()
    .messages({
      "any.invalid": "GRN line item ID must be a valid ObjectId",
    }),

  [TRANSFER_LINE_ITEM_FIELDS.NOTES]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.LINE_ITEM_NOTES.MAX_LENGTH)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": `Line item notes cannot exceed ${VALIDATION_CONSTRAINTS.LINE_ITEM_NOTES.MAX_LENGTH} characters`,
    }),
})
  .custom((value, helpers) => {
    // Custom validation: Must provide either productCode or inventoryId
    if (!value.productCode && !value[TRANSFER_LINE_ITEM_FIELDS.INVENTORY_ID]) {
      return helpers.error("custom.productCodeOrInventoryIdRequired");
    }
    return value;
  }, "Product identification validation")
  .messages({
    "custom.productCodeOrInventoryIdRequired":
      "Each line item must have either productCode or inventoryId",
  });

/**
 * Transfer Line Item schema validation for UPDATE request (full line item object)
 */
const transferLineItemSchema = Joi.object({
  [TRANSFER_LINE_ITEM_FIELDS.INVENTORY_ID]: Joi.string()
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

  [TRANSFER_LINE_ITEM_FIELDS.QUANTITY]: Joi.number()
    .min(VALIDATION_CONSTRAINTS.QUANTITY.MIN)
    .required()
    .messages({
      "number.base": "Transfer quantity must be a number",
      "number.min": `Transfer quantity cannot be negative`,
      "any.required": "Transfer quantity is required",
    }),

  [TRANSFER_LINE_ITEM_FIELDS.GRN_LINE_ITEM_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .allow(null, "")
    .optional()
    .messages({
      "any.invalid": "GRN line item ID must be a valid ObjectId",
    }),

  [TRANSFER_LINE_ITEM_FIELDS.NOTES]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.LINE_ITEM_NOTES.MAX_LENGTH)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": `Line item notes cannot exceed ${VALIDATION_CONSTRAINTS.LINE_ITEM_NOTES.MAX_LENGTH} characters`,
    }),
});

/**
 * Validation schema for creating transfer
 */
export const createTransferSchema = Joi.object({
  [TRANSFER_FIELDS.TRANSFER_NUMBER]: Joi.string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.TRANSFER_NUMBER.MIN_LENGTH)
    .max(VALIDATION_CONSTRAINTS.TRANSFER_NUMBER.MAX_LENGTH)
    .uppercase()
    .optional()
    .messages({
      "string.min": `Transfer number must be at least ${VALIDATION_CONSTRAINTS.TRANSFER_NUMBER.MIN_LENGTH} character`,
      "string.max": `Transfer number cannot exceed ${VALIDATION_CONSTRAINTS.TRANSFER_NUMBER.MAX_LENGTH} characters`,
    }),

  [TRANSFER_FIELDS.SOURCE_TYPE]: Joi.string()
    .valid(...getValidSourceTypes())
    .optional() // Can be determined from grnId or sourceWarehouseId
    .messages({
      "any.only": `Source type must be one of: ${getValidSourceTypes().join(", ")}`,
    }),

  // Support legacy field names for backward compatibility
  grnId: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .optional()
    .messages({
      "any.invalid": "GRN ID must be a valid ObjectId",
    }),

  sourceWarehouseId: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .optional()
    .messages({
      "any.invalid": "Source warehouse ID must be a valid ObjectId",
    }),

  // sourceId is optional - can use grnId or sourceWarehouseId instead
  [TRANSFER_FIELDS.SOURCE_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .optional()
    .messages({
      "any.invalid": "Source ID must be a valid ObjectId",
    }),

  [TRANSFER_FIELDS.DESTINATION_WAREHOUSE_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .allow(null, "")
    .optional()
    .messages({
      "any.invalid": "Destination warehouse ID must be a valid ObjectId",
    }),

  [TRANSFER_FIELDS.DESTINATION_STOREFRONT_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .allow(null, "")
    .optional()
    .messages({
      "any.invalid": "Destination storefront ID must be a valid ObjectId",
    }),

  [TRANSFER_FIELDS.LINE_ITEMS]: Joi.array()
    .items(createTransferLineItemSchema)
    .min(1)
    .required()
    .messages({
      "array.base": "Line items must be an array",
      "array.min": "At least one line item is required",
      "any.required": "Line items are required",
    }),

  [TRANSFER_FIELDS.STATUS]: Joi.string()
    .valid(...getValidStatuses())
    .default(TRANSFER_DEFAULTS.STATUS)
    .optional()
    .messages({
      "any.only": `Status must be one of: ${getValidStatuses().join(", ")}`,
    }),

  [TRANSFER_FIELDS.TRANSFER_DATE]: Joi.date()
    .optional()
    .messages({
      "date.base": "Transfer date must be a valid date",
    }),

  [TRANSFER_FIELDS.NOTES]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": `Notes cannot exceed ${VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH} characters`,
    }),

  // transferredBy comes from authenticated user (req.user), not from request body
  [TRANSFER_FIELDS.TRANSFERRED_BY]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .optional()
    .messages({
      "any.invalid": "Transferred by must be a valid ObjectId",
    }),
})
  .custom((value, helpers) => {
    // Determine sourceType from provided fields
    const sourceType = value[TRANSFER_FIELDS.SOURCE_TYPE] || 
                      (value.grnId ? TRANSFER_SOURCE_TYPE.GRN : null) ||
                      (value.sourceWarehouseId ? TRANSFER_SOURCE_TYPE.WAREHOUSE : null);

    // Validate that source is provided (either sourceId, grnId, or sourceWarehouseId)
    const hasSource = value[TRANSFER_FIELDS.SOURCE_ID] || value.grnId || value.sourceWarehouseId;
    if (!hasSource) {
      return helpers.error("custom.sourceRequired");
    }

    // Custom validation: Ensure correct destination based on sourceType
    if (sourceType === TRANSFER_SOURCE_TYPE.GRN) {
      if (!value[TRANSFER_FIELDS.DESTINATION_WAREHOUSE_ID]) {
        return helpers.error("custom.grnRequiresWarehouse");
      }
    } else if (sourceType === TRANSFER_SOURCE_TYPE.WAREHOUSE) {
      if (!value[TRANSFER_FIELDS.DESTINATION_STOREFRONT_ID]) {
        return helpers.error("custom.warehouseRequiresStorefront");
      }
    }
    return value;
  }, "Source and destination validation")
  .messages({
    "custom.sourceRequired":
      "Source is required. Provide either sourceId, grnId (for GRN transfers), or sourceWarehouseId (for Warehouse transfers)",
    "custom.grnRequiresWarehouse":
      "destinationWarehouseId is required when sourceType is 'GRN' (GRN → Warehouse transfer)",
    "custom.warehouseRequiresStorefront":
      "destinationStorefrontId is required when sourceType is 'Warehouse' (Warehouse → Storefront transfer)",
  });

/**
 * Validation schema for updating transfer
 */
export const updateTransferSchema = Joi.object({
  [TRANSFER_FIELDS.SOURCE_TYPE]: Joi.string()
    .valid(...getValidSourceTypes())
    .optional()
    .messages({
      "any.only": `Source type must be one of: ${getValidSourceTypes().join(", ")}`,
    }),

  [TRANSFER_FIELDS.SOURCE_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .optional()
    .messages({
      "any.invalid": "Source ID must be a valid ObjectId",
    }),

  [TRANSFER_FIELDS.DESTINATION_WAREHOUSE_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .allow(null, "")
    .optional()
    .messages({
      "any.invalid": "Destination warehouse ID must be a valid ObjectId",
    }),

  [TRANSFER_FIELDS.DESTINATION_STOREFRONT_ID]: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .allow(null, "")
    .optional()
    .messages({
      "any.invalid": "Destination storefront ID must be a valid ObjectId",
    }),

  [TRANSFER_FIELDS.LINE_ITEMS]: Joi.array()
    .items(transferLineItemSchema)
    .min(1)
    .optional()
    .messages({
      "array.base": "Line items must be an array",
      "array.min": "At least one line item is required",
    }),

  [TRANSFER_FIELDS.STATUS]: Joi.string()
    .valid(...getValidStatuses())
    .optional()
    .messages({
      "any.only": `Status must be one of: ${getValidStatuses().join(", ")}`,
    }),

  [TRANSFER_FIELDS.TRANSFER_DATE]: Joi.date()
    .optional()
    .messages({
      "date.base": "Transfer date must be a valid date",
    }),

  [TRANSFER_FIELDS.RECEIVED_DATE]: Joi.date()
    .allow(null)
    .optional()
    .messages({
      "date.base": "Received date must be a valid date",
    }),

  [TRANSFER_FIELDS.NOTES]: Joi.string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": `Notes cannot exceed ${VALIDATION_CONSTRAINTS.NOTES.MAX_LENGTH} characters`,
    }),
})
  .custom((value, helpers) => {
    // Custom validation: If sourceType is updated, ensure correct destination
    if (value[TRANSFER_FIELDS.SOURCE_TYPE]) {
      if (value[TRANSFER_FIELDS.SOURCE_TYPE] === TRANSFER_SOURCE_TYPE.GRN) {
        if (!value[TRANSFER_FIELDS.DESTINATION_WAREHOUSE_ID]) {
          return helpers.error("custom.grnRequiresWarehouse");
        }
      } else if (
        value[TRANSFER_FIELDS.SOURCE_TYPE] === TRANSFER_SOURCE_TYPE.WAREHOUSE
      ) {
        if (!value[TRANSFER_FIELDS.DESTINATION_STOREFRONT_ID]) {
          return helpers.error("custom.warehouseRequiresStorefront");
        }
      }
    }
    return value;
  }, "Destination validation")
  .messages({
    "custom.grnRequiresWarehouse":
      "destinationWarehouseId is required when sourceType is 'GRN' (GRN → Warehouse transfer)",
    "custom.warehouseRequiresStorefront":
      "destinationStorefrontId is required when sourceType is 'Warehouse' (Warehouse → Storefront transfer)",
  })
  .min(1); // At least one field must be provided

/**
 * Validation schema for updating transfer status only
 */
export const updateTransferStatusSchema = Joi.object({
  [TRANSFER_FIELDS.STATUS]: Joi.string()
    .valid(...getValidStatuses())
    .required()
    .messages({
      "any.only": `Status must be one of: ${getValidStatuses().join(", ")}`,
      "any.required": "Status is required",
    }),
});

/**
 * Validation middleware for creating transfer
 */
export const validateCreateTransfer = (req, res, next) => {
  const { error, value } = createTransferSchema.validate(req.body, {
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
 * Validation middleware for updating transfer
 */
export const validateUpdateTransfer = (req, res, next) => {
  const { error, value } = updateTransferSchema.validate(req.body, {
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
 * Validation middleware for updating transfer status only
 */
export const validateUpdateTransferStatus = (req, res, next) => {
  const { error, value } = updateTransferStatusSchema.validate(req.body, {
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
  createTransferSchema,
  updateTransferSchema,
  updateTransferStatusSchema,
  validateCreateTransfer,
  validateUpdateTransfer,
  validateUpdateTransferStatus,
  VALIDATION_CONSTRAINTS,
};
