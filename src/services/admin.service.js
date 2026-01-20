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
} from "../errors/errorTypes.js";
import { ADMIN_FIELDS } from "../types/admin.types.js";
import { signToken } from "../shared/utils/jwtToken.utils.js";

export class AdminService {
  /**
   * @param {AdminRepository} repository - Injected repository instance (optional, fallback creates new instance)
   */
  constructor(repository) {
    this.repository = repository || new AdminRepository();
  }

  /**
   * Signup - Create new admin account
   * @param {Object} data - Request data (name, password, confirmPassword, role, locationId)
   * @returns {Promise<SignupResponseDTO>} Signup response with admin and token
   * @throws {ConflictError} If admin name already exists
   * @throws {ValidationError} If validation fails
   */
  async signup(data) {
    // Transform data using DTO
    const dto = new CreateAdminDTO(data);
    const adminData = dto.toModel();

    // Business logic: Check uniqueness for name
    const existingAdmin = await this.repository.findOne({
      name: adminData[ADMIN_FIELDS.NAME],
    });

    if (existingAdmin) {
      throw new ConflictError(
        "Admin with this name already exists",
        ADMIN_FIELDS.NAME
      );
    }

    // Create admin
    const newAdmin = await this.repository.create(adminData);

    // Generate JWT token
    const token = signToken(
      newAdmin._id,
      newAdmin[ADMIN_FIELDS.ROLE],
      newAdmin[ADMIN_FIELDS.LOCATION_ID]
    );

    // Return signup response DTO
    return new SignupResponseDTO(newAdmin, token);
  }

  /**
   * Login - Authenticate admin and return token
   * @param {Object} data - Request data (name, password)
   * @returns {Promise<LoginResponseDTO>} Login response with admin and token
   * @throws {UnauthorizedError} If credentials are invalid or admin is soft deleted
   */
  async login(data) {
    const { name, password } = data;

    // Find admin by name with password field selected
    const admin = await this.repository.findOne(
      { name },
      {
        select: "+password",
      }
    );

    // Business logic: Check if admin exists
    if (!admin) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Business logic: Check if admin is soft deleted
    if (admin.softDeleted) {
      throw new UnauthorizedError("You can't login");
    }

    // Business logic: Verify password
    const isPasswordCorrect = await admin.comparePasswordInDb(
      password,
      admin.password
    );

    if (!isPasswordCorrect) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Populate locationId if it exists
    if (admin[ADMIN_FIELDS.LOCATION_ID]) {
      await admin.populate(
        "locationId",
        "type locationName locationCode locationAddress"
      );
    }

    // Update lastActiveAt
    admin[ADMIN_FIELDS.LAST_ACTIVE_AT] = new Date();
    await admin.save();

    // Generate JWT token
    const token = signToken(
      admin._id,
      admin[ADMIN_FIELDS.ROLE],
      admin[ADMIN_FIELDS.LOCATION_ID]
    );

    // Return login response DTO
    return new LoginResponseDTO(admin, token);
  }

  /**
   * Get admin by ID
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
