import { VertexAI } from "@google-cloud/vertexai";
import path from "path";

// 1. Application Default Credentials (ADC) Logic
// Programmatically set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// to the local service account JSON key file before initializing Vertex AI.
const keyPath = path.resolve(process.cwd(), "service-account-key.json");
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
}

// 2. Initialize Vertex AI
// Ensure you have these environment variables set in your .env file
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION;

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

// 3. Instantiate the Model
// Using gemini-2.5-flash as requested
const generativeModel = vertexAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 0.7,
    topP: 0.95,
  },
});

/**
 * Gets a response from Gemini 2.5 Flash while maintaining chat history.
 *
 * @param {string} userMessage - The new message from the user.
 * @param {Array<{role: string, parts: Array<{text: string}>}>} chatHistory - Previous chat history.
 *        Example format: [{ role: 'user', parts: [{ text: 'hi' }] }, { role: 'model', parts: [{ text: 'hello' }] }]
 * @returns {Promise<string>} The AI's text response.
 */
export const getAIResponse = async (userMessage, chatHistory = []) => {
  try {
    // startChat initializes a session that will "remember" the provided history
    const chat = generativeModel.startChat({
      history: chatHistory,
    });

    // Send the user's message to the session
    const result = await chat.sendMessage(userMessage);

    // Safely extract the text from the response
    const responseText =
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("No valid response received from Vertex AI");
    }

    return responseText;
  } catch (error) {
    console.error("Error in getAIResponse:", error.message);
    throw error;
  }
};
