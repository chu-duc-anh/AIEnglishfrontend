
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAiResponse, getSentenceSuggestions, getTopicSuggestion } from '../services/geminiService';
import { getConversation, updateConversation } from '../services/conversationService';
import type { ChatMessage, PronunciationFeedback, Conversation, User, StoredChatMessage } from '../types';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useTextToSpeech from '../hooks/useTextToSpeech';
import ChatBubble from '../components/ChatBubble';
import MicButton from '../components/MicButton';
import { AlertTriangle, Info, Frown, Lightbulb, Loader } from 'lucide-react';
import Spinner from '../components/Spinner';

interface ChatPageProps {
  currentUser: User;
}

// Helper to simulate pronunciation check
const simulatePronunciationCheck = (text: string): PronunciationFeedback => {
  const words = text.split(' ');
  const errorCount = Math.floor(Math.random() * (words.length / 4));
  const errorIndices = new Set<number>();
  while (errorIndices.size < errorCount) {
    errorIndices.add(Math.floor(Math.random() * words.length));
  }
  
  const highlightedText = (
    <span>
      {words.map((word, index) => (
        <React.Fragment key={index}>
          {errorIndices.has(index) ? (
            <span className="text-red-500 underline decoration-wavy decoration-red-500">{word}</span>
          ) : (
            word
          )}
          {' '}
        </React.Fragment>
      ))}
    </span>
  );
  
  const accuracy = Math.round(((words.length - errorCount) / words.length) * 100);
  return { highlightedText, accuracy: Math.max(70, accuracy) }; // Ensure accuracy is not too low
};

