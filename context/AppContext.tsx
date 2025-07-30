
import { ChatMessage, DiagnosisResult, RepairStep } from '@/types';
import React, { createContext, ReactNode, useContext, useState } from 'react';

// Define the shape of the context state
interface AppState {
  userIssueDescription: string | null;
  setUserIssueDescription: (desc: string | null) => void;
  userIssueImageBase64: string | null;
  setUserIssueImageBase64: (img: string | null) => void;
  diagnosisResult: DiagnosisResult | null;
  setDiagnosisResult: (result: DiagnosisResult | null) => void;
  repairSteps: RepairStep[] | null;
  setRepairSteps: (steps: RepairStep[] | null) => void;
  isModalChatOpen: boolean;
  setIsModalChatOpen: (isOpen: boolean) => void;
  currentStepForChat: RepairStep | null;
  setCurrentStepForChat: (step: RepairStep | null) => void;
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  freeMessagesRemaining: number;
  decrementFreeMessages: () => boolean;
  diagnosisAttempts: number;
  setDiagnosisAttempts: (attempts: number) => void;
  resetAppState: () => void;
}

// Create the context
const AppContext = createContext<AppState | undefined>(undefined);

// Create a provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userIssueDescription, setUserIssueDescription] = useState<string | null>(null);
  const [userIssueImageBase64, setUserIssueImageBase64] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [repairSteps, setRepairSteps] = useState<RepairStep[] | null>(null);
  const [isModalChatOpen, setIsModalChatOpen] = useState(false);
  const [currentStepForChat, setCurrentStepForChat] = useState<RepairStep | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [error, setError] = useState<string | null>(null);
  const [freeMessagesRemaining, setFreeMessagesRemaining] = useState(3);
  const [diagnosisAttempts, setDiagnosisAttempts] = useState(0);

  const decrementFreeMessages = () => {
    if (freeMessagesRemaining <= 0) {
      // In a real app, navigate to paywall
      return false;
    }
    setFreeMessagesRemaining(prev => prev - 1);
    return true;
  };

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  const resetAppState = () => {
    setUserIssueDescription(null);
    setUserIssueImageBase64(null);
    setDiagnosisResult(null);
    setRepairSteps(null);
    setIsModalChatOpen(false);
    setCurrentStepForChat(null);
    setChatMessages([]);
    setIsLoading(false);
    setDiagnosisAttempts(0);
  };

  const value = {
    userIssueDescription, setUserIssueDescription,
    userIssueImageBase64, setUserIssueImageBase64,
    diagnosisResult, setDiagnosisResult,
    repairSteps, setRepairSteps,
    isModalChatOpen, setIsModalChatOpen,
    currentStepForChat, setCurrentStepForChat,
    chatMessages, setChatMessages, addChatMessage,
    isLoading, setIsLoading,
    loadingMessage, setLoadingMessage,
    error, setError,
    freeMessagesRemaining, decrementFreeMessages,
    diagnosisAttempts, setDiagnosisAttempts,
    resetAppState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Create a custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
