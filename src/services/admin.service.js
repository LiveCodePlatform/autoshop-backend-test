/**
 * Admin Service
 * Business logic layer for Admin operations
 * Uses repositories for data access and DTOs for data transformation
 */

import { AdminRepository } from "../repositories/admin.repository.js";
import {
  CreateAdminDTO,
  UpdateAdminDTO,
  AdminResponseDTO,
  LoginResponseDTO,
  SignupResponseDTO,
} from "../dtos/admin.dto.js";
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  CastError,
} from "../errors/errorTypes.js";
import { ADMIN_FIELDS } from "../types/admin.types.js";
import { signToken } from "../shared/utils/jwtToken.utils.js";
import mongoose from "mongoose";

export class AdminService {
  /**
   * @param {AdminRepository} repository - Injected repository instance (optional, fallback creates new instance)
   */
  constructor(repository) {
    this.repository = repository || new AdminRepository();
  }

  /**
   * Signup - Create new admin account
   * Matches legacy logic exactly
   * @param {Object} data - Request data (name, password, confirmPassword, role, locationId)
   * @returns {Promise<SignupResponseDTO>} Signup response with admin and token
   * @throws {ValidationError} If validation fails
   */
  async signup(data) {
    const { name, password, confirmPassword, role, locationId } = data;

    // Validate required fields (matches legacy exactly)
    if (!name || !password || !confirmPassword) {
      throw new ValidationError(
        "Missing required fields for signup.",
        "name, password, confirmPassword"
      );
    }

    // Validate password match (matches legacy exactly)
    if (password !== confirmPassword) {
      throw new ValidationError("Passwords do not match.", "confirmPassword");
    }

    // Create admin (matches legacy exactly - no uniqueness check, model handles it)
    const admin = await this.repository.create({
      name,
      password,
      confirmPassword,
      role,
      locationId,
    });

    // Generate JWT token (matches legacy exactly)
    const token = signToken(admin._id, admin.role, admin.locationId);

    // Return signup response DTO (matches legacy response structure)
    return new SignupResponseDTO(admin, token);
  }

  /**
   * Login - Authenticate admin and return token
   * Matches legacy logic exactly
   * @param {Object} data - Request data (name, password)
   * @returns {Promise<LoginResponseDTO>} Login response with admin and token
   * @throws {UnauthorizedError} If credentials are invalid or admin is soft deleted
   */
  async login(data) {
    const { name, password } = data;

    // Validate required fields (matches legacy exactly)
    if (!name || !password) {
      throw new ValidationError(
        "Missing required fields for login.",
        "name, password"
      );
    }

    // Find admin by name with password field selected (matches legacy exactly)
    const admin = await this.repository.findOne(
      { name },
      {
        select: "+password",
      }
    );

    // Business logic: Check if admin exists (matches legacy exactly)
    if (!admin) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Business logic: Check if admin is soft deleted (matches legacy exactly)
    if (admin.softDeleted) {
      throw new UnauthorizedError("You can't login");
    }

    // Business logic: Verify password (matches legacy exactly)
    const isPasswordCorrect = await admin.comparePasswordInDb(
      password,
      admin.password
    );

    if (!isPasswordCorrect) {
      throw new UnauthorizedError("Invalid Credentials");
    }

    // Populate locationId if it exists (matches legacy exactly)
    if (admin.locationId) {
      await admin.populate(
        "locationId",
        "type locationName locationCode locationAddress"
      );
    }

    // Generate JWT token (matches legacy exactly - no lastActiveAt update)
    const token = signToken(admin._id, admin.role, admin.locationId);

    // Return login response DTO (matches legacy response structure)
    return new LoginResponseDTO(admin, token);
  }

  /**
   * Update password
   * Matches legacy logic exactly
   * @param {string} accountId - Admin ID
   * @param {Object} data - Request data (newPassword, confirmPassword)
   * @returns {Promise<Object>} Updated admin info
   * @throws {CastError} If invalid ID format
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If admin not found
   * @throws {UnauthorizedError} If admin is soft deleted
   */
  async updatePassword(accountId, data) {
    const { newPassword, confirmPassword } = data;

    // Validate ID format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      throw new CastError("Invalid user ID format.", "accountId");
    }

