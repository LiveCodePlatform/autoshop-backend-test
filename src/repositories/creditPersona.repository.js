/**
 * Credit Persona Repository
 * Data access layer for CreditPerson model
 * No business logic - only database queries
 */

import CreditPerson from "../models/creditPersona.model.js";

export class CreditPersonaRepository {
  async create(data) {
    return await CreditPerson.create(data);
  }

  async findById(id) {
    return await CreditPerson.findById(id);
  }

  async findOne(query) {
    return await CreditPerson.findOne(query);
  }

  async find(query, options = {}) {
    const { sort, skip, limit } = options;
    let queryBuilder = CreditPerson.find(query);

    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }

  async countDocuments(query) {
    return await CreditPerson.countDocuments(query);
  }

  async findByIdAndUpdate(id, updateData, options) {
    return await CreditPerson.findByIdAndUpdate(id, updateData, options);
  }

  async findByIdAndDelete(id) {
    return await CreditPerson.findByIdAndDelete(id);
  }
}

export default CreditPersonaRepository;
