
import React, { useState, useEffect, useCallback } from 'react';
import { generateRandomSentence } from '../services/geminiService';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { compareTextsForFeedback, compareVocabularyForFeedback } from '../utils/textComparison';
import { vocabularyLevels, VocabularyWord } from '../data/vocabulary';
import type { PronunciationFeedback, DetailedPronunciationFeedback } from '../types';
import MicButton from '../components/MicButton';
import Spinner from '../components/Spinner';
import { AlertTriangle, BookText, Percent, RefreshCw, Star, MessageSquare, List, ArrowLeft, ArrowRight, Target, Waves, Activity, Volume2, VolumeX } from 'lucide-react';

type PracticeMode = 'sentence' | 'vocabulary' | null;
type PracticeState = 'selection' | 'practicing' | 'result';

const getScoreStyle = (score: number) => {
    if (score > 85) return {
        label: 'Excellent',
        colorClasses: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 border-green-500/50',
        progressBarClass: 'bg-green-500',
    };
    if (score > 60) return {
        label: 'Good',
        colorClasses: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40 border-yellow-500/50',
        progressBarClass: 'bg-yellow-500',
    };
    return {
        label: 'Needs Work',
        colorClasses: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 border-red-500/50',
        progressBarClass: 'bg-red-500',
    };
};

const ScoreBreakdownCard: React.FC<{score: number, title: string, description: string, icon: React.FC<any>}> = ({ score, title, description, icon: Icon }) => {
    const { label, colorClasses, progressBarClass } = getScoreStyle(score);

    return (
        <div className={`p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-800 border ${colorClasses}`}>
             <div className="flex-shrink-0 text-center">
                <div className={`relative h-20 w-20 rounded-full flex items-center justify-center bg-white dark:bg-gray-800`}>
                    <svg className="absolute inset-0" viewBox="0 0 36 36">
                        <path className="text-gray-200 dark:text-gray-700"
                            d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3" />
                        <path className={`${progressBarClass.replace('bg-', 'text-')}`}
                            d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${score}, 100`}
                            strokeLinecap="round"
                            transform="rotate(270 18 18)"
                        />
                    </svg>
                    <Icon className="h-6 w-6" />
                </div>
                <span className={`mt-2 block text-2xl font-bold`}>{score}%</span>
            </div>
            <div className="flex-1 text-center sm:text-left">
                <h4 className="font-bold text-gray-900 dark:text-gray-100">{title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
            </div>
             <div className="flex-shrink-0">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${colorClasses}`}>
                    {label}
                </span>
            </div>
        </div>
    );
};


