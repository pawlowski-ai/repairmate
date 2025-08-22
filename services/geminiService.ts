
import { parseJsonFromString, SYSTEM_INSTRUCTION_CHAT, SYSTEM_INSTRUCTION_DIAGNOSIS, SYSTEM_INSTRUCTION_STEPS, SYSTEM_INSTRUCTION_VALIDATION } from '@/constants';
import { ChatMessage, DiagnosisResult, RepairStep } from '@/types';
import { callGeminiBackend } from '@/services/api';

export const geminiService = {
  validateIsRepairQuery: async (userText: string): Promise<{ isRepairQuery: boolean }> => {
    if (!userText.trim()) {
        return { isRepairQuery: false };
    }
    try {
        const data = await callGeminiBackend({ prompt: userText, systemInstruction: SYSTEM_INSTRUCTION_VALIDATION });
        const resultJson = parseJsonFromString<{ is_repair_query: boolean }>(data.result);
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
    if (!userText && !imageBase64) {
      throw new Error("No input provided for diagnosis.");
    }

    try {
      const data = await callGeminiBackend({ prompt: userText ?? '', imageBase64, systemInstruction: SYSTEM_INSTRUCTION_DIAGNOSIS });
      return { text: String(data.result ?? '').trim() };
    } catch (error) {
      console.error("Error diagnosing issue:", error);
      throw error; // Re-throw to be handled by the caller
    }
  },

  getRepairSteps: async (
    diagnosisText: string
  ): Promise<RepairStep[]> => {
    try {
      const data = await callGeminiBackend({ prompt: `Based on the diagnosis: "${diagnosisText}", provide repair steps.`, systemInstruction: SYSTEM_INSTRUCTION_STEPS });
      const parsedSteps = parseJsonFromString<RepairStep[]>(data.result);
      if (!parsedSteps || !Array.isArray(parsedSteps) || parsedSteps.some(s => !s.id || !s.title || !s.description)) {
        console.error("Failed to parse repair steps or steps are malformed:", parsedSteps, "Raw text:", data.result);
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
      const data = await callGeminiBackend({ prompt, systemInstruction: SYSTEM_INSTRUCTION_CHAT });
      return String(data.result ?? '').trim();
    } catch (error) {
      console.error("Error getting chat response:", error);
      throw error;
    }
  },
};