    // Validate newPassword (matches legacy exactly)
    if (!newPassword) {
      throw new ValidationError(
        "Please provide a new password.",
        "newPassword"
      );
    }

    // Validate confirmPassword match (matches legacy exactly)
    if (confirmPassword && newPassword !== confirmPassword) {
      throw new ValidationError(
        "New password and confirm password do not match.",
        "confirmPassword"
      );
    }

    // Find admin (matches legacy exactly)
    const admin = await this.repository.findById(accountId);

    if (!admin) {
      throw new NotFoundError("User not found.", accountId);
    }

    // Check if admin is soft deleted (matches legacy exactly)
    if (admin.softDeleted) {
      throw new UnauthorizedError("User is deleted.");
    }

    // Update password and updatedAt (matches legacy exactly)
    admin.password = newPassword;
    admin.updatedAt = Date.now();

    await admin.save({ validateBeforeSave: true });

    // Return response (matches legacy structure)
    return {
      accountId: admin._id,
      name: admin.name,
    };
  }

  /**
   * Soft delete admin
   * Matches legacy logic exactly
   * @param {string} accountId - Admin ID
   * @returns {Promise<Object>} Deleted admin info
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If admin not found
   */
  async userSoftDelete(accountId) {
    // Validate ID format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      throw new CastError("Invalid user ID format.", "accountId");
    }

    // Find admin (matches legacy exactly)
    const admin = await this.repository.findById(accountId);

    if (!admin) {
      throw new NotFoundError("User not found.", accountId);
    }

    // Set softDeleted and deletedAt (matches legacy exactly)
    admin.softDeleted = true;
    admin.deletedAt = Date.now();

    await admin.save({ validateBeforeSave: true });

    // Return response (matches legacy structure)
    return {
      accountId: admin._id,
      name: admin.name,
    };
  }

  /**
   * Restore soft deleted admin
   * Matches legacy logic exactly
   * @param {string} accountId - Admin ID
   * @returns {Promise<Object>} Restored admin info
   * @throws {NotFoundError} If admin not found
   */
  async userRestore(accountId) {
    // Update admin (matches legacy exactly - uses findByIdAndUpdate)
    const admin = await this.repository.findByIdAndUpdate(
      accountId,
      { softDeleted: false },
      { new: true }
    );

    if (!admin) {
      throw new NotFoundError("User not found.", accountId);
    }

    // Return response (matches legacy structure)
    return {
      accountId: admin._id,
      name: admin.name,
    };
  }

  /**
   * Delete admin permanently
   * Matches legacy logic exactly
   * @param {string} accountId - Admin ID
   * @returns {Promise<Object>} Deleted admin info
   * @throws {NotFoundError} If admin not found
   */
  async userDelete(accountId) {
    // Delete admin (matches legacy exactly - uses findByIdAndDelete)
    const admin = await this.repository.findByIdAndDelete(accountId);

    if (!admin) {
      throw new NotFoundError("User not found.", accountId);
    }

    // Return response (matches legacy structure)
    return {
      accountId: admin._id,
      name: admin.name,
    };
  }

  /**
   * Get all accounts
   * Matches legacy logic exactly
   * @returns {Promise<Object>} All admins
   */
  async getAllAccounts() {
    // Find all admins, exclude password, populate locationId (matches legacy exactly)
    const admins = await this.repository.find(
      {},
      {
        select: "-password",
        populate: {
          locationId: "type locationName locationCode locationAddress",
        },
      }
    );

    // Return response (matches legacy structure)
    return {
      accounts: admins,
    };
  }

  /**
   * Get admin by ID
   * Matches legacy logic exactly
   * @param {string} accountId - Admin ID
   * @returns {Promise<Object>} Admin info
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If admin not found
   */
  async getAccountById(accountId) {
    // Validate ID format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      throw new CastError("Invalid user ID format.", "accountId");
    }

    // Find admin and populate locationId (matches legacy exactly)
    const admin = await this.repository.findById(accountId, {
      populate: {
        locationId: "type locationName locationCode locationAddress",
      },
    });

    if (!admin) {
      throw new NotFoundError("User not found.", accountId);
    }

    // Return response (matches legacy structure exactly)
    return {
      accountId: admin._id,
      name: admin.name,
      role: admin.role,
      locationId: admin.locationId,
    };
  }

  /**
   * Get admin by ID (alias for getAccountById with DTO)
   * @param {string} id - Admin ID
   * @returns {Promise<AdminResponseDTO>} Admin DTO
   * @throws {NotFoundError} If admin not found
   */
  async getAdminById(id) {
    const admin = await this.repository.findById(id, {
      populate: {
        locationId: "type locationName locationCode locationAddress",
      },
    });

    if (!admin) {
      throw new NotFoundError("Admin", id);
    }

    return new AdminResponseDTO(admin);
  }

  /**
   * Update admin
   * Matches legacy logic exactly
   * @param {string} accountId - Admin ID
   * @param {Object} data - Update data (name, role, locationId)
   * @returns {Promise<Object>} Updated admin
   * @throws {CastError} If invalid ID format
   * @throws {NotFoundError} If admin not found
   * @throws {UnauthorizedError} If admin is soft deleted
   */
  async updateUser(accountId, data) {
    const { name, role, locationId } = data;

    // Validate ID format (matches legacy exactly)
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      throw new CastError("Invalid user ID format.", "accountId");
    }

    // Build updateFields (matches legacy exactly)
    const updateFields = {};
    if (name !== undefined) {
      updateFields.name = name;
    }
    if (role !== undefined) {
      updateFields.role = role;
    }
    if (locationId !== undefined) {
      updateFields.locationId = locationId;
    }

    // Check softDeleted (matches legacy exactly - though logic seems incorrect in legacy, we match it)
    if (updateFields.softDeleted) {
      throw new UnauthorizedError("User is deleted.");
    }

    // Update admin (matches legacy exactly)
    const updatedUser = await this.repository.findByIdAndUpdate(
      accountId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw new NotFoundError("User not found.", accountId);
    }

    // Populate locationId (matches legacy exactly)
    await updatedUser.populate(
      "locationId",
      "type locationName locationCode locationAddress"
    );

    // Return updated user (matches legacy structure)
    return updatedUser;
  }

  /**
   * Update admin (alias for updateUser with DTO)
   * @param {string} id - Admin ID
   * @param {Object} data - Update data
   * @returns {Promise<AdminResponseDTO>} Updated admin DTO
   * @throws {NotFoundError} If admin not found
   * @throws {ConflictError} If name already exists (when updating name)
   */
  async updateAdmin(id, data) {
    // Check if admin exists
    const existingAdmin = await this.repository.findById(id);
    if (!existingAdmin) {
      throw new NotFoundError("Admin", id);
    }

    // Transform data using DTO
    const dto = new UpdateAdminDTO(data);
    const updateData = dto.toUpdateModel();

    // Business logic: Check uniqueness for name if updating name
    if (updateData[ADMIN_FIELDS.NAME]) {
      const adminWithSameName = await this.repository.findOne({
        name: updateData[ADMIN_FIELDS.NAME],
        _id: { $ne: id }, // Exclude current admin
      });

      if (adminWithSameName) {
        throw new ConflictError(
          "Admin with this name already exists",
          ADMIN_FIELDS.NAME
        );
      }
    }

    // Update admin
    const updatedAdmin = await this.repository.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Populate locationId if it exists
    if (updatedAdmin && updatedAdmin[ADMIN_FIELDS.LOCATION_ID]) {
      await updatedAdmin.populate(
        "locationId",
        "type locationName locationCode locationAddress"
      );
    }

    return new AdminResponseDTO(updatedAdmin);
  }
}

export default AdminService;
