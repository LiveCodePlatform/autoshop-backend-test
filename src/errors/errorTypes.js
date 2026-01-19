import AppError from "./AppError.js";

/**
 * Validation Error
 * Used when input data validation fails
 *
 * @example
 * throw new ValidationError("Invalid email format");
 * throw new ValidationError("Invalid email format", "email");
 */
export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(400, message, "VALIDATION_ERROR");
    this.field = field; // Specific field that failed validation
  }

  toJSON() {
    return {
      ...super.toJSON(),
      ...(this.field && { field: this.field }),
    };
  }
}

/**
 * Not Found Error
 * Used when a requested resource doesn't exist
 *
 * @example
 * throw new NotFoundError("User");
 * throw new NotFoundError("Order", orderId);
 */
export class NotFoundError extends AppError {
  constructor(resource, id = null) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(404, message, "NOT_FOUND");
    this.resource = resource; // Resource type that wasn't found
    this.id = id; // Optional ID that was searched
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resource: this.resource,
      ...(this.id && { id: this.id }),
    };
  }
}

/**
 * Unauthorized Error
 * Used when authentication is required but missing/invalid
 *
 * @example
 * throw new UnauthorizedError();
 * throw new UnauthorizedError("Invalid token");
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized. Please login to access this resource.") {
    super(401, message, "UNAUTHORIZED");
  }
}

/**
 * Forbidden Error
 * Used when user is authenticated but lacks permission
 *
 * @example
 * throw new ForbiddenError();
 * throw new ForbiddenError("You don't have permission to access this resource");
 */
export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to access this resource.") {
    super(403, message, "FORBIDDEN");
  }
}

/**
 * Bad Request Error
 * Used for general client errors (invalid request format, etc.)
 *
 * @example
 * throw new BadRequestError("Invalid request format");
 */
export class BadRequestError extends AppError {
  constructor(message) {
    super(400, message, "BAD_REQUEST");
  }
}

/**
 * Conflict Error
 * Used when request conflicts with current state (e.g., duplicate key)
 *
 * @example
 * throw new ConflictError("Email already exists", "email");
 */
export class ConflictError extends AppError {
  constructor(message, field = null) {
    super(409, message, "CONFLICT");
    this.field = field; // Field that caused the conflict
  }

  toJSON() {
    return {
      ...super.toJSON(),
      ...(this.field && { field: this.field }),
    };
  }
}

/**
 * Unprocessable Entity Error
 * Used when request is syntactically correct but semantically incorrect
 *
 * @example
 * throw new UnprocessableEntityError("Order cannot be cancelled after payment");
 */
export class UnprocessableEntityError extends AppError {
  constructor(message) {
    super(422, message, "UNPROCESSABLE_ENTITY");
  }
}

/**
 * Internal Server Error
 * Used for unexpected server errors
 *
 * @example
 * throw new InternalServerError("Database connection failed");
 */
export class InternalServerError extends AppError {
  constructor(message = "An internal server error occurred.") {
    super(500, message, "INTERNAL_SERVER_ERROR");
  }
}

/**
 * Service Unavailable Error
 * Used when service is temporarily unavailable
 *
 * @example
 * throw new ServiceUnavailableError("Service is under maintenance");
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = "Service is temporarily unavailable.") {
    super(503, message, "SERVICE_UNAVAILABLE");
  }
}

/**
 * Too Many Requests Error
 * Used when rate limit is exceeded
 *
 * @example
 * throw new TooManyRequestsError("Rate limit exceeded. Please try again later");
 */
export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(429, message, "TOO_MANY_REQUESTS");
  }
}

/**
 * Cast Error (Mongoose)
 * Used when invalid ID format is provided
 *
 * @example
 * throw new CastError("Invalid expense ID format");
 */
export class CastError extends AppError {
  constructor(message, field = "id") {
    super(400, message, "CAST_ERROR");
    this.field = field; // Field that has invalid format
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
    };
  }
}

/**
 * Duplicate Key Error (MongoDB)
 * Used when unique constraint is violated
 *
 * @example
 * throw new DuplicateKeyError("Email already exists", "email", "user@example.com");
 */
export class DuplicateKeyError extends AppError {
  constructor(message, field, value = null) {
    super(409, message, "DUPLICATE_KEY");
    this.field = field; // Field that violates unique constraint
    this.value = value; // Value that already exists
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      ...(this.value && { value: this.value }),
    };
  }
}

// Export all error types
export default {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
  UnprocessableEntityError,
  InternalServerError,
  ServiceUnavailableError,
  TooManyRequestsError,
  CastError,
  DuplicateKeyError,
};
