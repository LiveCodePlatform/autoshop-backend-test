/**
 * Credit Record Repository
 * Data access layer for CreditRecord model
 * No business logic - only database queries
 */

import CreditRecord from "../models/creditRecord.model.js";

export class CreditRecordRepository {
  async create(data, options = {}) {
    const { session } = options;
    if (session) {
      return await CreditRecord.create([data], { session }).then(
        (records) => records[0]
      );
    }
    return await CreditRecord.create(data);
  }

  async findById(id, options = {}) {
    const { session, populate } = options;
    let query = CreditRecord.findById(id);
    
    if (session) {
      query = query.session(session);
    }
    
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((pop) => {
          if (typeof pop === "string") {
            query = query.populate(pop);
          } else {
            query = query.populate(pop.path, pop.select);
          }
        });
      } else if (typeof populate === "string") {
        query = query.populate(populate);
      } else {
        query = query.populate(populate.path, populate.select);
      }
    }
    
    return await query.exec();
  }

  async findOne(query, options = {}) {
    const { session, populate } = options;
    let queryBuilder = CreditRecord.findOne(query);
    
    if (session) {
      queryBuilder = queryBuilder.session(session);
    }
    
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((pop) => {
          if (typeof pop === "string") {
            queryBuilder = queryBuilder.populate(pop);
          } else {
            queryBuilder = queryBuilder.populate(pop.path, pop.select);
          }
        });
      } else if (typeof populate === "string") {
        queryBuilder = queryBuilder.populate(populate);
      } else {
        queryBuilder = queryBuilder.populate(populate.path, populate.select);
      }
    }
    
    return await queryBuilder.exec();
  }

  async find(query, options = {}) {
    const { sort, skip, limit, session, populate } = options;
    let queryBuilder = CreditRecord.find(query);

    if (session) {
      queryBuilder = queryBuilder.session(session);
    }

    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((pop) => {
          if (typeof pop === "string") {
            queryBuilder = queryBuilder.populate(pop);
          } else {
            queryBuilder = queryBuilder.populate(pop.path, pop.select);
          }
        });
      } else if (typeof populate === "string") {
        queryBuilder = queryBuilder.populate(populate);
      } else {
        queryBuilder = queryBuilder.populate(populate.path, populate.select);
      }
    }

    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }

  async countDocuments(query, options = {}) {
    const { session } = options;
    if (session) {
      return await CreditRecord.countDocuments(query).session(session).exec();
    }
    return await CreditRecord.countDocuments(query);
  }

  async findByIdAndUpdate(id, updateData, options) {
    return await CreditRecord.findByIdAndUpdate(id, updateData, options);
  }

  async findByIdAndDelete(id) {
    return await CreditRecord.findByIdAndDelete(id);
  }
}

export default CreditRecordRepository;
