import express from 'express';
import { testGeminiChat } from '../controllers/gemini.controller.js';

const router = express.Router();

/**
 * @route   POST /api/v1/gemini/chat
 * @desc    Test Gemini AI response
 * @access  Public
 */
router.post('/chat', testGeminiChat);

export default router;
