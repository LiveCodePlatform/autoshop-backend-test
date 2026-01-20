/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches authenticated user to request
 * Uses error types from errors/errorTypes.js
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { UnauthorizedError } from "../errors/errorTypes.js";
import { ALLOWED_ROLES } from "../types/auth.types.js";
import jwt from "jsonwebtoken";
import util from "util";
import Admin from "../models/admin.model.js";

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header and attaches user to req.user
 * 
 * @example
 * router.get('/protected-route', protect, controllerMethod);
 */
export const protect = asyncErrorHandler(async (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    throw new UnauthorizedError("You are not logged in! Authentication required");
  }

  // Verify JWT token
  const verifyAsync = util.promisify(jwt.verify);
  let decodedToken;

  try {
    decodedToken = await verifyAsync(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError("Token has expired. Please login again.");
    } else if (error.name === "JsonWebTokenError") {
      throw new UnauthorizedError("Invalid token. Please login again.");
    }
    throw new UnauthorizedError("Authentication failed. Please login again.");
  }

  const { id, role } = decodedToken || {};

  // Validate that decoded token has required fields
  if (!id || !role) {
    throw new UnauthorizedError("Invalid token. Missing user information.");
  }

  // Find user only if role is in allowed roles
  let user = null;
  if (ALLOWED_ROLES.includes(role)) {
    user = await Admin.findById(id);
  }

  if (!user) {
    throw new UnauthorizedError("The account does not exist or is not authorized");
  }

  // Attach user to request object for downstream middlewares/controllers
  req.user = user;
  next();
});

export default protect;
