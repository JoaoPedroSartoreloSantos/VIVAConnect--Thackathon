/**
 * Universal Voice Dictation & Speech-to-Text Manager for VIVA+
 *
 * Supports mobile and desktop across all modern browsers:
 * 1. Concurrently captures audio via MediaRecorder from getUserMedia.
 * 2. Attempts native Web Speech API (webkitSpeechRecognition) when available.
 *    If native recognition succeeds, delivers instantaneous results.
 * 3. If native recognition is unavailable or errors (common in iframes, Firefox, etc.),
 *    the recorded audio is sent to the server for high-precision Gemini Audio Transcription.
 */

import { stopSpeaking } from './speech';

export interface VoiceListenerOptions {
  onStart?: () => void;
  onTranscript: (text: string) => void;
  onError?: (errorMessage: string) => void;
  onEnd?: () => void;
  maxDurationSeconds?: number;
}

export class UniversalVoiceListener {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recognition: any = null;
  private nativeTranscript = '';
  private isListening = false;
  private hasDeliveredTranscript = false;
  private autoStopTimer: any = null;
  private options: VoiceListenerOptions;

  constructor(options: VoiceListenerOptions) {
    this.options = options;
  }

  public async start(): Promise<void> {
    // 1. Immediately cancel active speech synthesis to prevent feedback loop into mic
    stopSpeaking();
    this.hasDeliveredTranscript = false;
    this.nativeTranscript = '';
    this.audioChunks = [];

    // 2. Request microphone permission via getUserMedia with port/device fallback
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Acesso ao microfone não suportado neste navegador.');
      }

      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: true,
          },
        });
      } catch (advancedAudioErr) {
        // Fallback for simple audio ports, USB headsets, or basic mobile devices
        console.warn('Fallback para microfone padrão:', advancedAudioErr);
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      }
    } catch (err: any) {
      console.error('Erro de permissão do microfone/porta de áudio:', err);
      let message = 'Permissão de microfone não concedida.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Acesso ao microfone negado. Por favor, autorize o microfone nas configurações do navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'Nenhum microfone ou porta de áudio foi encontrada conectada a este aparelho.';
      }
      if (this.options.onError) this.options.onError(message);
      if (this.options.onEnd) this.options.onEnd();
      return;
    }

    this.isListening = true;
    if (this.options.onStart) this.options.onStart();

    // 3. Setup MediaRecorder
    let mimeType = '';
    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/aac')) {
        mimeType = 'audio/aac';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
    }

    try {
      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, recorderOptions);
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      // Collect chunks every 250ms
      this.mediaRecorder.start(250);
    } catch (recErr) {
      console.warn('MediaRecorder falhou na inicialização:', recErr);
    }

    // 4. Try native Web Speech API in parallel
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.lang = 'pt-BR';
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onresult = (event: any) => {
          let accumulated = '';
          for (let i = 0; i < event.results.length; i++) {
            const transcript = event.results[i]?.[0]?.transcript?.trim();
            if (transcript) {
              accumulated += (accumulated ? ' ' : '') + transcript;
            }
          }

          if (accumulated) {
            this.nativeTranscript = accumulated;
          }
        };

        rec.onerror = (e: any) => {
          // In iframes, Chrome regularly emits 'network' error for SpeechRecognition.
          // We DO NOT abort here: MediaRecorder continues recording audio for Gemini!
          console.warn('SpeechRecognition nativo emitiu aviso/erro (usando gravação via IA):', e.error);
        };

        rec.onend = () => {
          // If native ended naturally but user is still recording, we do NOT stop the recording!
          // The user will tap stop or the auto-timer will handle it.
        };

        this.recognition = rec;
        rec.start();
      } catch (recStartErr) {
        console.warn('SpeechRecognition nativo não pôde iniciar, mantendo gravação direta:', recStartErr);
      }
    }

    // 5. Max recording duration safety timer (defaults to 25 seconds)
    const maxSec = this.options.maxDurationSeconds || 25;
    this.autoStopTimer = setTimeout(() => {
      if (this.isListening) {
        this.stop();
      }
    }, maxSec * 1000);
  }

  public async stop(): Promise<void> {
    if (!this.isListening) return;
    this.isListening = false;

    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }

    // Stop native recognition
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }

    // Stop MediaRecorder and wait for the last chunk
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        if (!this.mediaRecorder) return resolve();
        this.mediaRecorder.onstop = () => resolve();
        try {
          this.mediaRecorder.stop();
        } catch {
          resolve();
        }
        // Fallback safety resolve in case onstop doesn't fire
        setTimeout(resolve, 500);
      });
    }

    // Stop microphone stream tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // If native speech recognition captured meaningful text, use it!
    if (this.nativeTranscript && this.nativeTranscript.trim().length >= 2) {
      this.hasDeliveredTranscript = true;
      this.options.onTranscript(this.nativeTranscript.trim());
      if (this.options.onEnd) this.options.onEnd();
      return;
    }

    // If native already delivered earlier, complete
    if (this.hasDeliveredTranscript) {
      if (this.options.onEnd) this.options.onEnd();
      return;
    }

    // If native did not deliver, transcribe recorded audio via Gemini
    if (this.audioChunks.length === 0) {
      if (this.options.onError) {
        this.options.onError('Não foi possível capturar o som da sua fala. Fale mais alto perto do aparelho ou digite sua dúvida.');
      }
      if (this.options.onEnd) this.options.onEnd();
      return;
    }

    try {
      const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });

      // If audio is under 400 bytes, it's likely just an accidental tap
      if (audioBlob.size < 400) {
        if (this.options.onError) {
          this.options.onError('Gravação muito curta. Toque no botão de falar e diga o que você precisa.');
        }
        if (this.options.onEnd) this.options.onEnd();
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Audio = reader.result as string;
          const res = await fetch('/api/gemini/transcribe-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType,
            }),
          });

          if (!res.ok) {
            throw new Error('Falha no servidor de transcrição.');
          }

          const data = await res.json();
          const transcript = (data.transcript || '').trim();

          if (transcript) {
            this.hasDeliveredTranscript = true;
            this.options.onTranscript(transcript);
          } else {
            if (this.options.onError) {
              this.options.onError('Não foi possível identificar palavras no áudio. Fale mais alto ou digite no campo de texto.');
            }
          }
        } catch (serverErr) {
          console.error('Erro ao transcrever com Gemini:', serverErr);
          if (this.options.onError) {
            this.options.onError('Não foi possível processar a voz no momento. Você pode digitar sua mensagem com calma no campo.');
          }
        } finally {
          if (this.options.onEnd) this.options.onEnd();
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (e: any) {
      console.error('Erro ao processar blob de áudio:', e);
      if (this.options.onError) {
        this.options.onError('Erro ao finalizar áudio do microfone. Tente novamente.');
      }
      if (this.options.onEnd) this.options.onEnd();
    }
  }

  public cancel(): void {
    this.isListening = false;
    this.hasDeliveredTranscript = true; // prevent transcript delivery
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.options.onEnd) this.options.onEnd();
  }
}
