
import { parseJsonFromString, SYSTEM_INSTRUCTION_CHAT, SYSTEM_INSTRUCTION_DIAGNOSIS, SYSTEM_INSTRUCTION_STEPS, SYSTEM_INSTRUCTION_VALIDATION } from '@/constants';
import { callGeminiBackend } from '@/services/api';
import { ChatMessage, DiagnosisResult, RepairStep } from '@/types';

type CallOptions = { interactionId?: string };

export const geminiService = {
  validateIsRepairQuery: async (userText: string, opts?: CallOptions): Promise<{ isRepairQuery: boolean }> => {
    if (!userText.trim()) {
        return { isRepairQuery: false };
    }
    try {
        const interactionId = opts?.interactionId ?? `${Date.now()}-validate-${Math.random().toString(36).slice(2)}`;
        const data = await callGeminiBackend({ prompt: userText, systemInstruction: SYSTEM_INSTRUCTION_VALIDATION, interactionId });
        const resultJson = parseJsonFromString<{ is_repair_query: boolean }>(data.result);
        return { isRepairQuery: resultJson?.is_repair_query ?? false };
    } catch (error: any) {
        // Jeśli to limit/401 – przekaż wyżej, aby wrapper zajął się nawigacją (paywall/signin)
        const msg = String(error?.message || '');
        if (error?.code === 'LIMIT' || msg.includes('402') || msg.includes('LIMIT')) {
          throw error;
        }
        if (msg.includes('401') || msg.toLowerCase().includes('auth')) {
          throw error;
        }
        if (__DEV__) {
          console.error("Error validating query:", error);
        }
        return { isRepairQuery: false };
    }
  },

  diagnoseIssue: async (
    userText: string | null,
    imageBase64: string | null,
    opts?: CallOptions
  ): Promise<DiagnosisResult> => {
    if (!userText && !imageBase64) {
      throw new Error("No input provided for diagnosis.");
    }

    try {
      const interactionId = opts?.interactionId ?? `${Date.now()}-diagnosis-${Math.random().toString(36).slice(2)}`;
      const data = await callGeminiBackend({ prompt: userText ?? '', imageBase64, systemInstruction: SYSTEM_INSTRUCTION_DIAGNOSIS, interactionId });
      return { text: String(data.result ?? '').trim() };
    } catch (error) {
      if (__DEV__) {
        console.error("Error diagnosing issue:", error);
      }
      throw error; // Re-throw to be handled by the caller
    }
  },

  // Request an alternative diagnosis explicitly different from a previous suggestion
  diagnoseAlternativeIssue: async (
    userText: string | null,
    imageBase64: string | null,
    previousDiagnosisText?: string,
    opts?: CallOptions
  ): Promise<DiagnosisResult> => {
    if (!userText && !imageBase64) {
      throw new Error("No input provided for diagnosis.");
    }

    try {
      const interactionId = opts?.interactionId ?? `${Date.now()}-diagnosis-alt-${Math.random().toString(36).slice(2)}`;
      const altHint = previousDiagnosisText
        ? `\n\nIMPORTANT: Provide a different plausible alternative diagnosis than: "${previousDiagnosisText}". Do not repeat that cause.`
        : `\n\nIMPORTANT: Provide a different plausible alternative diagnosis than your first guess.`;
      const data = await callGeminiBackend({
        prompt: `${userText ?? ''}${altHint}`,
        imageBase64,
        systemInstruction: SYSTEM_INSTRUCTION_DIAGNOSIS,
        interactionId,
      });
      return { text: String(data.result ?? '').trim() };
    } catch (error) {
      if (__DEV__) {
        console.error("Error getting alternative diagnosis:", error);
      }
      throw error;
    }
  },

  getRepairSteps: async (
    diagnosisText: string,
    opts?: CallOptions
  ): Promise<RepairStep[]> => {
    try {
      const interactionId = opts?.interactionId ?? `${Date.now()}-steps-${Math.random().toString(36).slice(2)}`;
      const data = await callGeminiBackend({ prompt: `Based on the diagnosis: "${diagnosisText}", provide repair steps.`, systemInstruction: SYSTEM_INSTRUCTION_STEPS, interactionId });
      const parsedSteps = parseJsonFromString<RepairStep[]>(data.result);
      if (!parsedSteps || !Array.isArray(parsedSteps) || parsedSteps.some(s => !s.id || !s.title || !s.description)) {
        if (__DEV__) {
          console.error("Failed to parse repair steps or steps are malformed:", parsedSteps, "Raw text:", data.result);
        }
        return [{id: "fallback", title: "Unable to Generate Steps", description: "I couldn't generate detailed steps right now. Please try rephrasing the issue or consult the diagnosis for general guidance."}];
      }
      return parsedSteps;
    } catch (error) {
      if (__DEV__) {
        console.error("Error getting repair steps:", error);
      }
      throw error;
    }
  },

  getChatResponse: async (
    userQuestion: string,
    stepContext: RepairStep,
    chatHistory: ChatMessage[], // For potential future context
    opts?: CallOptions
  ): Promise<string> => {
    const prompt = `The user is working on the repair step titled "${stepContext.title}" with description "${stepContext.description}". They asked the following question: "${userQuestion}". Please provide a helpful and concise answer.`;
    
    try {
      const interactionId = opts?.interactionId ?? `${Date.now()}-chat-${Math.random().toString(36).slice(2)}`;
      const data = await callGeminiBackend({ prompt, systemInstruction: SYSTEM_INSTRUCTION_CHAT, interactionId });
      return String(data.result ?? '').trim();
    } catch (error) {
      if (__DEV__) {
        console.error("Error getting chat response:", error);
      }
      throw error;
    }
  },
};
