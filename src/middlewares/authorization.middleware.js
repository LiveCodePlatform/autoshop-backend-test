/**
 * Authorization Middleware (RBAC - Role-Based Access Control)
 * Checks if authenticated user has required role(s) to access a resource
 * Must be used after protect middleware
 * Uses error types from errors/errorTypes.js
 */

import { UnauthorizedError, ForbiddenError } from "../errors/errorTypes.js";

/**
 * Role-Based Access Control Middleware
 * Checks if user has one of the allowed roles
 * 
 * @param {...string} allowedRoles - Roles that are allowed to access the resource
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Single role
 * router.post('/admin-only', protect, permissionGranted('owner'), controllerMethod);
 * 
 * @example
 * // Multiple roles
 * router.get('/staff', protect, permissionGranted('owner', 'cashier'), controllerMethod);
 */
export const permissionGranted = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by protect middleware)
    if (!req.user) {
      return next(
        new UnauthorizedError("Authentication required. Please login first.")
      );
    }

    const role = req.user?.role;

    // Check if role exists
    if (!role) {
      return next(
        new UnauthorizedError("Unauthorized. No role information available.")
      );
    }

    // Check if user's role is in the allowed roles list
    if (!allowedRoles.includes(role)) {
      return next(
        new ForbiddenError(
          `Access denied. Role '${role}' is not authorized to access this resource. Required roles: ${allowedRoles.join(", ")}`
        )
      );
    }

    // User has required role, proceed to next middleware/controller
    next();
  };
};

/**
 * Convenience middleware for owner-only routes
 * @example
 * router.delete('/sensitive', protect, ownerOnly, controllerMethod);
 */
export const ownerOnly = permissionGranted("owner");

/**
 * Convenience middleware for owner and cashier roles
 * @example
 * router.post('/transactions', protect, ownerOrCashier, controllerMethod);
 */
export const ownerOrCashier = permissionGranted("owner", "cashier");

/**
 * Convenience middleware for all staff roles (excluding owner)
 * @example
 * router.get('/staff-dashboard', protect, staffOnly, controllerMethod);
 */
export const staffOnly = permissionGranted(
  "cashier",
  "kitchen",
  "bar-counter",
  "ktv-waiter",
  "restaurant-waiter"
);

export default {
  permissionGranted,
  ownerOnly,
  ownerOrCashier,
  staffOnly,
};
