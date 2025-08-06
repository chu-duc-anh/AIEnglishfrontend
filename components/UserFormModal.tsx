import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { X } from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: Omit<User, 'id' | 'createdAt'> & { password?: string }) => Promise<void>;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
        setFullName('');
        setDob('');
        setGender('');
        setUsername('');
        setEmail('');
        setPassword('');
        setIsAdmin(false);
        setError('');
        setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName || !dob || !gender || !username || !email || !password) {
      setError('All fields except "Is Admin?" are required.');
      return;
    }
    setIsLoading(true);
    try {
      // The onSubmit function passed from AdminPage will handle closing the modal on success
      await onSubmit({ fullName, dob, gender, username, email, password, isAdmin });
    } catch (err) {
      // Display error from backend if creation fails
      setError(err instanceof Error ? err.message : 'Failed to create user.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Create New User</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              required
              className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              type="date"
              required
              className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              placeholder="Date of Birth"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
             <fieldset className="relative p-3 border border-gray-300 dark:border-gray-600 rounded-md">
                <legend className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1 ml-2">Gender</legend>
                <div className="flex items-center justify-around pt-1">
                    <label className="flex items-center cursor-pointer px-4 py-2">
                        <input
                            type="radio"
                            name="gender-modal"
                            value="male"
                            required
                            checked={gender === 'male'}
                            onChange={() => setGender('male')}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                        />
                        <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">Male</span>
                    </label>
                    <label className="flex items-center cursor-pointer px-4 py-2">
                        <input
                            type="radio"
                            name="gender-modal"
                            value="female"
                            required
                            checked={gender === 'female'}
                            onChange={() => setGender('female')}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                        />
                        <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">Female</span>
                    </label>
                </div>
            </fieldset>
            <input
              type="text"
              required
              autoComplete="off"
              className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="email"
              required
              autoComplete="off"
              className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              autoComplete="new-password"
              className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex items-center">
                <input
                    id="isAdmin"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                />
                <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                    Is Admin?
                </label>
            </div>
            {error && <p className="text-red-600 dark:text-red-400 text-sm text-center bg-red-100 dark:bg-red-900/30 p-3 rounded-md">{error}</p>}
            <div className="flex justify-end gap-4 pt-4">
                 <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 sm:text-sm transition-colors"
                  >
                    Cancel
                  </button>
                 <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:text-sm disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
                  >
                    {isLoading ? 'Creating...' : 'Create User'}
                  </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;