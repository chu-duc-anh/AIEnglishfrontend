


import type { StoredChatMessage } from '../types';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_PATH = '/api/ai';

const defaultResponse = {
    response: "I'm sorry, I'm having a little trouble thinking right now. Could you try again?",
    translation: "Xin lỗi, tôi đang gặp chút sự cố. Bạn có thể thử lại không?"
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('No authentication token found. Please log in.');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(`${BACKEND_URL}${API_PATH}${endpoint}`, { ...options, headers, credentials: 'include' });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
            response: `Request failed with status ${response.status}`,
            translation: `Yêu cầu thất bại với mã trạng thái ${response.status}`
        }));
        // Throw an object that matches the expected return type
        throw errorData;
    }
    
    return response.json();
};


export const getAiResponse = async (
    history: { role: 'user' | 'model', parts: { text: string }[] }[], 
    assistantName: string, 
    scenario: string
): Promise<{ response: string; translation: string; }> => {
  try {
    const body = {
        history,
        assistantName,
        scenario
    };
    
    // The backend now handles the AI call. We just pass the context to it.
    const aiResult = await apiRequest('/chat', {
        method: 'POST',
        body: JSON.stringify(body)
    });

    return aiResult;

  } catch (error: any) {
    console.error("Error getting AI response from backend:", error);
    
    // Check if the error object from the backend has the expected shape
    if(error && error.response && error.translation) {
        return {
            response: error.response,
            translation: error.translation
        };
    }
    
    // Fallback for unexpected errors (e.g., network failure)
    return defaultResponse;
  }
};

export const getSentenceSuggestions = async (textToImprove: string): Promise<string[] | null> => {
    try {
        const body = { textToImprove };
        // This returns an array of strings, e.g., ["suggestion1", "suggestion2"]
        const suggestions = await apiRequest('/suggestions', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return suggestions;
    } catch (error) {
        console.error("Error getting sentence suggestions:", error);
        return null;
    }
};

export const getTopicSuggestion = async (
    history: { role: 'user' | 'model', parts: { text: string }[] }[], 
    scenario: string
): Promise<{ response: string; translation: string; }> => {
    try {
        const body = { history, scenario };
        const aiResult = await apiRequest('/topic-suggestion', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return aiResult;
    } catch (error: any) {
        console.error("Error getting topic suggestion from backend:", error);
        if (error && error.response && error.translation) {
            return {
                response: error.response,
                translation: error.translation
            };
        }
        return {
            response: "I'm sorry, I couldn't think of a suggestion right now.",
            translation: "Xin lỗi, tôi không thể nghĩ ra gợi ý ngay lúc này."
        };
    }
};

export const generateRandomSentence = async (): Promise<{ sentence: string; ipa: string }> => {
    try {
        const result = await apiRequest('/random-sentence', {
            method: 'POST',
        });
        return result;
    } catch (error) {
        console.error("Error generating random sentence:", error);
        return { 
            sentence: "Sorry, I couldn't generate a sentence right now. Please try another one.",
            ipa: ""
        };
    }
};
