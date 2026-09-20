import { useState, useRef, useCallback, useEffect } from "react";
import { triggerHaptic } from "./useHaptic";

// Web Speech API interface declarations for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as unknown as IWindow;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (onTranscript: (text: string, isFinal: boolean) => void) => {
      if (typeof window === "undefined") return;

      const win = window as unknown as IWindow;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn("Speech Recognition no está soportado en este navegador");
        return;
      }

      // Stop any existing session
      stopListening();

      try {
        triggerHaptic([20, 30]);
        const recognition = new SpeechRecognition();
        recognition.lang = "es-ES";
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          const currentText = finalTranscript || interimTranscript;
          if (currentText) {
            onTranscript(currentText, Boolean(finalTranscript));
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          stopListening();
        };

        recognition.onend = () => {
          setIsListening(false);
          recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("Error starting speech recognition:", err);
        stopListening();
      }
    },
    [stopListening]
  );

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
}
