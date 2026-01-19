/**
 * HTTP Status Codes Constants
 * Single source of truth for all HTTP status codes used in the application
 *
 * Usage:
 * import { HTTP_STATUS } from '../constants/statusCodes.js';
 * res.status(HTTP_STATUS.OK).json(...);
 * throw new AppError(HTTP_STATUS.NOT_FOUND, "Resource not found");
 */

/**
 * Successful Responses (2xx)
 */
export const HTTP_STATUS = {
  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 3xx Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

/**
 * Success Status Codes (2xx)
 */
export const SUCCESS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
};

/**
 * Client Error Status Codes (4xx)
 */
export const CLIENT_ERROR_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
};

/**
 * Server Error Status Codes (5xx)
 */
export const SERVER_ERROR_CODES = {
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

/**
 * Check if status code is successful (2xx)
 * @param {number} statusCode
 * @returns {boolean}
 */
export const isSuccessCode = (statusCode) => {
  return statusCode >= 200 && statusCode < 300;
};

/**
 * Check if status code is client error (4xx)
 * @param {number} statusCode
 * @returns {boolean}
 */
export const isClientErrorCode = (statusCode) => {
  return statusCode >= 400 && statusCode < 500;
};

/**
 * Check if status code is server error (5xx)
 * @param {number} statusCode
 * @returns {boolean}
 */
export const isServerErrorCode = (statusCode) => {
  return statusCode >= 500 && statusCode < 600;
};

/**
 * Check if status code is an error (4xx or 5xx)
 * @param {number} statusCode
 * @returns {boolean}
 */
export const isErrorCode = (statusCode) => {
  return statusCode >= 400;
};

// Default export for convenience
export default HTTP_STATUS;
