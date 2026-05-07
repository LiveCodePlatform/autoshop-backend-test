import { VertexAI } from "@google-cloud/vertexai";
import path from "path";
import fs from "fs";

/**
 * Gemini Service
 * Handles interaction with Google Cloud Vertex AI Gemini models.
 */

// 1. Application Default Credentials (ADC) Logic
// Support both environment variable (for Vercel) and local file (for development)
if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  // For Vercel deployment: Use base64-encoded service account key from environment variable
  try {
    const serviceAccountKey = Buffer.from(
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      "base64",
    ).toString("utf-8");

    // Write to a temporary file that Google Cloud SDK can read
    const tempKeyPath = path.resolve(
      process.cwd(),
      ".temp-service-account-key.json",
    );
    fs.writeFileSync(tempKeyPath, serviceAccountKey);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempKeyPath;
  } catch (error) {
    console.error(
      "Failed to decode GOOGLE_SERVICE_ACCOUNT_KEY:",
      error.message,
    );
  }
} else if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // For local development: Use local service account JSON key file
  const keyPath = path.resolve(process.cwd(), "service-account-key.json");
  if (fs.existsSync(keyPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
  } else {
    console.warn(
      "Warning: service-account-key.json not found and GOOGLE_SERVICE_ACCOUNT_KEY not set",
    );
  }
}

// 2. Initialize Vertex AI
// Load configuration from environment variables
const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT || "project-5bc4d3cc-d5ba-4f3a-a30";
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

// 3. Instantiate the Model
// Using gemini-2.5-flash as requested (Note: ensure this model is available in your region)
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
 *        Format: [{ role: 'user', parts: [{ text: '...' }] }, { role: 'model', parts: [{ text: '...' }] }]
 * @returns {Promise<string>} The AI's text response.
 */
export async function getAIResponse(userMessage, chatHistory = []) {
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
}
