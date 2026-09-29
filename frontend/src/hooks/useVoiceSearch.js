import { useState, useCallback, useRef, useEffect } from 'react';

/** Chromium often exposes only webkit prefix */
export function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.webkitSpeechRecognition || window.SpeechRecognition || null;
}

function describeSpeechError(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Mic block hai — address bar ke 🔒 se Microphone Allow karein.';
    case 'no-speech':
      return 'Kuch sunai nahi diya — dubara mic dabao aur zor se bolo.';
    case 'audio-capture':
      return 'Mic capture fail — koi aur app mic use kar rahi ho sakti hai.';
    case 'network':
      return 'Internet check karein — voice Google servers par jaata hai.';
    case 'aborted':
      return '';
    default:
      return `Voice error: ${code}`;
  }
}

/**
 * @param {string} lang — 'hi-IN' | 'en-IN' etc.
 * @param {(text: string) => void} onTranscript
 */
export function useVoiceSearch(lang, onTranscript, onError) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    setSupported(!!getSpeechRecognitionCtor());
  }, []);

  const stop = useCallback(() => {
    const r = recRef.current;
    recRef.current = null;
    if (!r) {
      setListening(false);
      return;
    }
    try {
      r.onresult = null;
      r.onerror = null;
      r.onend = null;
      r.stop();
    } catch {
      try {
        r.abort();
      } catch {
        /* noop */
      }
    }
    setListening(false);
  }, []);

  const start = useCallback(async () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    stop();

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch {
      onErrorRef.current?.('Mic permission nahi mili — browser settings me Allow karein.');
      return;
    }

    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let full = '';
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
        if (i < event.results.length - 1) full += ' ';
      }
      const text = full.trim();
      if (text) onTranscriptRef.current(text);
    };

    rec.onerror = (e) => {
      const msg = describeSpeechError(e.error);
      if (msg) onErrorRef.current?.(msg);
      setListening(false);
      recRef.current = null;
    };

    rec.onend = () => {
      setListening(false);
      recRef.current = null;
    };

    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch (err) {
      setListening(false);
      onErrorRef.current?.(
        err?.message || 'Mic start nahi ho paya — Chrome / Edge try karein, HTTPS ya localhost par.'
      );
    }
  }, [lang, stop]);

  useEffect(
    () => () => {
      const r = recRef.current;
      recRef.current = null;
      if (r) {
        try {
          r.stop();
        } catch {
          try {
            r.abort();
          } catch {
            /* noop */
          }
        }
      }
    },
    []
  );

  return { listening, supported, start, stop };
}
