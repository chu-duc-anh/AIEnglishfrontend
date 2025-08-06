import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, User, Send, ArrowLeft } from 'lucide-react';
import { requestPasswordReset } from '../services/authService';

const ForgotPasswordPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!username || !email) {
            setError('Please enter both your username and email.');
            return;
        }
        setIsLoading(true);
        try {
            const res = await requestPasswordReset(username, email);
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
            <div className="w-full max-w-md space-y-8">
                <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    {success ? (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Request Sent</h2>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">{success}</p>
                            <Link to="/login" className="mt-6 inline-flex items-center w-full justify-center text-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">Reset Your Password</h2>
                            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">Enter your username and email address, and we'll send you a link to get back into your account.</p>
                            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                     <div>
                                        <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        autoComplete="username"
                                        required
                                        className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                        <Send className="h-5 w-5 mr-2" />
                                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
                 <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Remembered your password?{' '}
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;