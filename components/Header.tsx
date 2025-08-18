import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
      <Link to="/" className="text-xl font-bold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
        AI English Assistant
      </Link>
      <div className="flex items-center space-x-4">
         <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        {currentUser ? (
          <>
            <Link to="/profile" className="font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              Welcome, {currentUser.fullName || currentUser.username}
            </Link>
            {currentUser.isAdmin && (
              <Link to="/admin" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                Admin Panel
              </Link>
            )}
            <button
              onClick={handleLogoutClick}
              className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
           <>
            <Link
              to="/login"
              className="font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-4 py-2 rounded-lg"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
