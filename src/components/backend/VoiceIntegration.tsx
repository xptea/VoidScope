import { useState, useEffect, useCallback } from 'react';

// Type definitions for Web Speech API
declare global {
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
    onaudiostart: () => void;
    onaudioend: () => void;
    onspeechstart: () => void;
    onspeechend: () => void;
  }

  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
  }

  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
  }
}

interface VoiceIntegrationProps {
  onAddCard: (title: string, listTitle?: string) => void;
  onAddList: (title: string) => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
}

export const VoiceIntegration: React.FC<VoiceIntegrationProps> = ({
  onAddCard,
  onAddList,
  isListening,
  setIsListening
}) => {
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showInitialGuide, setShowInitialGuide] = useState(true);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const [pendingCardTitle, setPendingCardTitle] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number, type: 'success' | 'error' | 'warning', message: string }>>([]);

  // Function to add a toast
  const addToast = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    const id = Date.now();
    setToasts(prev => [{ id, type, message }, ...prev]);
    // Auto-remove toast after duration (warning lasts longer)
    const duration = type === 'warning' ? 10000 : 5000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  // Function to remove a toast manually
  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const processCommand = useCallback((text: string) => {
    setIsProcessing(true);
    
    // If waiting for column name for a pending card, treat current text as column name
    if (pendingCardTitle) {
      const columnName = text.trim();
      if (columnName) {
        onAddCard(pendingCardTitle, columnName);
        addToast('success', `Added card "${pendingCardTitle}" to column "${columnName}"`);
        setPendingCardTitle(null);
        setTranscript(''); // Clear transcript after processing
        if (recognition) {
          recognition.start();
        }
        setIsProcessing(false);
        return true;
      } else {
        addToast('error', 'Please specify a valid column name.');
        if (recognition) {
          recognition.start();
        }
        setIsProcessing(false);
        return false;
      }
    }

    const cleanCommandText = (text: string) => text.replace(/[.,!?]/g, '').trim();
    const command = cleanCommandText(text);
    
    const specificCardPattern = /add(?: a)? card called ([\w\s]+?) in(?: the)? ([\w\s]+?)(?: column)?$/i;
    
    const cardWithColumnPattern = /(?:add|create|make)(?: a)?(?: new)? card(?: called)? ([\w\s]+?)(?: (?:in|to|on)(?: the)?)? ([\w\s]+?)(?:\s*(?:column|list))?$/i;
    
    const specificMatch = command.match(specificCardPattern);
    if (specificMatch && specificMatch[1] && specificMatch[2]) {
      const cardTitle = specificMatch[1].trim();
      const columnTitle = specificMatch[2].trim();
      onAddCard(cardTitle, columnTitle);
      addToast('success', `Added card "${cardTitle}" to column "${columnTitle}"`);
      setTranscript('');
      setIsProcessing(false);
      return true;
    }
    
    // Then try more flexible pattern
    const match = command.match(cardWithColumnPattern);
    if (match && match[1] && match[2]) {
      const cardTitle = match[1].trim();
      const columnTitle = match[2].trim();
      onAddCard(cardTitle, columnTitle);
      addToast('success', `Added card "${cardTitle}" to column "${columnTitle}"`);
      setTranscript(''); // Clear transcript after processing
      setIsProcessing(false);
      return true;
    }
    
    // If no match, try parsing as a card without column
    const cardOnlyPattern = /(?:add|create|make)(?: a)?(?: new)? card(?: called)? ([\w\s]+)$/i;
    const cardMatch = command.match(cardOnlyPattern);
    if (cardMatch && cardMatch[1]) {
      const cardTitle = cardMatch[1].trim();
      setPendingCardTitle(cardTitle);
      addToast('warning', `What column would you like the card "${cardTitle}" to go into?`);
      setTranscript(''); // Clear transcript after processing
      if (recognition) {
        recognition.start();
      }
      setIsProcessing(false);
      return true;
    }
    
    // Try column creation pattern
    const columnPattern = /(?:add|create|make)(?: a)?(?: new)? (?:column|list)(?: called)? ([\w\s]+)$/i;
    const columnMatch = command.match(columnPattern);
    if (columnMatch && columnMatch[1]) {
      const columnTitle = columnMatch[1].trim();
      onAddList(columnTitle);
      addToast('success', `Created column "${columnTitle}"`);
      setTranscript(''); // Clear transcript after processing
      setIsProcessing(false);
      return true;
    }

    // No matches found
    addToast('error', 'Command not recognized. Try saying "add card [title] in [column]"');
    setIsProcessing(false);
    return false;
  }, [onAddCard, onAddList, pendingCardTitle, recognition, addToast]);

  // Method to process current transcript immediately
  const processCurrentTranscript = useCallback(() => {
    if (transcript) {
      const success = processCommand(transcript);
      if (success) {
        setTranscript('');
      }
    }
  }, [transcript, processCommand]);

  // Expose the method to parent
  useEffect(() => {
    const element = document.querySelector('voice-integration');
    if (element) {
      (element as any).processCurrentTranscript = processCurrentTranscript;
    }
  }, [processCurrentTranscript]);

  useEffect(() => {
    // Polyfill for older browsers
    if (navigator.mediaDevices === undefined) {
      (navigator as any).mediaDevices = {};
    }

    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function(constraints) {
        const getUserMedia = (navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia;

        if (!getUserMedia) {
          return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
        }

        return new Promise((resolve, reject) => {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      };
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      setRecognition(recognitionInstance);
    } else {
      setErrorMessage('Speech Recognition is not supported in this browser');
      setIsListening(false);
    }
  }, [setIsListening]);

  useEffect(() => {
    if (!recognition) return;

    const requestMicrophonePermission = async () => {
      // Check if MediaDevices API is supported
      if (!navigator?.mediaDevices?.getUserMedia) {
        setErrorMessage('Microphone access is not supported in this browser');
        setHasPermission(false);
        setIsListening(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        setErrorMessage(null);
        if (isListening) {
          try {
            await recognition.start();
          } catch (err) {
            setErrorMessage('Failed to start voice recognition');
          }
        }
      } catch (error) {
        setErrorMessage('Please allow microphone access to use voice commands');
        setHasPermission(false);
        setIsListening(false);
      }
    };

    if (isListening && !hasPermission) {
      requestMicrophonePermission();
    } else if (isListening && hasPermission) {
      try {
        recognition.start();
      } catch (err) {
        // Handle the case where recognition is already started
        if ((err as Error).message !== 'Failed to execute \'start\' on \'SpeechRecognition\': recognition has already started.') {
          console.error('Failed to start recognition:', err);
          setIsListening(false);
        }
      }
    } else {
      try {
        recognition.stop();
      } catch (err) {
        console.error('Failed to stop recognition:', err);
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = Array.from(event.results)
        .map(result => (result as any)[0].transcript)
        .join(' ');
      
      setTranscript(text);
      setIsSpeaking(true);
      
      // Only process if it's the final result
      if ((event.results[event.results.length - 1] as any).isFinal) {
        setIsSpeaking(false);
        // Clear any existing inactivity timer
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
          setInactivityTimer(null);
        }
        processCommand(text);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setHasPermission(false);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening && hasPermission) {
        try {
          recognition.start();
        } catch (err) {
          console.error('Failed to restart recognition:', err);
          setIsListening(false);
        }
      }
    };

    recognition.onaudiostart = () => {
      setIsSpeaking(false);
    };

    recognition.onaudioend = () => {
      setIsSpeaking(false);
    };

    recognition.onspeechstart = () => {
      setIsSpeaking(true);
    };

    recognition.onspeechend = () => {
      setIsSpeaking(false);
    };

    return () => {
      try {
        recognition.stop();
      } catch (err) {
        console.error('Failed to stop recognition on cleanup:', err);
      }
    };
  }, [recognition, isListening, hasPermission, processCommand, setIsListening, inactivityTimer]);

  // Remove the inactivity timer effect since we're handling processing in onresult
  useEffect(() => {
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [inactivityTimer]);

  useEffect(() => {
    if (isListening && showInitialGuide) {
      const timer = setTimeout(() => {
        setShowInitialGuide(false);
      }, 5000); // Hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isListening, showInitialGuide]);

  return (
    <>
      {errorMessage && (
        <div className="fixed bottom-36 right-4 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-md text-sm">
          {errorMessage}
        </div>
      )}
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`fixed right-4 bg-opacity-10 border px-4 py-2 rounded-md text-sm transition-all
                    ${toast.type === 'success' ? 'bg-green-500 border-green-500 text-green-500' : ''}
                    ${toast.type === 'error' ? 'bg-red-500 border-red-500 text-red-500' : ''}
                    ${toast.type === 'warning' ? 'bg-yellow-500 border-yellow-500 text-yellow-500' : ''}`}
          style={{ bottom: `${140 + (60 * index)}px` }}
        >
          <div className="flex items-center justify-between">
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-sm underline hover:text-opacity-80"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
      {/* Voice input feedback always at bottom */}
      {isListening && showInitialGuide && !transcript && !errorMessage && !toasts.length && (
        <div className="fixed bottom-4 right-4 bg-blue-500/10 border border-blue-500/20 text-blue-500 px-4 py-2 rounded-md text-sm max-w-md animate-fade-in z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span>Try saying "add card Info in Test column" or "add new card My Task"</span>
          </div>
        </div>
      )}
      {isListening && transcript && (
        <div className="fixed bottom-4 right-4 bg-blue-500/10 border border-blue-500/20 text-blue-500 px-4 py-2 rounded-md text-sm max-w-md z-50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isProcessing ? 'bg-yellow-500 animate-pulse'
              : isSpeaking ? 'bg-green-500 animate-ping'
              : 'bg-blue-500'
            }`} />
            <span>{transcript}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceIntegration;