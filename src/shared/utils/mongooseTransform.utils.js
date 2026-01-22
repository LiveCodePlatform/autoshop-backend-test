/**
 * Mongoose Transform Utilities
 * Standard transforms for converting MongoDB documents to REST API format
 */

/**
 * Standard transform function to convert _id to id for REST API responses
 * Removes _id and __v, converts _id to id
 * @param {Object} doc - The mongoose document
 * @param {Object} ret - The plain object representation
 * @returns {Object} Transformed object with id instead of _id
 */
export const transformId = (doc, ret) => {
  // Convert _id to id
  if (ret._id) {
    ret.id = ret._id.toString();
    delete ret._id;
  }

  // Remove version key
  if (ret.__v !== undefined) {
    delete ret.__v;
  }

  return ret;
};

/**
 * Standard Mongoose schema options for REST API responses
 * Includes virtuals and transforms _id to id
 */
export const mongooseSchemaOptions = {
  toJSON: {
    virtuals: true,
    transform: transformId,
  },
  toObject: {
    virtuals: true,
    transform: transformId,
  },
};

export default {
  transformId,
  mongooseSchemaOptions,
};
