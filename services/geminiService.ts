
import { parseJsonFromString, SYSTEM_INSTRUCTION_CHAT, SYSTEM_INSTRUCTION_DIAGNOSIS, SYSTEM_INSTRUCTION_STEPS, SYSTEM_INSTRUCTION_VALIDATION } from '@/constants';
import { ChatMessage, DiagnosisResult, RepairStep } from '@/types';

const FUNCTION_URL = 'https://generatediagnosis-knjglhjsmq-uc.a.run.app';

export const geminiService = {
  validateIsRepairQuery: async (userText: string): Promise<{ isRepairQuery: boolean }> => {
    if (!userText.trim()) {
        return { isRepairQuery: false };
    }
    try {
        const res = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userText, systemInstruction: SYSTEM_INSTRUCTION_VALIDATION })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
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
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText ?? '', imageBase64, systemInstruction: SYSTEM_INSTRUCTION_DIAGNOSIS })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
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
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Based on the diagnosis: "${diagnosisText}", provide repair steps.`, systemInstruction: SYSTEM_INSTRUCTION_STEPS })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
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
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction: SYSTEM_INSTRUCTION_CHAT })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return String(data.result ?? '').trim();
    } catch (error) {
      console.error("Error getting chat response:", error);
      throw error;
    }
  },
};
