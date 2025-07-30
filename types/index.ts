
export enum Screen {
  Login,
  Welcome,
  // TextInput is now merged into the Welcome screen
  Diagnosis,
  StepByStep,
  Settings,
  Paywall,
  Error,
}

export interface DiagnosisResult {
  text: string;
  confidence?: 'High' | 'Medium' | 'Low';
}

export interface RepairStep {
  id: string;
  title: string;
  description: string;
}

export interface ChatMessage {
  id:string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

// For potential future use with context, not strictly needed with prop drilling for this size
export interface AppStateContextType {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  userIssueDescription: string | null;
  setUserIssueDescription: (description: string | null) => void;
  userIssueImageBase64: string | null;
  setUserIssueImageBase64: (base64: string | null) => void;
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
  setFreeMessagesRemaining: (count: number) => void;
  decrementFreeMessages: () => boolean; // Returns true if successful, false if paywall needed
  diagnosisAttempts: number;
  setDiagnosisAttempts: (attempts: number) => void;
  resetAppState: () => void;
  handleBackNavigation: () => void;

  // New state for auth and onboarding
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  hasAcceptedTerms: boolean;
  setHasAcceptedTerms: (accepted: boolean) => void;
  hasSeenInstructions: boolean;
  setHasSeenInstructions: (seen: boolean) => void;
  handleLogout: () => void;
}