const ChatPage: React.FC<ChatPageProps> = ({ currentUser }) => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState<Conversation | null | undefined>(undefined);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSuggestingTopic, setIsSuggestingTopic] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const greetingSpoken = useRef(false);
  const isProcessingUserInput = useRef(false);

  const { text, isListening, startListening, stopListening, hasRecognitionSupport, error: speechError, resetTranscript } = useSpeechRecognition();
  const { speak, cancel, speakingId, isSupported: isTtsSupported, isReady: isTtsReady } = useTextToSpeech();
  
  useEffect(() => {
    const fetchConversation = async () => {
      if (conversationId) {
        try {
          const convo = await getConversation(conversationId);
          // The backend now handles ownership check, so if we get a conversation, it's ours.
          if (convo) {
              const reprocessedMessages = convo.messages.map(msg => {
                  if (msg.sender === 'user' && msg.text) {
                      msg.pronunciation = simulatePronunciationCheck(msg.text);
                  }
                  return msg;
              });
              setConversation({ ...convo, messages: reprocessedMessages });
          } else {
            // This case might occur if the API returns a successful 200 with null body, which is unlikely with the current backend.
            setConversation(null);
          }
        } catch (error) {
          // The catch block will now handle 404s (not found/not authorized) from the backend.
          console.error("Error fetching conversation", error);
          setConversation(null);
        }
      }
    };
    fetchConversation();
  }, [conversationId, currentUser.id]);

  const saveConversation = useCallback(async (convo: Conversation | null) => {
    if (convo) {
      // Create a serializable version of the conversation, removing ReactNodes and transient state
      const serializableMessages: StoredChatMessage[] = convo.messages.map(({ pronunciation, isLoading, suggestions, isGeneratingSuggestions, ...rest }) => rest);
      try {
        await updateConversation(convo.id, { 
          messages: serializableMessages
        });
      } catch (error) {
        console.error("Failed to save conversation:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation?.messages, isAiThinking]);

  // Effect to handle the initial greeting when a new chat starts.
  useEffect(() => {
    if (!conversation) return;

    const messages = conversation.messages;
    const isNewChat = messages.length === 1 && messages[0].id === 'starter-0';
    
    // Speak the initial greeting only once when the chat is new and TTS is ready.
    if (isNewChat && isTtsSupported && isTtsReady && !greetingSpoken.current) {
      const firstMessage = messages[0];
      
      // This callback ensures we only mark the greeting as spoken if the browser allows it to start.
      const handleGreetingStart = () => {
        greetingSpoken.current = true;
      };

      speak(firstMessage.text, firstMessage.id, conversation.gender, handleGreetingStart);
    }
  }, [conversation, isTtsSupported, isTtsReady, speak]);

  // Effect to clean up speech synthesis when the component unmounts.
  useEffect(() => {
    // This returns a cleanup function that will be called only when ChatPage unmounts.
    // It prevents speech from continuing after the user navigates away.
    return () => {
      cancel();
    };
  }, [cancel]); // `cancel` is a stable function from the hook, so this effect runs once.

 const handleUserInput = useCallback(async (spokenText: string) => {
    if (!spokenText.trim() || !conversation) return;

    cancel();

    const pronunciation = simulatePronunciationCheck(spokenText);
    const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: spokenText,
        pronunciation,
        isGeneratingSuggestions: true, // Start loading for suggestions
    };

    // 1. Update UI with the new user message in a loading state for suggestions
    const updatedMessagesWithUser = [...conversation.messages, userMessage];
    setConversation(prev => ({ ...prev!, messages: updatedMessagesWithUser }));

    // 2. Fetch suggestions in the background and update the specific message when done.
    getSentenceSuggestions(spokenText).then(suggestions => {
        setConversation(currentConvo => {
            if (!currentConvo) return null;
            const finalMessages = currentConvo.messages.map(msg => {
                if (msg.id === userMessage.id) {
                    return { ...msg, suggestions: suggestions || [], isGeneratingSuggestions: false };
                }
                return msg;
            });
            return { ...currentConvo, messages: finalMessages };
        });
    });

    // 3. Prepare history for AI chat response
    const geminiHistory = updatedMessagesWithUser
        .filter(m => !m.isLoading && m.text)
        .map(m => ({
            role: m.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
            parts: [{ text: m.text }]
        }));

    // 4. Get the AI chat response
    setIsAiThinking(true);
    const aiResult = await getAiResponse(geminiHistory, conversation.assistantName, conversation.scenario);
    setIsAiThinking(false);

    const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResult.response,
        translation: aiResult.translation,
    };

    // 5. Add AI message and save the conversation in one state update to ensure atomicity
    setConversation(currentConvo => {
        if (!currentConvo) return null; // Should not happen
        const updatedConvo = { ...currentConvo, messages: [...currentConvo.messages, aiMessage] };
        
        // 6. Save the conversation state as it is now
        saveConversation(updatedConvo);
        
        return updatedConvo;
    });
    
    // 7. Speak the response
    if (isTtsSupported) {
        setTimeout(() => {
            speak(aiResult.response, aiMessage.id, conversation.gender);
        }, 1000);
    }

}, [conversation, isTtsSupported, speak, cancel, saveConversation]);


  useEffect(() => {
    if (text && !isListening && !isProcessingUserInput.current) {
      isProcessingUserInput.current = true;
      handleUserInput(text).finally(() => {
        isProcessingUserInput.current = false;
      });
      resetTranscript();
    }
  }, [text, isListening, handleUserInput, resetTranscript]);
  
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      cancel();
      startListening();
    }
  };

  const handleSpeak = useCallback((text: string, id: string) => {
    if (conversation) {
      speak(text, id, conversation.gender);
    }
  }, [conversation, speak]);
  
  const handleSuggestTopic = useCallback(async () => {
    if (!conversation || isSuggestingTopic || isAiThinking || isListening) return;

    cancel(); // Stop any current speech
    setIsSuggestingTopic(true);

    const geminiHistory = conversation.messages
        .filter(m => !m.isLoading && m.text)
        .map(m => ({
            role: m.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
            parts: [{ text: m.text }]
        }));
    
    const suggestionResult = await getTopicSuggestion(geminiHistory, conversation.scenario);
    setIsSuggestingTopic(false);

    const suggestionMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: suggestionResult.response,
        translation: suggestionResult.translation,
    };

    setConversation(currentConvo => {
        if (!currentConvo) return null;
        const updatedConvo = { ...currentConvo, messages: [...currentConvo.messages, suggestionMessage] };
        saveConversation(updatedConvo);
        return updatedConvo;
    });

    if (isTtsSupported) {
        setTimeout(() => {
            speak(suggestionResult.response, suggestionMessage.id, conversation.gender);
        }, 500);
    }
}, [conversation, isSuggestingTopic, isAiThinking, isListening, isTtsSupported, cancel, saveConversation, speak]);


  if (conversation === undefined) {
      return <div className="flex justify-center items-center h-[calc(100vh-80px)]"><Spinner /></div>
  }
  
  if (conversation === null) {
      return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-80px)] text-center p-4">
            <Frown className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Conversation Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The chat session you are looking for does not exist or you do not have permission to view it.</p>
            <button
                onClick={() => navigate('/conversations')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
            >
                Go to My Conversations
            </button>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto">
       <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {conversation.messages.map((msg) => (
          <ChatBubble 
            key={msg.id} 
            message={msg} 
            assistantName={conversation.assistantName}
            onSpeak={handleSpeak}
            speakingId={speakingId}
            isTtsSupported={isTtsSupported}
          />
        ))}
        {isAiThinking && <ChatBubble message={{ id: 'thinking', sender: 'ai', text: '', isLoading: true }} assistantName={conversation.assistantName} onSpeak={handleSpeak} speakingId={speakingId} isTtsSupported={isTtsSupported}/>}
        {isListening && text && (
             <div className="flex items-end justify-end w-full">
                 <div className="px-4 py-3 rounded-2xl inline-block bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-br-none italic">
                     {text}
                 </div>
            </div>
        )}
      </div>

      <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
        {!hasRecognitionSupport ? (
            <div className="flex items-center text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">
                <AlertTriangle className="h-6 w-6 mr-3" />
                <span>Speech recognition is not supported by your browser. Please try Chrome or Safari.</span>
            </div>
        ) : speechError ? (
            <div className="flex items-center text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg">
                <AlertTriangle className="h-6 w-6 mr-3" />
                <span>{speechError}</span>
            </div>
        ) : (
            <>
                <div className="flex items-center justify-center gap-6 mb-4">
                    <MicButton 
                        isListening={isListening} 
                        isProcessing={isAiThinking} 
                        onClick={handleMicClick}
                        disabled={isAiThinking || isSuggestingTopic}
                    />
                     <button
                        onClick={handleSuggestTopic}
                        disabled={isAiThinking || isListening || isSuggestingTopic}
                        className="relative flex flex-col items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ease-in-out shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900 focus:ring-amber-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:cursor-not-allowed bg-amber-400 dark:bg-amber-500 text-white hover:bg-amber-500 dark:hover:bg-amber-600"
                        aria-label="Get a hint"
                    >
                        {isSuggestingTopic ? (
                            <Loader className="w-8 h-8 animate-spin" />
                        ) : (
                            <Lightbulb className="w-8 h-8" />
                        )}
                        <span className="text-xs mt-1 absolute bottom-3">
                            {isSuggestingTopic ? 'Getting idea...' : 'Get a Hint'}
                        </span>
                    </button>
                </div>

                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Info className="h-4 w-4 mr-2" />
                  <span>Your conversation is saved automatically.</span>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
