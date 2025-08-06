import type { Conversation, StoredChatMessage, ChatMessage } from '../types';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_PATH = '/api/conversations';

/**
 * A helper function to handle authenticated API requests for conversations.
 * @param endpoint The API endpoint to call (e.g., '/').
 * @param options The options for the fetch request.
 * @returns The JSON response from the API.
 */
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
        const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        throw new Error(errorData.message || 'An unknown API error occurred');
    }

    if (response.status === 204) { // Handle No Content for DELETE
        return null;
    }

    return response.json();
};

export const getConversations = async (): Promise<Conversation[]> => {
    return await apiRequest('/');
};

export const getConversation = async (id: string): Promise<Conversation | null> => {
    return await apiRequest(`/${id}`);
};

export const createConversation = async (assistantName: string, gender: 'male' | 'female', scenario: string): Promise<Conversation> => {
    return await apiRequest('/', {
        method: 'POST',
        body: JSON.stringify({ assistantName, gender, scenario }),
    });
};

export const updateConversation = async (id: string, updates: Partial<{ messages: StoredChatMessage[]; title: string; scenario: string; }>): Promise<void> => {
    await apiRequest(`/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
};

export const deleteConversation = async (id: string): Promise<void> => {
    await apiRequest(`/${id}`, {
        method: 'DELETE',
    });
};
