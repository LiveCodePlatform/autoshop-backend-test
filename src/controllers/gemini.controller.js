import { getAIResponse } from '../services/gemini.service.js';

/**
 * Controller to handle Gemini chat testing.
 */
export const testGeminiChat = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a "message" in the request body.',
      });
    }

    // Call the Gemini service
    const aiResponse = await getAIResponse(message, history || []);

    return res.status(200).json({
      success: true,
      message: 'AI generated response successfully.',
      data: {
        reply: aiResponse,
      },
    });
  } catch (error) {
    next(error); // Pass the error to the global error handler
  }
};
