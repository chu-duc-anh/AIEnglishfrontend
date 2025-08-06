import React from 'react';
import type { PronunciationFeedback, DetailedPronunciationFeedback } from '../types';

const cleanWord = (word: string): string => {
    if (!word) return '';
    return word.toLowerCase().replace(/[.,!?;:"“”]/g, '');
};

export const compareTextsForFeedback = (originalText: string, spokenText: string): PronunciationFeedback => {
    const originalWords = originalText.split(/\s+/).filter(Boolean);
    const spokenWords = spokenText.split(/\s+/).filter(Boolean);

    let incorrectIndices = new Set<number>();

    const highlightedText = React.createElement(
        'span',
        null,
        originalWords.map((word, index) => {
            const originalClean = cleanWord(word);
            const spokenClean = cleanWord(spokenWords[index]);
            
            // An incorrect word is one that doesn't match at the same position.
            // This is a strict check suitable for reading practice.
            const isIncorrect = originalClean !== spokenClean;
            
            if (isIncorrect) {
                incorrectIndices.add(index);
            }

            const spanClassName = isIncorrect
                ? "text-red-500 underline decoration-wavy decoration-red-500 bg-red-500/10 rounded-sm px-1 py-0.5"
                : "text-green-600 bg-green-500/10 rounded-sm px-1 py-0.5";

            return React.createElement(
                React.Fragment,
                { key: index },
                React.createElement('span', { className: spanClassName }, word),
                ' '
            );
        })
    );
    
    // Accuracy is the percentage of correctly spoken words out of the total original words.
    const accuracy = Math.round(((originalWords.length - incorrectIndices.size) / originalWords.length) * 100);

    return { highlightedText, accuracy: Math.max(0, accuracy) }; // Ensure accuracy is not negative
};

// --- Detailed feedback for vocabulary ---

// Private Levenshtein distance function to check character-level similarity
const levenshtein = (s1: string, s2: string): number => {
  if (s1.length < s2.length) {
    return levenshtein(s2, s1);
  }
  if (s2.length === 0) {
    return s1.length;
  }
  let previousRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  for (let i = 0; i < s1.length; i++) {
    let currentRow = [i + 1];
    for (let j = 0; j < s2.length; j++) {
      let insertions = previousRow[j + 1] + 1;
      let deletions = currentRow[j] + 1;
      let substitutions = previousRow[j] + (s1[i] !== s2[j] ? 1 : 0);
      currentRow.push(Math.min(insertions, deletions, substitutions));
    }
    previousRow = currentRow;
  }
  return previousRow[s2.length];
};


export const compareVocabularyForFeedback = (originalWord: string, spokenWord:string): DetailedPronunciationFeedback => {
    const originalClean = cleanWord(originalWord);
    const spokenClean = cleanWord(spokenWord);

    // Calculate similarity based on Levenshtein distance. This is the foundation for our scores.
    const dist = levenshtein(originalClean, spokenClean);
    const maxLength = Math.max(originalClean.length, spokenClean.length);
    const similarity = maxLength === 0 ? 100 : Math.round(Math.max(0, 1 - dist / maxLength) * 100);

    let accuracyScore: number;
    let pronunciationScore: number;
    let stressScore: number;

    const isPerfectMatch = originalClean === spokenClean;

    // 1. Accuracy Score: Determines if the user said the correct word.
    // We consider it "correct" if similarity is high.
    if (similarity > 75) {
        accuracyScore = 85 + Math.floor((similarity - 75) / 25 * 15); // Scale from 85 to 100
    } else {
        accuracyScore = Math.floor(similarity * 0.9); // If wrong word, score is based on how close it was
    }

    // 2. Pronunciation Score: The core metric based on character similarity (Levenshtein).
    pronunciationScore = similarity;
    // Add slight organic variation
    if (pronunciationScore > 50 && pronunciationScore < 98) {
        pronunciationScore += Math.floor(Math.random() * 6 - 3); // Add/subtract up to 3 points
    }

    // 3. Stress Score (Simulated based on pronunciation quality)
    if (pronunciationScore > 90) {
        // Excellent pronunciation -> high chance of correct stress
        stressScore = 90 + Math.floor(Math.random() * 11); // 90-100
    } else if (pronunciationScore > 70) {
        // Good pronunciation -> medium chance of correct stress
        stressScore = 75 + Math.floor(Math.random() * 21); // 75-95
    } else if (pronunciationScore > 40) {
        // Mediocre pronunciation -> stress is likely off
        stressScore = 50 + Math.floor(Math.random() * 26); // 50-75
    } else {
        // Poor pronunciation -> stress is likely very wrong
        stressScore = 20 + Math.floor(Math.random() * 31); // 20-50
    }

    // If it's a perfect match, all scores should be very high.
    if (isPerfectMatch) {
      accuracyScore = 100;
      pronunciationScore = Math.floor(Math.random() * 5 + 96); // 96-100
      stressScore = Math.floor(Math.random() * 10 + 91); // 91-100
    }
    
    const highlightedText = React.createElement(
        'span',
        { className: isPerfectMatch ? "text-green-600" : "text-red-500 underline decoration-wavy" },
        originalWord
    );
    
    return {
        highlightedText,
        accuracyScore: Math.min(100, Math.max(0, accuracyScore)),
        pronunciationScore: Math.min(100, Math.max(0, pronunciationScore)),
        stressScore: Math.min(100, Math.max(0, stressScore)),
    };
};