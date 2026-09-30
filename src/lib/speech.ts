interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal?: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createSpeechRecognizer(
  onTranscript: (text: string, isFinal: boolean) => void,
  onStatusChange: (isListening: boolean) => void,
  onError: (errMsg: string) => void
): { start: () => void; stop: () => void } | null {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechClass) return null;

  const recognition = new SpeechClass();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interim = "";
    let final = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    if (final) {
      onTranscript(final, true);
    } else if (interim) {
      onTranscript(interim, false);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    onStatusChange(false);
    onError(`Speech error: ${event.error}`);
  };

  recognition.onend = () => {
    onStatusChange(false);
  };

  return {
    start: () => {
      try {
        recognition.start();
        onStatusChange(true);
      } catch (err) {
        console.warn("Speech recognition already active or error:", err);
      }
    },
    stop: () => {
      try {
        recognition.stop();
        onStatusChange(false);
      } catch (err) {
        console.warn("Error stopping speech recognition:", err);
      }
    },
  };
}
