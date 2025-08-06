

import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Key, CheckCircle, ArrowLeft } from 'lucide-react';
import { resetPassword } from '../services/authService';

const ResetPasswordPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!token) {
        // This case should ideally not be hit due to routing, but it's good practice.
        return (
             <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
                    <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Invalid Link</h2>
                    <p className="text-gray-600 dark:text-gray-400">The password reset link is missing a token.</p>
                     <Link to="/login" className="mt-6 inline-flex items-center w-full justify-center text-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!newPassword || !confirmPassword) {
            setError('Please fill out both password fields.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setIsLoading(true);
        try {
            const res = await resetPassword(token, newPassword);
            setSuccess(res.message);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                {success ? (
                    <div className="text-center">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">Password Reset Successful!</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{success}</p>
                        <Link to="/login" className="mt-6 inline-flex items-center w-full justify-center text-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Proceed to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">Create a New Password</h2>
                        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">Your new password must be different from previous used passwords.</p>
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                             <div className="space-y-4">
                                <div>
                                    <input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    required
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-600 dark:text-red-400 text-sm text-center bg-red-100 dark:bg-red-900/30 p-2 rounded-md">{error}</p>}

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Key className="h-5 w-5 mr-2" />
                                    {isLoading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;