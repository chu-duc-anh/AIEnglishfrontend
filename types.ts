export interface User {
  id: string; // MongoDB _id
  username: string;
  isAdmin: boolean;
  fullName: string;
  email: string;
  dob: string; // Stored as 'YYYY-MM-DD'
  gender: 'male' | 'female';
  createdAt: string; // ISO date string from timestamps
}

export interface PronunciationFeedback {
  highlightedText: React.ReactNode;
  accuracy: number;
}

export interface DetailedPronunciationFeedback {
  highlightedText: React.ReactNode;
  accuracyScore: number;
  pronunciationScore: number;
  stressScore: number;
}


// The shape of a message that is safe to store in the database (JSON serializable).
export interface StoredChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  translation?: string;
}

// The shape of a message used in the application's state, which may contain non-serializable data.
export interface ChatMessage extends StoredChatMessage {
  pronunciation?: PronunciationFeedback;
  isLoading?: boolean;
  suggestions?: string[];
  isGeneratingSuggestions?: boolean;
}

export interface Conversation {
  id: string; // MongoDB _id
  userId: string;
  title: string;
  assistantName: string;
  gender: 'male' | 'female';
  scenario: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  messages: ChatMessage[];
}