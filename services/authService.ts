import type { User } from '../types';

export const authEvents = new EventTarget();

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * A centralized helper function to handle all API requests.
 * @param path The API path to call (e.g., '/api/auth/login').
 * @param options The options for the fetch request.
 * @returns The JSON response from the API.
 */
const apiRequest = async (path: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BACKEND_URL}${path}`, { ...options, headers, credentials: 'include' });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        throw new Error(errorData.message || 'An unknown API error occurred');
    }
    
    if (response.status === 204) { // No Content
        return null;
    }

    return response.json();
};

export const signup = async (fullName: string, dob: string, username: string, email: string, password: string, gender: 'male' | 'female'): Promise<void> => {
    await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ fullName, dob, username, email, password, gender }),
    });
};

export const login = async (identifier: string, password: string): Promise<void> => {
    const { token, user } = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
    });

    localStorage.setItem('authToken', token);
    authEvents.dispatchEvent(new CustomEvent('authStateChange', { detail: { user } }));
};

export const logout = async (): Promise<void> => {
    localStorage.removeItem('authToken');
    authEvents.dispatchEvent(new CustomEvent('authStateChange', { detail: { user: null } }));
    // Optional: await apiRequest('/api/auth/logout', { method: 'POST' }); to invalidate the token on the server.
};

export const getProfile = async (): Promise<User | null> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return null;
    }
    return await apiRequest('/api/auth/me');
};


// --- Admin Functions ---

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'> & { password?: string }): Promise<User> => {
    return await apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
};

export const getAllUsers = async (): Promise<User[]> => {
    return await apiRequest('/api/users');
};

export const deleteUser = async (userId: string): Promise<void> => {
    await apiRequest(`/api/users/${userId}`, {
        method: 'DELETE',
    });
};

export const updateUserRole = async (userId: string, isAdmin: boolean): Promise<User> => {
    return await apiRequest(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAdmin }),
    });
};

// --- User Profile Functions ---
export const updateProfile = async (updates: { fullName?: string; dob?: string; gender?: 'male' | 'female' }): Promise<User> => {
    const updatedUser = await apiRequest('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
    // Dispatch event so the App component can update the user state globally
    authEvents.dispatchEvent(new CustomEvent('authStateChange', { detail: { user: updatedUser } }));
    return updatedUser;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
    });
};

// --- Password Reset Functions ---
export const requestPasswordReset = async (username: string, email: string): Promise<{ message: string }> => {
    return await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ username, email }),
    });
};

export const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
    return await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
    });
};
