/**
 * Credit Persona Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 */

import { asyncErrorHandler } from "../shared/utils/asyncErrorHandler.js";
import { getCreditPersonaService } from "../loaders/services.loader.js";

class CreditPersonaController {
  /**
   * @param {CreditPersonaService} service - Injected service instance
   */
  constructor(service) {
    this.service = service || getCreditPersonaService();
  }

  /**
   * Create new credit person
   * POST /api/credit-persons
   */
  createCreditPerson = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.createCreditPerson(req.body);

    res.status(201).json({
      success: true,
      message: "Credit person created successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Get all credit persons with pagination and filters
   * GET /api/credit-persons
   */
  getAllCreditPersons = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.getAllCreditPersons(req.query);
    const response = result;

    res.status(200).json({
      ...response,
      message: "Credit persons retrieved successfully",
    });
  });

  /**
   * Get credit person by ID
   * GET /api/credit-persons/:id
   */
  getCreditPersonById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.getCreditPersonById(id);

    res.status(200).json({
      success: true,
      message: "Credit person retrieved successfully",
      data: result.toJSON(),
    });
  });

  /**
   * Update credit person
   * PATCH /api/credit-persons/:id
   */
  updateCreditPerson = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.updateCreditPerson(id, req.body);

    res.status(200).json({
      success: true,
      message: "Credit person updated successfully",
      data: result.toJSON(),
    });
  });
}

// Export instance
const creditPersonaController = new CreditPersonaController();
export const {
  createCreditPerson,
  getAllCreditPersons,
  getCreditPersonById,
  updateCreditPerson,
} = creditPersonaController;

export default creditPersonaController;
