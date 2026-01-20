/**
 * Authentication & Authorization Types
 * Role definitions and constants for RBAC
 */

/**
 * User Roles Enum
 * Defines all available roles in the system
 */
export const USER_ROLES = {
  OWNER: "owner",
  CASHIER: "cashier",
  KITCHEN: "kitchen",
  BAR_COUNTER: "bar-counter",
  KTV_WAITER: "ktv-waiter",
  RESTAURANT_WAITER: "restaurant-waiter",
};

/**
 * Allowed Roles Array
 * Roles that are allowed to authenticate and use the system
 */
export const ALLOWED_ROLES = [
  USER_ROLES.OWNER,
  USER_ROLES.CASHIER,
  USER_ROLES.KITCHEN,
  USER_ROLES.BAR_COUNTER,
  USER_ROLES.KTV_WAITER,
  USER_ROLES.RESTAURANT_WAITER,
];

/**
 * Helper Functions
 */
export const isValidRole = (role) => Object.values(USER_ROLES).includes(role);
export const isAllowedRole = (role) => ALLOWED_ROLES.includes(role);

/**
 * Role Permissions (for future use)
 * Define what each role can do
 */
export const ROLE_PERMISSIONS = {
  [USER_ROLES.OWNER]: [
    "read:all",
    "write:all",
    "delete:all",
    "manage:users",
    "manage:settings",
  ],
  [USER_ROLES.CASHIER]: [
    "read:inventory",
    "read:orders",
    "write:orders",
    "read:transactions",
  ],
  [USER_ROLES.KITCHEN]: ["read:orders", "update:order-status"],
  [USER_ROLES.BAR_COUNTER]: ["read:orders", "update:order-status"],
  [USER_ROLES.KTV_WAITER]: ["read:orders", "update:order-status"],
  [USER_ROLES.RESTAURANT_WAITER]: ["read:orders", "update:order-status"],
};

export default {
  USER_ROLES,
  ALLOWED_ROLES,
  ROLE_PERMISSIONS,
  isValidRole,
  isAllowedRole,
};
