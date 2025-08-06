import React, { useState } from 'react';
import type { ChatMessage } from '../types';
import Spinner from './Spinner';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

interface ChatBubbleProps {
  message: ChatMessage;
  assistantName: string;
  onSpeak: (text: string, id: string) => void;
  speakingId: string | null;
  isTtsSupported: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, assistantName, onSpeak, speakingId, isTtsSupported }) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isUser = message.sender === 'user';
  const bubbleAlignment = isUser ? 'justify-end' : 'justify-start';
  const bubbleColor = isUser ? 'bg-indigo-600' : 'bg-white dark:bg-gray-700';
  const bubbleTextColor = isUser ? 'text-white' : 'text-gray-900 dark:text-gray-100';
  const bubbleRadius = isUser ? 'rounded-br-none' : 'rounded-bl-none';
  const senderName = isUser ? 'You' : assistantName;
  
  const isThisBubbleSpeaking = speakingId === message.id;

  if (message.isLoading) {
    return (
       <div className={`flex items-end justify-start w-full`}>
        <div className={`px-4 py-3 rounded-2xl inline-block bg-white dark:bg-gray-700 rounded-bl-none`}>
          <div className="flex items-center space-x-2">
            <Spinner />
            <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
          </div>
        </div>
      </div>
    );
  }

  const handleSpeakerClick = () => {
    if (message.text && message.id) {
        onSpeak(message.text, message.id);
    }
  };
  
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-4`}>
       <div className={`flex items-center gap-2 mb-1 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
             <span className="text-xs text-gray-500 dark:text-gray-400">{senderName}</span>
             {!isUser && isTtsSupported && message.text && (
                 <button 
                     onClick={handleSpeakerClick}
                     className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                     aria-label={isThisBubbleSpeaking ? 'Stop speech' : 'Read text aloud'}
                 >
                     {isThisBubbleSpeaking ? <VolumeX size={16} className="text-indigo-600 dark:text-indigo-400" /> : <Volume2 size={16} />}
                 </button>
             )}
        </div>
      <div className={`flex items-end ${bubbleAlignment} w-full`}>
        <div className={`px-4 py-3 rounded-2xl inline-block max-w-lg md:max-w-xl ${bubbleColor} ${bubbleRadius} ${bubbleTextColor} shadow-sm`}>
          {isUser && message.pronunciation ? (
            <div>
              <p className="text-base">{message.pronunciation.highlightedText}</p>
              <div className="text-right text-xs mt-2 opacity-80">
                <span>Pronunciation: {message.pronunciation.accuracy}%</span>
              </div>
            </div>
          ) : (
            <p className="text-base">{message.text}</p>
          )}

          {!isUser && message.translation && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                {showTranslation ? 'Hide' : 'See'} Translation
              </button>
              {showTranslation && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">{message.translation}</p>
              )}
            </div>
          )}
        </div>
      </div>

       {/* Suggestions UI for user messages */}
       {isUser && (
            <div className="w-full max-w-lg md:max-w-xl mt-2">
                {message.isGeneratingSuggestions ? (
                    <div className="flex items-center justify-end text-sm text-gray-500 dark:text-gray-400 p-2">
                        <Spinner />
                        <span className="ml-2 italic">Finding better phrases...</span>
                    </div>
                ) : (message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowSuggestions(!showSuggestions)}
                                className="flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors py-1 px-2 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                                aria-expanded={showSuggestions}
                            >
                                <Sparkles size={16} className="mr-2" />
                                {showSuggestions ? 'Hide Suggestions' : 'Improve my sentence'}
                            </button>
                        </div>
                    )
                )}

                {showSuggestions && message.suggestions && message.suggestions.length > 0 && (
                    <div 
                        className="bg-indigo-50 dark:bg-gray-900 border border-indigo-200 dark:border-gray-700 p-4 rounded-lg mt-2"
                        style={{animation: 'fadeIn 0.5s ease-in-out'}}
                    >
                        <style>{`@keyframes fadeIn { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }`}</style>
                        <h4 className="font-semibold text-sm mb-2 text-gray-800 dark:text-gray-200">You could also say:</h4>
                        <ul className="list-disc list-inside space-y-2">
                            {message.suggestions.map((suggestion, index) => (
                                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default ChatBubble;
