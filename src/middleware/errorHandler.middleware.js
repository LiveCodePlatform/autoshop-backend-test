import AppError from "../errors/AppError.js";
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  CastError,
  DuplicateKeyError,
} from "../errors/errorTypes.js";

/**
 * Development Error Response
 * Shows detailed error information for debugging
 */
const devErrorResponse = (res, error) => {
  res.status(error.statusCode || 500).json({
    success: error.success ?? false,
    statusCode: error.statusCode || 500,
    message: error.message,
    error: error,
    stack: error.stack,
    timestamp: error.timestamp || new Date().toISOString(),
    ...(error.errorCode && { errorCode: error.errorCode }),
  });
};

/**
 * Production Error Response
 * Shows user-friendly error messages only
 */
const prodErrorResponse = (res, error) => {
  if (error.isOperational) {
    // Operational errors (trusted errors) - show message
    res.status(error.statusCode || 500).json({
      success: error.success ?? false,
      statusCode: error.statusCode || 500,
      message: error.message,
      ...(error.errorCode && { errorCode: error.errorCode }),
    });
  } else {
    // Programming errors (untrusted errors) - hide details
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Something went wrong. Please try again later.",
    });
  }
};

/**
 * Transform MongoDB CastError to AppError
 */
const handleCastError = (err) => {
  const message = `Invalid value for ${err.path}: ${err.value}`;
  return new CastError(message, err.path);
};

/**
 * Transform MongoDB Duplicate Key Error to AppError
 */
const handleDuplicateKeyError = (err) => {
  const key = Object.keys(err.keyValue)[0];
  const value = err.keyValue[key];
  const message = `The ${key} "${value}" is already in use. Please choose another one.`;
  return new DuplicateKeyError(message, key, value);
};

/**
 * Transform Mongoose ValidationError to AppError
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const errorMessages = errors.join(". ");
  const message = `Invalid input data: ${errorMessages}`;
  return new ValidationError(message);
};

/**
 * Transform JWT Token Expired Error to AppError
 */
const handleJWTExpiredError = () => {
  return new UnauthorizedError("JWT has expired. Please login again.");
};

/**
 * Transform JWT Invalid Token Error to AppError
 */
const handleJWTError = () => {
  return new UnauthorizedError("Invalid token. Please login again.");
};

/**
 * Global Error Handler Middleware
 * Catches all errors and sends appropriate JSON response
 *
 * @param {Error} error - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
export const globalErrorHandler = (error, req, res, next) => {
  // Ensure error has statusCode and success properties
  error.statusCode = error.statusCode || 500;
  error.success = error.success ?? false;

  if (process.env.NODE_ENV === "development") {
    // Development: Show detailed error information
    devErrorResponse(res, error);
  } else if (process.env.NODE_ENV === "production") {
    // Production: Transform technical errors to user-friendly errors
    let transformedError = error;

    // Transform MongoDB/Mongoose errors
    if (error.name === "CastError") {
      transformedError = handleCastError(error);
    } else if (error.code === 11000) {
      transformedError = handleDuplicateKeyError(error);
    } else if (error.name === "ValidationError") {
      transformedError = handleValidationError(error);
    } else if (error.name === "TokenExpiredError") {
      transformedError = handleJWTExpiredError();
    } else if (error.name === "JsonWebTokenError") {
      transformedError = handleJWTError();
    }

    // Send production response
    prodErrorResponse(res, transformedError);
  }
};

export default globalErrorHandler;
