// Accessibility Audio Assistant for VIVA+

let activeUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    try {
      cachedVoices = window.speechSynthesis.getVoices();
    } catch {}
  };
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isSpeaking(): boolean {
  if (!isSpeechSupported()) return false;
  return window.speechSynthesis.speaking;
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
      activeUtterance = null;
    } catch (e) {
      console.warn('Erro ao interromper áudio:', e);
    }
  }
}

export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  rate = 0.9
): void {
  if (!isSpeechSupported()) {
    console.warn('Leitura de voz não suportada pelo navegador.');
    if (onEnd) onEnd();
    return;
  }

  stopSpeaking();
  if (!text || text.trim() === '') {
    if (onEnd) onEnd();
    return;
  }

  const cleanText = text
    .replace(/[#*_`]/g, '')
    .replace(/https?:\/\/\S+/g, 'link de internet')
    .replace(/\s+/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'pt-BR';
  utterance.rate = rate;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Select natural Brazilian Portuguese voice if available
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  const ptVoice =
    voices.find((v) => v.lang === 'pt-BR' || v.lang === 'pt_BR') ||
    voices.find((v) => v.lang.startsWith('pt')) ||
    voices.find((v) => v.name.toLowerCase().includes('brazil') || v.name.toLowerCase().includes('portuguese'));

  if (ptVoice) {
    utterance.voice = ptVoice;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    activeUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    // 'canceled' or 'interrupted' errors are normal when the user stops audio
    if (e.error !== 'canceled' && e.error !== 'interrupted') {
      console.warn('Aviso na síntese de voz:', e.error);
    }
    activeUtterance = null;
    if (onEnd) onEnd();
  };

  // Retain global reference to avoid V8 garbage collection dropping utterance
  activeUtterance = utterance;

  // Chromium workaround: ensure synthesis is not paused before speaking
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Falha ao executar speak():', err);
        activeUtterance = null;
        if (onEnd) onEnd();
      }
    }, 20);
  } catch (e) {
    console.error('Falha ao acionar voz:', e);
    activeUtterance = null;
    if (onEnd) onEnd();
  }
}