const SpeakingPracticePage: React.FC = () => {
    const [practiceMode, setPracticeMode] = useState<PracticeMode>(null);
    const [practiceState, setPracticeState] = useState<PracticeState>('selection');
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [currentItem, setCurrentItem] = useState<{ text: string, ipa: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
    const [detailedFeedback, setDetailedFeedback] = useState<DetailedPronunciationFeedback | null>(null);
    
    const { text: userTranscript, isListening, startListening, stopListening, resetTranscript, hasRecognitionSupport, error: speechError } = useSpeechRecognition();
    const { speak, cancel, speakingId, isSupported: isTtsSupported } = useTextToSpeech();

    useEffect(() => {
        // Cleanup TTS on component unmount
        return () => {
            cancel();
        };
    }, [cancel]);

    const getRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

    const handleGenerateSentence = async () => {
        cancel();
        setIsLoading(true);
        setFeedback(null);
        setDetailedFeedback(null);
        resetTranscript();
        try {
            const result = await generateRandomSentence();
            setCurrentItem({ text: result.sentence, ipa: result.ipa });
            setPracticeState('practicing');
        } catch (error) {
            console.error(error);
            setCurrentItem({ text: 'The quick brown fox jumps over the lazy dog.', ipa: '/ðə kwɪk braʊn fɒks dʒʌmps ˈoʊvər ðə ˈleɪzi dɒɡ/' });
            setPracticeState('practicing');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNewWord = (level: number) => {
        cancel();
        setIsLoading(true);
        setFeedback(null);
        setDetailedFeedback(null);
        resetTranscript();
        const wordList = vocabularyLevels[level];
        if (wordList) {
            const randomWord: VocabularyWord = getRandomItem(wordList);
            setCurrentItem({ text: randomWord.word, ipa: randomWord.ipa });
        }
        setSelectedLevel(level);
        setPracticeState('practicing');
        setIsLoading(false);
    }
    
    useEffect(() => {
        if (!isListening && userTranscript && currentItem && practiceState === 'practicing') {
            if (practiceMode === 'vocabulary') {
                const fb = compareVocabularyForFeedback(currentItem.text, userTranscript);
                setDetailedFeedback(fb);
            } else {
                const fb = compareTextsForFeedback(currentItem.text, userTranscript);
                setFeedback(fb);
            }
            setPracticeState('result');
        }
    }, [isListening, userTranscript, currentItem, practiceState, practiceMode]);

    const handleMicClick = () => {
        cancel();
        if (isListening) {
            stopListening();
        } else {
            resetTranscript();
            setFeedback(null);
            setDetailedFeedback(null);
            startListening();
        }
    };
    
    const handleSpeak = useCallback(() => {
        if (currentItem?.text && isTtsSupported) {
            // Using currentItem.text as ID is sufficient for this page's logic
            speak(currentItem.text, currentItem.text, 'female'); 
        }
    }, [currentItem, isTtsSupported, speak]);


    const handleResetPractice = () => {
        cancel();
        resetTranscript();
        setFeedback(null);
        setDetailedFeedback(null);
        setPracticeState('practicing');
    };
    
    const handleNextItem = () => {
        cancel();
        if (practiceMode === 'sentence') {
            handleGenerateSentence();
        } else if (practiceMode === 'vocabulary' && selectedLevel !== null) {
            handleNewWord(selectedLevel);
        }
    }

    const resetToModeSelection = () => {
        cancel();
        setPracticeState('selection');
        setPracticeMode(null);
        setCurrentItem(null);
        setFeedback(null);
        setDetailedFeedback(null);
        setSelectedLevel(null);
    }
    
    const resetToLevelSelection = () => {
        cancel();
        setPracticeState('selection');
        setCurrentItem(null);
        setFeedback(null);
        setDetailedFeedback(null);
        setSelectedLevel(null);
    }

    const renderSelectionScreen = () => (
        <div className="animate-fade-in">
             <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">Speaking Practice</h1>
             <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">Choose a mode to improve your speaking and pronunciation.</p>
            {!practiceMode ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button onClick={() => setPracticeMode('vocabulary')} className="text-left bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <List className="w-10 h-10 text-teal-600 dark:text-teal-400 mb-3" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Vocabulary Practice</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Practice individual words from different difficulty levels.</p>
                    </button>
                    <button onClick={() => { setPracticeMode('sentence'); handleGenerateSentence(); }} className="text-left bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <MessageSquare className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-3" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Random Sentence</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Let the AI generate a random sentence for you to say aloud.</p>
                    </button>
                </div>
            ) : (
                <div>
                     <button onClick={resetToModeSelection} className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Modes
                    </button>
                    <h2 className="text-2xl font-bold text-center mb-4">Select Difficulty Level</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map(level => (
                            <button key={level} onClick={() => handleNewWord(level)} className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md hover:shadow-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30 border-2 border-transparent hover:border-yellow-400 transition-all transform hover:-translate-y-1">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-6 h-6 ${i < level ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}/>
                                    ))}
                                </div>
                                <span className="mt-3 font-semibold text-gray-800 dark:text-gray-200">Level {level}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
    
    const renderPracticeScreen = () => (
         <div className="animate-fade-in space-y-6">
            <button 
                onClick={practiceMode === 'sentence' ? resetToModeSelection : resetToLevelSelection} 
                className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
            <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center"><BookText className="mr-2"/>Your Text to Speak</h2>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                    <div className="flex items-center justify-center gap-4">
                        <p className="text-4xl font-bold leading-relaxed">{currentItem?.text}</p>
                        {practiceMode === 'vocabulary' && isTtsSupported && currentItem && (
                            <button
                                onClick={handleSpeak}
                                className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-full"
                                aria-label="Say word aloud"
                            >
                                {speakingId === currentItem.text ? <VolumeX size={32} className="text-indigo-500"/> : <Volume2 size={32} />}
                            </button>
                        )}
                    </div>
                    <p className="text-xl text-gray-500 dark:text-gray-400 mt-2 font-mono">{currentItem?.ipa}</p>
                </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                {!hasRecognitionSupport ? (
                    <div className="flex items-center text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg"><AlertTriangle className="h-6 w-6 mr-3" /><span>Speech recognition not supported.</span></div>
                ) : speechError ? (
                    <div className="flex items-center text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg"><AlertTriangle className="h-6 w-6 mr-3" /><span>{speechError}</span></div>
                ) : (
                    <>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Click the button and say the text above aloud.</p>
                        <MicButton isListening={isListening} isProcessing={false} onClick={handleMicClick} />
                        {isListening && userTranscript && (<div className="w-full mt-4 p-3 bg-indigo-50 dark:bg-gray-700/50 rounded-lg text-gray-600 dark:text-gray-300 italic text-center">{userTranscript}</div>)}
                    </>
                )}
            </div>

            {practiceState === 'result' && (
                <div className="animate-fade-in">
                    {practiceMode === 'vocabulary' && detailedFeedback ? (
                         <div>
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center"><Percent className="mr-2"/>Your Result</h2>
                            <p className="text-2xl leading-relaxed p-4 mb-4 bg-gray-100 dark:bg-gray-700 rounded-md text-center">{detailedFeedback.highlightedText}</p>
                            <div className="space-y-3">
                                <ScoreBreakdownCard score={detailedFeedback.accuracyScore} title="Accuracy" description="How well you pronounced the correct word." icon={Target}/>
                                <ScoreBreakdownCard score={detailedFeedback.pronunciationScore} title="Pronunciation" description="The clarity and correctness of individual sounds." icon={Waves}/>
                                <ScoreBreakdownCard score={detailedFeedback.stressScore} title="Stress" description="The emphasis placed on the correct syllables." icon={Activity}/>
                            </div>
                        </div>
                    ) : ( feedback &&
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center"><Percent className="mr-2"/>Your Result</h2>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Feedback:</h3>
                                    <span className={`text-2xl font-bold ${feedback.accuracy > 85 ? 'text-green-600' : feedback.accuracy > 60 ? 'text-yellow-600' : 'text-red-600'}`}>{feedback.accuracy}% Accurate</span>
                                </div>
                                <p className="text-2xl leading-relaxed p-4 bg-white dark:bg-gray-800 rounded-md text-center">{feedback.highlightedText}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Correct words are <span className="text-green-600 bg-green-500/10 rounded-sm px-0.5 py-0.5">green</span>, incorrect words are <span className="text-red-500 underline decoration-wavy decoration-red-500 bg-red-500/10 rounded-sm px-0.5 py-0.5">highlighted</span>.</p>
                            </div>
                        </div>
                    )}
                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                        <button onClick={handleResetPractice} className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"><RefreshCw className="w-5 h-5 mr-2" />Try Again</button>
                        <button onClick={handleNextItem} className="w-full flex items-center justify-center py-3 px-4 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors"><ArrowRight className="w-5 h-5 mr-2" />{practiceMode === 'sentence' ? 'New Sentence' : 'Next Word'}</button>
                    </div>
                </div>
            )}
        </div>
    );
    
    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-80px)] flex items-center justify-center">
             <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-48">
                        <Spinner />
                        <p className="mt-3 text-gray-600 dark:text-gray-400">Loading your practice session...</p>
                    </div>
                ) : practiceState === 'selection' ? renderSelectionScreen() : renderPracticeScreen()}
            </div>
            <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    );
};

export default SpeakingPracticePage;
