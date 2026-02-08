
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
