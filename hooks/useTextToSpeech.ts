import { useState, useEffect, useCallback, useRef } from 'react';

interface TextToSpeechHook {
  speak: (text: string, id: string, gender: 'male' | 'female', onStart?: () => void) => void;
  cancel: () => void;
  speakingId: string | null;
  isSupported: boolean;
  isReady: boolean;
}

const useTextToSpeech = (): TextToSpeechHook => {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // A ref to hold the single synth instance.
  const synthRef = useRef<SpeechSynthesis | null>(null);
  // Ref to manage the keep-alive interval for speech synthesis.
  const keepAliveIntervalRef = useRef<number | null>(null);

  // A ref to hold the latest speakingId. This allows callbacks (like speak)
  // to access the current value without being recreated on every state change.
  const speakingIdRef = useRef(speakingId);
  useEffect(() => {
    speakingIdRef.current = speakingId;
  }, [speakingId]);

  // Initialize and clean up the speech synthesis engine
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      setIsSupported(true);
    } else {
      setIsSupported(false);
      return;
    }
    const synth = synthRef.current;
    
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        setIsReady(true);
        // It's safer not to remove the listener, as some browsers might fire it multiple times.
      }
    };
    
    synth.addEventListener('voiceschanged', loadVoices);
    loadVoices(); // Initial attempt

    // Cleanup function
    return () => {
      synth.removeEventListener('voiceschanged', loadVoices);
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
      if (synth.speaking) {
        synth.cancel();
      }
    };
  }, []); // This effect runs only once on mount.

  const cancel = useCallback(() => {
    const synth = synthRef.current;
    if (synth) {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
      setSpeakingId(null);
      synth.cancel();
    }
  }, []);

  const speak = useCallback((text: string, id: string, gender: 'male' | 'female' = 'female', onStart?: () => void) => {
    const synth = synthRef.current;
    if (!synth || !isReady || !text) {
      return;
    }
    
    // Use the ref to get the latest value. If we're asked to speak the thing that's
    // already speaking, we interpret it as a "stop" request.
    if (speakingIdRef.current === id) {
      cancel();
      return;
    }

    // Always cancel any pending or active speech. This clears the browser's internal queue.
    synth.cancel();

    // The delay helps prevent a race condition on some browsers where the new utterance 
    // is immediately cancelled by the `cancel()` call from this same function.
    const speakTimeout = setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);

        // --- Cross-browser Voice Selection Logic ---
        
        // 1. Get all available English voices. Fallback to any voice if none are found.
        let availableVoices = voices.filter(v => v.lang.startsWith('en-'));
        if (availableVoices.length === 0) {
            availableVoices = voices;
        }

        if (availableVoices.length > 0) {
            // 2. Prefer US English voices if available, otherwise use any English voice.
            let voicesToSearch = availableVoices.filter(v => v.lang === 'en-US');
            if (voicesToSearch.length === 0) {
                voicesToSearch = availableVoices;
            }

            let selectedVoice: SpeechSynthesisVoice | undefined;

            // 3. Define keywords for gender matching. This is a best-effort approach.
            const femaleKeywords = /female|woman|zira|susan|eva|linda|heather|samantha|nuance/i;
            const maleKeywords = /male|man|david|mark|tom|alex|daniel/i;
            const targetKeywords = gender === 'male' ? maleKeywords : femaleKeywords;
            const oppositeKeywords = gender === 'male' ? femaleKeywords : maleKeywords;

            // 4. Multi-step search for the best voice:
            // a. Try to find a high-quality voice (e.g., from Google/Microsoft) that matches the gender.
            selectedVoice = voicesToSearch.find(v => /(google|microsoft)/i.test(v.name) && targetKeywords.test(v.name));
            
            // b. If not found, find any voice that matches the gender.
            if (!selectedVoice) {
                selectedVoice = voicesToSearch.find(v => targetKeywords.test(v.name));
            }

            // c. If still not found, find a high-quality voice that is NOT the opposite gender.
            if (!selectedVoice) {
                 selectedVoice = voicesToSearch.find(v => /(google|microsoft)/i.test(v.name) && !oppositeKeywords.test(v.name));
            }
            
            // d. If still not found, find any voice that is NOT the opposite gender.
            if (!selectedVoice) {
                selectedVoice = voicesToSearch.find(v => !oppositeKeywords.test(v.name));
            }

            // e. As a final fallback, pick the first voice from the search list.
            if (!selectedVoice) {
                selectedVoice = voicesToSearch[0];
            }
            
            utterance.voice = selectedVoice || null;
        }

        utterance.onstart = () => {
            setSpeakingId(id);
            if (onStart) {
                onStart();
            }
            // Start a keep-alive interval to prevent speech from being cut off.
            if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
            keepAliveIntervalRef.current = window.setInterval(() => {
                // This is a workaround for a browser bug where speech synthesis can randomly stop.
                // Periodically calling resume() keeps the connection active.
                if (synth.speaking) {
                    synth.resume();
                }
            }, 10000); // A 10-second interval is a safe value.
        };

        utterance.onend = () => {
            // Clear the keep-alive interval once speech is finished.
            if (keepAliveIntervalRef.current) {
                clearInterval(keepAliveIntervalRef.current);
                keepAliveIntervalRef.current = null;
            }
            // Check if this is the currently active utterance before clearing state.
            if (speakingIdRef.current === id) {
                setSpeakingId(null);
            }
        };

        utterance.onerror = (e) => {
            // Also clear the interval on error.
            if (keepAliveIntervalRef.current) {
                clearInterval(keepAliveIntervalRef.current);
                keepAliveIntervalRef.current = null;
            }
            if (e.error !== 'canceled' && e.error !== 'interrupted') {
                console.error("SpeechSynthesis Error:", e.error);
            }
            // Ensure state is cleared on error as well.
            if (speakingIdRef.current === id) {
                setSpeakingId(null);
            }
        };
      
        synth.speak(utterance);
    }, 100); // 100ms delay is safer for preventing the race condition.
    
  }, [isReady, voices, cancel]); // `speak` is now stable as it doesn't depend on `speakingId`
  
  return { speak, cancel, speakingId, isSupported, isReady };
};

export default useTextToSpeech;