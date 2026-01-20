/**
 * Location Profile Repository
 * Data access layer for LocationProfile model
 * No business logic - only database queries
 */

import LocationProfile from "../models/locationProfile.model.js";

export class LocationProfileRepository {
  async create(data) {
    return await LocationProfile.create(data);
  }

  async findById(id) {
    return await LocationProfile.findById(id);
  }

  async findOne(query) {
    return await LocationProfile.findOne(query);
  }

  async find(query, options = {}) {
    const { sort, skip, limit } = options;
    let queryBuilder = LocationProfile.find(query);

    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }

  async countDocuments(query) {
    return await LocationProfile.countDocuments(query);
  }

  async findByIdAndUpdate(id, updateData, options) {
    return await LocationProfile.findByIdAndUpdate(id, updateData, options);
  }
}

export default LocationProfileRepository;
