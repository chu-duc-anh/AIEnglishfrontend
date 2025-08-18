
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, PlusCircle, Shield, BookOpen } from 'lucide-react';
import type { User } from '../types';

interface HomePageProps {
  currentUser: User | null;
}

const HomePage: React.FC<HomePageProps> = ({ currentUser }) => {
  const navigate = useNavigate();

  const handleCardClick = (path: string) => {
    if (currentUser) {
      navigate(path);
    } else {
      navigate('/login');
    }
  };
  
  const cardBaseClasses = "bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 flex flex-col items-start transition-all duration-300 hover:shadow-lg hover:-translate-y-1";

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-[calc(100vh-80px)]">
      {/* Hero Section */}
      <section className="bg-indigo-50 dark:bg-gray-800 text-center py-16 sm:py-20 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Start communicating with your AI assistant
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Improve your pronunciation and conversation skills through interactive role-playing scenarios.
        </p>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* New Practice Card */}
          <div className={cardBaseClasses}>
            <div className="flex items-center text-indigo-600 dark:text-indigo-400 mb-3">
              <PlusCircle className="w-7 h-7 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Conversation Practice</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
              Customize a new AI assistant and choose a scenario to start a conversation.
            </p>
            <button
              onClick={() => handleCardClick('/setup')}
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-semibold py-3 px-6 rounded-lg transition-colors mt-auto"
            >
              Start New Session
            </button>
          </div>
          
          {/* Speaking Practice Card */}
          <div className={cardBaseClasses}>
            <div className="flex items-center text-teal-600 dark:text-teal-400 mb-3">
                <BookOpen className="w-7 h-7 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Speaking Practice</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                Practice sentences and vocabulary and get instant feedback on your pronunciation.
            </p>
            <button
                onClick={() => handleCardClick('/reading-practice')}
                className="w-full bg-teal-600 text-white hover:bg-teal-700 font-semibold py-3 px-6 rounded-lg transition-colors mt-auto"
            >
                Practice Speaking
            </button>
          </div>

          {/* Chat History Card */}
          <div className={cardBaseClasses}>
            <div className="flex items-center text-green-600 dark:text-green-400 mb-3">
              <MessageSquare className="w-7 h-7 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Conversation History</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
              Review your past conversations, check feedback, and continue practicing.
            </p>
            <button
              onClick={() => handleCardClick('/conversations')}
              className="w-full bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-900 dark:hover:bg-gray-600 font-semibold py-3 px-6 rounded-lg transition-colors mt-auto"
            >
              View History
            </button>
          </div>

          {/* Admin Panel Card - Conditional */}
          {currentUser?.isAdmin && (
            <div className={`${cardBaseClasses} lg:col-start-3`}>
              <div className="flex items-center text-red-600 dark:text-red-400 mb-3">
                <Shield className="w-7 h-7 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                Manage application users, view system statistics, and configure settings.
              </p>
              <button
                onClick={() => navigate('/admin')}
                className="w-full bg-red-600 text-white hover:bg-red-700 font-semibold py-3 px-6 rounded-lg transition-colors mt-auto"
              >
                Access Admin Panel
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
