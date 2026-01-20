/**
 * JWT Token Utilities
 * Pure utility functions for JWT token generation and verification
 * Located in shared/utils as these are reusable across the application
 */

import jwt from "jsonwebtoken";

/**
 * Sign JWT token with user information
 * @param {string} id - User ID
 * @param {string} role - User role
 * @param {string|null} locationId - Location ID (optional)
 * @returns {string} JWT token
 */
export const signToken = (id, role, locationId = null) => {
  // Build token payload - only include locationId if it exists
  const payload = { id, role };

  // Only add locationId to payload if it's provided and not null/undefined
  if (locationId) {
    payload.locationId = locationId;
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/**
 * Sign password change token
 * @param {string} userId - User ID
 * @returns {string} JWT token for password change
 */
export const signPasswordChangeToken = (userId) => {
  const expiresIn = process.env.PASSWORD_CHANGE_TOKEN_EXPIRES_IN || "10m";
  return jwt.sign(
    { id: userId, purpose: "password_change" },
    process.env.JWT_SECRET,
    {
      expiresIn,
    }
  );
};

/**
 * Verify password change token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or purpose doesn't match
 */
export const verifyPasswordChangeToken = (token) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (payload.purpose !== "password_change") {
    const err = new Error("Invalid token purpose");
    err.name = "JsonWebTokenError";
    throw err;
  }
  return payload; // { id, purpose, iat, exp }
};

export default {
  signToken,
  signPasswordChangeToken,
  verifyPasswordChangeToken,
};
