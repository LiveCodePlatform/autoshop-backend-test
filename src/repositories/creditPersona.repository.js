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

  /**
   * Find credit person by ID
   * @param {string} id - Credit person ID
   * @param {Object} options - Options including session for transactions
   * @returns {Promise<Object|null>} Credit person document or null
   */
  async findById(id, options = {}) {
    const { session, populate } = options;
    let query = CreditPerson.findById(id);

    if (session) {
      query = query.session(session);
    }

    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((pop) => {
          query = query.populate(pop.path, pop.select);
        });
      } else {
        query = query.populate(populate.path, populate.select);
      }
    }

    return await query.exec();
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
