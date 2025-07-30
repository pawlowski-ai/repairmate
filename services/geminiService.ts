
import {
  GEMINI_TEXT_MODEL,
  SYSTEM_INSTRUCTION_CHAT,
  SYSTEM_INSTRUCTION_DIAGNOSIS,
  SYSTEM_INSTRUCTION_STEPS,
  SYSTEM_INSTRUCTION_VALIDATION,
  parseJsonFromString
} from '@/constants';
import { ChatMessage, DiagnosisResult, RepairStep } from '@/types';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, Part } from "@google/generative-ai";

const API_KEY = "AIzaSyDmH1p8FbJKWjvpTY9KZZtJwvM01osn_HU";

const genAI = new GoogleGenerativeAI(API_KEY);

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export const geminiService = {
  validateIsRepairQuery: async (userText: string): Promise<{ isRepairQuery: boolean }> => {
    if (!userText.trim()) {
        return { isRepairQuery: false };
    }
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_TEXT_MODEL, systemInstruction: SYSTEM_INSTRUCTION_VALIDATION });
        const result = await model.generateContent(userText);
        const response = result.response;
        const resultJson = parseJsonFromString<{ is_repair_query: boolean }>(response.text());
        return { isRepairQuery: resultJson?.is_repair_query ?? false };
    } catch (error) {
        console.error("Error validating query:", error);
        return { isRepairQuery: false }; // Fail safely, assuming it's not a valid query
    }
  },

  diagnoseIssue: async (
    userText: string | null,
    imageBase64: string | null
  ): Promise<DiagnosisResult> => {
    const parts: Part[] = [];
    if (userText) {
      parts.push({ text: userText });
    }
    if (imageBase64) {
      const [meta, data] = imageBase64.split(',');
      if (!meta || !data) throw new Error("Invalid imageBase64 format");
      const mimeType = meta.match(/:(.*?);/)?.[1];
      if (!mimeType) throw new Error("Could not extract mimeType from imageBase64");
      parts.push({ inlineData: { mimeType, data } });
    }

    if (parts.length === 0) {
      throw new Error("No input provided for diagnosis.");
    }

    try {
      const model = genAI.getGenerativeModel({ model: GEMINI_TEXT_MODEL, systemInstruction: SYSTEM_INSTRUCTION_DIAGNOSIS, safetySettings });
      const result = await model.generateContent(parts);
      const response = result.response;
      return { text: response.text().trim() };
    } catch (error) {
      console.error("Error diagnosing issue:", error);
      throw error; // Re-throw to be handled by the caller
    }
  },

  getRepairSteps: async (
    diagnosisText: string
  ): Promise<RepairStep[]> => {
    try {
      const model = genAI.getGenerativeModel({ model: GEMINI_TEXT_MODEL, systemInstruction: SYSTEM_INSTRUCTION_STEPS, safetySettings });
      const result = await model.generateContent(`Based on the diagnosis: "${diagnosisText}", provide repair steps.`);
      const response = result.response;
      const parsedSteps = parseJsonFromString<RepairStep[]>(response.text());
      if (!parsedSteps || !Array.isArray(parsedSteps) || parsedSteps.some(s => !s.id || !s.title || !s.description)) {
        console.error("Failed to parse repair steps or steps are malformed:", parsedSteps, "Raw text:", response.text());
        return [{id: "fallback", title: "Unable to Generate Steps", description: "I couldn't generate detailed steps right now. Please try rephrasing the issue or consult the diagnosis for general guidance."}];
      }
      return parsedSteps;
    } catch (error) {
      console.error("Error getting repair steps:", error);
      throw error;
    }
  },

  getChatResponse: async (
    userQuestion: string,
    stepContext: RepairStep,
    chatHistory: ChatMessage[] // For potential future context
  ): Promise<string> => {
    const prompt = `The user is working on the repair step titled "${stepContext.title}" with description "${stepContext.description}". They asked the following question: "${userQuestion}". Please provide a helpful and concise answer.`;
    
    try {
      const model = genAI.getGenerativeModel({ model: GEMINI_TEXT_MODEL, systemInstruction: SYSTEM_INSTRUCTION_CHAT, safetySettings });
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text().trim();
    } catch (error) {
      console.error("Error getting chat response:", error);
      throw error;
    }
  },
};
