import React from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';

interface MicButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const MicButton: React.FC<MicButtonProps> = ({ isListening, isProcessing, onClick, disabled }) => {
  let Icon = Mic;
  let text = 'Tap to Speak';
  let pulseClass = '';
  let colorClasses = '';

  if (isProcessing) {
    Icon = Loader;
    text = 'Processing...';
    pulseClass = 'animate-spin';
    // Gray button with white text for processing
    colorClasses = 'bg-gray-600 text-white';
  } else if (isListening) {
    Icon = MicOff;
    text = 'Listening...';
    pulseClass = 'animate-pulse';
    // Red button with white text for listening
    colorClasses = 'bg-red-600 text-white';
  } else {
    // Default state: Black text on light gray for light mode, White text on dark gray for dark mode
    Icon = Mic;
    text = 'Tap to Speak';
    colorClasses = 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600';
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ease-in-out shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900 focus:ring-indigo-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed ${colorClasses}`}
      aria-label={text}
    >
      <Icon className={`w-8 h-8 ${pulseClass}`} />
      <span className="text-xs mt-1 absolute bottom-3">{text}</span>
    </button>
  );
};

export default MicButton;
