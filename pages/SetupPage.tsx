import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createConversation } from '../services/conversationService';
import type { User } from '../types';
import { Bot, MessageSquare, Utensils, Briefcase } from 'lucide-react';

interface SetupPageProps {
  currentUser: User;
}

type Scenario = 'freestyle' | 'restaurant' | 'interview';

const SCENARIOS: { id: Scenario; title: string; description: string; icon: React.FC<any> }[] = [
    { id: 'freestyle', title: 'Freestyle Chat', description: 'A general, open-ended conversation.', icon: MessageSquare },
    { id: 'restaurant', title: 'Restaurant Order', description: 'Practice ordering food and drinks.', icon: Utensils },
    { id: 'interview', title: 'Job Interview', description: 'Practice answering common questions.', icon: Briefcase },
];

const SetupPage: React.FC<SetupPageProps> = ({ currentUser }) => {
  const [name, setName] = useState('Echo');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [scenario, setScenario] = useState<Scenario>('freestyle');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isLoading) {
      setIsLoading(true);
      try {
        const newConversation = await createConversation(name.trim(), gender, scenario);
        navigate(`/chat/${newConversation.id}`);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        // Optionally show an error message to the user
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Customize Your Session</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
            Choose a scenario and personalize your AI partner for the conversation.
            </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 text-left mb-3">1. Choose a Scenario</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setScenario(sc.id)}
                  className={`flex flex-col items-center text-center p-4 border rounded-lg transition-all ${scenario === sc.id ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-800' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                >
                  <sc.icon className="w-8 h-8 mb-2" />
                  <span className="font-semibold text-sm">{sc.title}</span>
                  <span className="text-xs mt-1 opacity-80">{sc.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <label htmlFor="assistant-name" className="block text-sm font-medium text-gray-600 dark:text-gray-400 text-left mb-2">2. Assistant's Name</label>
                <div className="relative">
                    <Bot className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                    <input
                        id="assistant-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., Alex, Sparky, Echo"
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 text-left mb-2">3. Assistant's Voice</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`flex items-center justify-center py-3 px-4 border rounded-lg transition-all text-sm font-semibold ${gender === 'female' ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-800' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                  >
                    <span>Female Voice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`flex items-center justify-center py-3 px-4 border rounded-lg transition-all text-sm font-semibold ${gender === 'male' ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-800' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                  >
                    <span>Male Voice</span>
                  </button>
                </div>
              </div>
          </div>
          
          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600"
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? 'Starting...' : 'Start Practicing'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupPage;