import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export type VoiceCommand = 
  | 'capture' 
  | 'add' 
  | 'details' 
  | 'cart' 
  | 'help' 
  | 'start' 
  | 'stop'
  | 'undo';

interface UseVoiceCommandsOptions {
  onCommand?: (command: VoiceCommand) => void;
  onCapture?: () => void;
  onAdd?: () => void;
  onDetails?: () => void;
  onCart?: () => void;
  onHelp?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  onUndo?: () => void;
}

export function useVoiceCommands(options: UseVoiceCommandsOptions = {}) {
  const { speak, announce } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRestartRef = useRef(false);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  // Process command from text (can be from voice or manual input)
  const processCommand = useCallback((transcript: string): VoiceCommand | null => {
    const lowerTranscript = transcript.toLowerCase().trim();
    console.log('Processing command:', lowerTranscript);
    
    // Command matching with variations
    const commands: { patterns: string[]; command: VoiceCommand; handler?: () => void }[] = [
      { patterns: ['capture', 'take photo', 'snap', 'photograph', 'picture', 'scan'], command: 'capture', handler: options.onCapture },
      { patterns: ['add', 'add to cart', 'add item', 'buy', 'purchase'], command: 'add', handler: options.onAdd },
      { patterns: ['details', 'more info', 'information', 'tell me more', 'what is this', 'info'], command: 'details', handler: options.onDetails },
      { patterns: ['cart', 'go to cart', 'view cart', 'shopping cart', 'my cart', 'checkout'], command: 'cart', handler: options.onCart },
      { patterns: ['help', 'assist', 'assistance', 'tutorial', 'guide'], command: 'help', handler: options.onHelp },
      { patterns: ['start', 'start camera', 'open camera', 'begin', 'camera on'], command: 'start', handler: options.onStart },
      { patterns: ['stop', 'stop camera', 'close camera', 'end', 'camera off'], command: 'stop', handler: options.onStop },
      { patterns: ['undo', 'cancel', 'remove last', 'go back', 'revert'], command: 'undo', handler: options.onUndo },
    ];

    for (const { patterns, command, handler } of commands) {
      if (patterns.some(pattern => lowerTranscript.includes(pattern))) {
        setLastCommand(command);
        announce(`Command: ${command}`);
        
        console.log(`Executing command: ${command}`);
        
        if (handler) {
          handler();
        }
        
        if (options.onCommand) {
          options.onCommand(command);
        }
        
        return command;
      }
    }

    // No command recognized
    announce('Unknown command. Try: capture, add, cart, help.');
    return null;
  }, [options, announce]);

  // Execute command directly (for manual input or testing)
  const executeCommand = useCallback((command: string) => {
    return processCommand(command);
  }, [processCommand]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      speak('Voice commands are not supported in this browser. Use the text input instead.');
      return;
    }

    // Reset error count when manually starting
    setErrorCount(0);
    shouldRestartRef.current = true;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setErrorCount(0);
      announce('Voice commands activated. Say a command.');
    };

    recognition.onend = () => {
      // Only restart if we should be listening and haven't had too many errors
      if (shouldRestartRef.current && recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch (e) {
          console.log('Recognition ended, not restarting');
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex];
      if (result.isFinal) {
        const transcript = result[0].transcript;
        console.log('Voice transcript:', transcript);
        processCommand(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        speak('Microphone permission denied. Please allow microphone access in your browser settings.');
        shouldRestartRef.current = false;
        setIsListening(false);
      } else if (event.error === 'network') {
        setErrorCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            speak('Voice recognition unavailable. Please use the text command input below.');
            shouldRestartRef.current = false;
            setIsListening(false);
          }
          return newCount;
        });
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.log(`Voice error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      speak('Could not start voice recognition. Please use text commands.');
    }
  }, [isSupported, speak, announce, processCommand]);

  // Stop listening
  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      try {
        recognition.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
      setIsListening(false);
      announce('Voice commands deactivated.');
    }
  }, [announce]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    lastCommand,
    startListening,
    stopListening,
    toggleListening,
    executeCommand,
  };
}
