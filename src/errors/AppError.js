/**
 * Application Error Class
 * Enhanced version of CustomError with additional features
 *
 * @example
 * throw new AppError(400, "Invalid input");
 * throw new AppError(404, "User not found", "USER_NOT_FOUND");
 */
class AppError extends Error {
  /**
   * Create an application error
   *
   * @param {number} statusCode - HTTP status code (e.g., 400, 404, 500)
   * @param {string} message - Error message
   * @param {string|null} errorCode - Optional error code for programmatic handling (e.g., "VALIDATION_ERROR")
   */
  constructor(statusCode, message, errorCode = null) {
    super(message);

    this.statusCode = statusCode;
    this.errorCode = errorCode; // NEW: Programmatic error code
    this.success = statusCode >= 200 && statusCode < 400; // FIXED: More intuitive logic
    this.isOperational = true; // Marks as operational (trusted) error
    this.timestamp = new Date().toISOString(); // NEW: When error occurred

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set name to constructor name
    this.name = this.constructor.name;
  }

  /**
   * Convert error to JSON for API responses
   * @returns {Object} Error object for API response
   */
  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      ...(this.errorCode && { errorCode: this.errorCode }),
      ...(process.env.NODE_ENV === "development" && {
        stack: this.stack,
        timestamp: this.timestamp,
      }),
    };
  }
}

export default AppError;
