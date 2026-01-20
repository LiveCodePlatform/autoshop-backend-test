/**
 * Credit Persona Routes
 * API endpoint definitions for credit persona operations
 */

import { Router } from "express";
import {
  createCreditPerson,
  getAllCreditPersons,
  getCreditPersonById,
  updateCreditPerson,
} from "../controllers/creditPersona.controller.js";
import {
  validateCreateCreditPersona,
  validateUpdateCreditPersona,
} from "../validators/creditPersona.validator.js";

const router = Router();

/**
 * @route   GET /api/v2/credit-persona
 * @desc    Get all credit persons with pagination and filters
 * @access  Public (add protect middleware if needed)
 */
router.get("/credit-persona", getAllCreditPersons);

/**
 * @route   GET /api/v2/credit-persona/:id
 * @desc    Get credit person by ID
 * @access  Public (add protect middleware if needed)
 */
router.get("/credit-persona/:id", getCreditPersonById);

/**
 * @route   POST /api/v2/credit-persona
 * @desc    Create new credit person
 * @access  Public (add protect middleware if needed)
 */
router.post(
  "/credit-persona",
  validateCreateCreditPersona,
  createCreditPerson
);

/**
 * @route   PATCH /api/v2/credit-persona/:id
 * @desc    Update credit person
 * @access  Public (add protect middleware if needed)
 */
router.patch(
  "/credit-persona/:id",
  validateUpdateCreditPersona,
  updateCreditPerson
);

export default router;
