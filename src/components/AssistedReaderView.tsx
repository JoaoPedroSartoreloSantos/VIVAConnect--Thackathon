import React, { useState, useRef, useEffect } from 'react';
import {
  ScanText,
  Camera,
  Upload,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Sparkles,
  Info,
  RotateCcw,
  Trash2,
  Check,
  Eye,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  X,
  FileText,
  Mic,
  Clock,
  PlusCircle,
  FileCheck2,
  RefreshCw,
  Pill,
} from 'lucide-react';
import {
  ActiveTab,
  AccessibilitySettings,
  MedicationReminder,
  OcrPrescriptionResult,
  StructuredExplanation,
} from '../types';
import { speakText, stopSpeaking } from '../utils/speech';
import { UniversalVoiceListener } from '../utils/audioRecorder';

interface AssistedReaderViewProps {
  onNavigate?: (tab: ActiveTab) => void;
  onAddMedication?: (med: MedicationReminder) => void;
  settings?: AccessibilitySettings;
}

type ReaderSubMode = 'menu' | 'camera' | 'text';

export const AssistedReaderView: React.FC<AssistedReaderViewProps> = ({
  onNavigate,
  onAddMedication,
  settings,
}) => {
  const [subMode, setSubMode] = useState<ReaderSubMode>('menu');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showCameraPermissionModal, setShowCameraPermissionModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directCameraInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OcrPrescriptionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isEditingText, setIsEditingText] = useState(false);
  const [editableText, setEditableText] = useState('');

  const [showExplanation, setShowExplanation] = useState(false);
  const [explainingText, setExplainingText] = useState(false);
  const [textExplanationResult, setTextExplanationResult] = useState<StructuredExplanation | null>(null);
  const [textSpeechBundle, setTextSpeechBundle] = useState<any>(null);

  const [customText, setCustomText] = useState('');
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [isProcessingMic, setIsProcessingMic] = useState(false);
  const [micPendingPhrase, setMicPendingPhrase] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const micListenerRef = useRef<UniversalVoiceListener | null>(null);

  const [activeSpeechSection, setActiveSpeechSection] = useState<string | null>(null);

  const [reminderMedicine, setReminderMedicine] = useState('');
  const [reminderDosage, setReminderDosage] = useState('');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [reminderNotes, setReminderNotes] = useState('');
  const [reminderConfirmedByUser, setReminderConfirmedByUser] = useState(false);
  const [reminderSavedSuccess, setReminderSavedSuccess] = useState(false);

  useEffect(() => {
    return () => {
      stopCamera();
      stopSpeaking();
    };
  }, []);

  // Ensure camera stream attaches to video element as soon as it mounts in the DOM
  useEffect(() => {
    if (subMode === 'camera' && cameraStream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = cameraStream;
      video.onloadedmetadata = () => {
        video.play().catch((err) => console.warn('Aviso play onloadedmetadata:', err));
      };
      video.play().catch((err) => console.warn('Aviso play direto:', err));
    }
  }, [subMode, cameraStream]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const handleOpenPromptCamera = () => {
    setShowCameraPermissionModal(true);
    speakText(
      'Para fotografar a receita ou caixa de remédio, certifique-se de estar em um local bem iluminado, enquadre o texto no centro e mantenha o celular firme sem tremer.'
    );
  };

  const handleStartCamera = async () => {
    setShowCameraPermissionModal(false);
    setCameraError(null);
    setSubMode('camera');
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
        });
      } catch {
        // Fallback para computadores, notebooks ou webcams simples sem câmera traseira
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error);
          };
          videoRef.current.play().catch((err) => {
            console.error('Erro ao reproduzir stream da câmera:', err);
          });
        }
      }, 100);
      speakText('Câmera aberta. Aponte para a caixa ou receita e toque em Tirar foto agora.');
    } catch (err: any) {
      console.error('Erro de permissão da câmera:', err);
      let msg =
        'Não foi possível acessar a câmera deste aparelho. Verifique se a permissão foi concedida ou use o botão Escolher uma foto.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg =
          'Permissão de câmera não concedida. Você pode autorizar nas configurações do navegador ou selecionar uma foto da galeria.';
      }
      setCameraError(msg);
      speakText(msg);
      setSubMode('menu');
    }
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Use video dimensions, or active track settings, or high-res standard default
    const track = cameraStream?.getVideoTracks()[0];
    const trackSettings = track?.getSettings();
    const captureWidth = video.videoWidth || trackSettings?.width || 1280;
    const captureHeight = video.videoHeight || trackSettings?.height || 720;

    canvas.width = captureWidth;
    canvas.height = captureHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      ctx.drawImage(video, 0, 0, captureWidth, captureHeight);
    } catch (drawErr) {
      console.warn('Aviso ao capturar quadro do vídeo:', drawErr);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCamera();
    setSelectedImage(dataUrl);
    setMimeType('image/jpeg');
    setResult(null);
    setErrorMsg(null);
    setPrivacyAgreed(true);
    setSubMode('menu');
    speakText('Foto do remédio capturada. Escaneando nome, dosagem e bula com inteligência artificial...');
    await executeProcessOCR(dataUrl, 'image/jpeg');
  };

  const handleCancelCamera = () => {
    stopCamera();
    setSubMode('menu');
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fType = file.type || 'image/jpeg';
    setMimeType(fType);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setSelectedImage(dataUrl);
      setResult(null);
      setErrorMsg(null);
      setPrivacyAgreed(true);
      setSubMode('menu');
      speakText('Foto do remédio carregada. Escaneando e analisando com inteligência artificial...');
      await executeProcessOCR(dataUrl, fType);
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = () => {
    setSelectedImage(null);
    setResult(null);
    setErrorMsg(null);
    setIsEditingText(false);
    setEditableText('');
    setShowExplanation(false);
    setReminderSavedSuccess(false);
    stopSpeaking();
    speakText('Foto e texto apagados da memória com segurança.');
  };

  const executeProcessOCR = async (imageBase64: string, imageMime: string) => {
    if (!imageBase64) return;
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    stopSpeaking();
    try {
      const response = await fetch('/api/gemini/ocr-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: imageMime || 'image/jpeg',
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha no processamento da imagem do remédio.');
      }
      const data: OcrPrescriptionResult = await response.json();
      setResult(data);
      setEditableText(data.recognizedText);

      if (data.suggestedReminder?.hasReminder) {
        setReminderMedicine(data.suggestedReminder.medicineName || data.medicineName || '');
        setReminderDosage(data.suggestedReminder.dosage || data.dosageAndForm || '');
        setReminderTime(data.suggestedReminder.time || '08:00');
        setReminderNotes(data.suggestedReminder.notes || data.instructions || '');
        setReminderConfirmedByUser(false);
      }

      let speech = '';
      if (data.medicineName) {
        speech = `Remédio identificado: ${data.medicineName}. `;
        if (data.dosageAndForm) speech += `Dosagem: ${data.dosageAndForm}. `;
        if (data.instructions) speech += `Instruções: ${data.instructions}. `;
      } else if (data.isLegible) {
        speech = 'Remédio escaneado com sucesso. O texto completo está na tela.';
      } else {
        speech = `Aviso: ${data.qualityAdvice || 'A foto não ficou totalmente nítida. Aproxime mais a câmera da caixa.'}`;
      }
      speakText(speech);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message ||
          'Não foi possível analisar a imagem. Verifique se a foto está focada e com boa iluminação.'
      );
      speakText('Não foi possível ler o texto. Tente fotografar novamente em um local bem iluminado.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessOCR = async () => {
    if (!selectedImage) {
      setErrorMsg('Por favor, tire uma foto ou selecione uma imagem primeiro.');
      return;
    }
    await executeProcessOCR(selectedImage, mimeType);
  };

  const handleSpeak = (text: string, sectionId?: string) => {
    if (activeSpeechSection === sectionId) {
      stopSpeaking();
      setActiveSpeechSection(null);
      return;
    }
    setActiveSpeechSection(sectionId || 'main');
    speakText(
      text,
      () => {},
      () => setActiveSpeechSection(null)
    );
  };

  const handleStartMic = async () => {
    setMicError(null);
    setMicPendingPhrase(null);
    stopSpeaking();

    const listener = new UniversalVoiceListener({
      onStart: () => {
        setIsListeningMic(true);
        setIsProcessingMic(false);
        setMicError(null);
      },
      onTranscript: (transcript: string) => {
        setIsListeningMic(false);
        setIsProcessingMic(false);
        if (transcript) {
          setMicPendingPhrase(transcript);
          speakText(`O microfone entendeu: ${transcript}. Toque em Confirmar para inserir no texto.`);
        }
      },
      onError: (err: string) => {
        setIsListeningMic(false);
        setIsProcessingMic(false);
        setMicError(err);
        speakText(err);
      },
      onEnd: () => {
        setIsListeningMic(false);
        setIsProcessingMic(false);
      },
    });

    micListenerRef.current = listener;
    await listener.start();
  };

  const handleStopMic = async () => {
    if (micListenerRef.current) {
      setIsProcessingMic(true);
      await micListenerRef.current.stop();
    } else {
      setIsListeningMic(false);
      setIsProcessingMic(false);
    }
  };

  const handleConfirmMicPhrase = () => {
    if (!micPendingPhrase) return;
    setCustomText((prev) => (prev ? `${prev} ${micPendingPhrase}` : micPendingPhrase));
    setMicPendingPhrase(null);
    speakText('Texto inserido com sucesso.');
  };

  const handleExplainCustomText = async () => {
    if (!customText.trim()) return;
    setExplainingText(true);
    setErrorMsg(null);
    stopSpeaking();
    try {
      const res = await fetch('/api/gemini/explain-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: customText }),
      });
      if (!res.ok) throw new Error('Falha ao gerar explicação.');
      const data = await res.json();
      setTextExplanationResult(data.explanation);
      setTextSpeechBundle(data.speechTexts);
      if (data.suggestedReminder?.hasReminder) {
        setReminderMedicine(data.suggestedReminder.medicineName || '');
        setReminderDosage(data.suggestedReminder.dosage || '');
        setReminderTime(data.suggestedReminder.time || '08:00');
        setReminderNotes(data.suggestedReminder.notes || '');
        setReminderConfirmedByUser(false);
      }
      speakText('Explicação gerada com sucesso. Veja abaixo em três partes claras.');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Não foi possível gerar a explicação no momento.');
    } finally {
      setExplainingText(false);
    }
  };

  const handleSaveReminder = () => {
    if (!reminderConfirmedByUser) {
      speakText('Por favor, marque a caixa confirmando que conferiu com a receita original.');
      return;
    }
    if (!reminderMedicine.trim()) {
      setErrorMsg('Informe o nome do medicamento para salvar o lembrete.');
      return;
    }
    const newReminder: MedicationReminder = {
      id: `med_${Date.now()}`,
      name: reminderMedicine.trim(),
      dosage: reminderDosage.trim() || 'Conforme orientação médica',
      time: reminderTime || '08:00',
      notes: reminderNotes.trim() || 'Adicionado a partir da leitura de receita',
    };
    if (onAddMedication) {
      onAddMedication(newReminder);
    }
    setReminderSavedSuccess(true);
    speakText(`Lembrete de ${newReminder.name} salvo com sucesso em Minha Saúde.`);
  };

  return (
    <div className="space-y-4 pb-20">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Header Info */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ScanText className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                Ler e ouvir
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                Fotografe caixas de remédios, receitas e bulas ou ouça qualquer texto em voz alta.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              handleSpeak(
                'Tela Ler e ouvir. Aqui você pode fotografar um texto de receita ou remédio, escolher uma foto da galeria ou digitar um texto para ouvir em voz alta.'
              )
            }
            className="p-2 text-teal-600 hover:text-teal-800 rounded-xl"
            aria-label="Ouvir orientações da tela Ler e ouvir"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* MENU MODE */}
      {subMode === 'menu' && !selectedImage && (
        <section className="space-y-4">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={directCameraInputRef}
            onChange={handleImageFileChange}
            className="hidden"
          />

          <div className="px-1 flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              O que você deseja fazer agora?
            </h3>
            <span className="text-xs font-semibold text-slate-500">Escolha uma ação:</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Primary Action 1: Native Phone Camera with Auto-focus */}
            <button
              type="button"
              onClick={() => directCameraInputRef.current?.click()}
              className="btn-contrast-solid w-full text-left bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98] text-white p-5 rounded-3xl shadow-lg border-2 border-emerald-300 flex items-center gap-4 transition group cursor-pointer"
              aria-label="Fotografar remédio com a câmera do celular"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
                <Camera className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-black leading-tight">
                    Fotografar remédio com foco automático
                  </h4>
                  <ArrowRight className="w-5 h-5 opacity-80 group-hover:translate-x-1 transition shrink-0" />
                </div>
                <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-1 leading-snug">
                  Abre a câmera do seu celular com foco nítido e flash para ler caixas, bulas e receitas.
                </p>
              </div>
            </button>

            {/* Action 2: Live Viewfinder Camera */}
            <button
              type="button"
              onClick={handleStartCamera}
              className="btn-contrast-solid w-full text-left bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white p-5 rounded-3xl shadow-md border-2 border-teal-400 flex items-center gap-4 transition group cursor-pointer"
              aria-label="Escanear com visor na tela"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
                <ScanText className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-black leading-tight">
                    Abrir visor da câmera na tela
                  </h4>
                  <ArrowRight className="w-5 h-5 opacity-80 group-hover:translate-x-1 transition shrink-0" />
                </div>
                <p className="text-xs sm:text-sm text-teal-100 font-medium mt-1 leading-snug">
                  Veja a imagem do remédio ao vivo na tela antes de capturar.
                </p>
              </div>
            </button>

            {/* Action 3: Choose from gallery */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-contrast-solid w-full text-left bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white p-5 rounded-3xl shadow-md flex items-center gap-4 transition group cursor-pointer"
              aria-label="Escolher uma foto salva na galeria"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
                <Upload className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-black leading-tight">
                    Escolher uma foto da galeria
                  </h4>
                  <ArrowRight className="w-5 h-5 opacity-80 group-hover:translate-x-1 transition shrink-0" />
                </div>
                <p className="text-xs sm:text-sm text-sky-100 font-medium mt-1 leading-snug">
                  Selecione uma imagem já salva no seu aparelho para analisar.
                </p>
              </div>
            </button>

            {/* Action 4: Text speech and explanation */}
            <button
              type="button"
              onClick={() => setSubMode('text')}
              className="btn-contrast-solid w-full text-left bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white p-5 rounded-3xl shadow-md flex items-center gap-4 transition group cursor-pointer"
              aria-label="Ouvir um texto: Digitar ou ditar no microfone"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
                <FileText className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-black leading-tight">
                    Ouvir ou ditar um texto
                  </h4>
                  <ArrowRight className="w-5 h-5 opacity-80 group-hover:translate-x-1 transition shrink-0" />
                </div>
                <p className="text-xs sm:text-sm text-indigo-100 font-medium mt-1 leading-snug">
                  Digite, cole ou dite no microfone qualquer texto para ouvir em voz alta e pedir explicação.
                </p>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* Camera Tips Modal */}
      {showCameraPermissionModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="camera-modal-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border-2 border-teal-500 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3
                  id="camera-modal-title"
                  className="text-base sm:text-lg font-black text-slate-900 dark:text-white"
                >
                  Dicas para fotografar o texto
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Siga estas 3 instruções simples para a leitura funcionar bem:
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 text-xs font-black">
                  1
                </span>
                <p>
                  <strong>Boa iluminação:</strong> Aponte a luz para o papel ou caixa e evite sombras fortes ou reflexos plásticos.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 text-xs font-black">
                  2
                </span>
                <p>
                  <strong>Enquadre por inteiro:</strong> Centralize o texto na tela para não cortar palavras nas margens.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 text-xs font-black">
                  3
                </span>
                <p>
                  <strong>Mãos firmes:</strong> Segure o celular com calma para a imagem não sair tremida ou borrada.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleStartCamera}
                className="btn-contrast-solid w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-3.5 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow"
              >
                <Camera className="w-5 h-5" />
                <span>Autorizar e abrir câmera</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCameraPermissionModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-2xl text-xs"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE CAMERA VIEWFINDER */}
      {subMode === 'camera' && (
        <section className="bg-black rounded-3xl p-4 space-y-4 shadow-xl text-white">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Enquadre a caixa ou receita na moldura:</span>
            <button
              onClick={handleCancelCamera}
              className="p-1 text-slate-400 hover:text-white rounded-lg flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span>Fechar</span>
            </button>
          </div>

          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-4 sm:inset-8 border-4 border-dashed border-teal-400 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex flex-col justify-between p-3"
              aria-label="Área de enquadramento do remédio"
            >
              <span className="text-[11px] font-black uppercase tracking-wider bg-black/80 text-teal-300 px-2 py-0.5 rounded-md self-start border border-teal-400/40">
                Posicione o remédio ou bula aqui
              </span>
              <span className="text-[11px] font-bold text-center text-slate-100 bg-black/70 py-1 px-2.5 rounded-md self-center">
                Mantenha bem iluminado e firme
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-3">
            <button
              type="button"
              onClick={handleCapturePhoto}
              className="btn-contrast-solid bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black py-4.5 px-5 rounded-2xl text-sm sm:text-base flex items-center justify-center gap-3 shadow-lg cursor-pointer"
              aria-label="Escanear remédio agora"
            >
              <ScanText className="w-6 h-6 animate-pulse shrink-0" />
              <span>Escanear remédio agora</span>
            </button>
            <button
              type="button"
              onClick={handleCancelCamera}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-4 px-5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
            >
              <span>Voltar ao menu</span>
            </button>
          </div>
        </section>
      )}

      {/* Camera Error Message */}
      {cameraError && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/80 rounded-2xl border-2 border-amber-400 text-xs text-amber-950 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-black">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Aviso de câmera</span>
          </div>
          <p>{cameraError}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-contrast-solid bg-sky-600 hover:bg-sky-700 text-white font-black py-2 px-3 rounded-xl flex items-center gap-1 shadow"
          >
            <Upload className="w-4 h-4" />
            <span>Escolher foto da galeria</span>
          </button>
        </div>
      )}

      {/* SELECTED IMAGE PREVIEW & PRIVACY NOTICE */}
      {selectedImage && !result && !loading && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-teal-500 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-teal-600" />
              <span>Foto pronta para análise</span>
            </h3>
            <button
              type="button"
              onClick={handleDeletePhoto}
              className="p-1.5 text-red-600 hover:text-red-800 text-xs font-black flex items-center gap-1"
              aria-label="Apagar esta foto da memória agora"
            >
              <Trash2 className="w-4 h-4" />
              <span>Apagar foto</span>
            </button>
          </div>

          <div className="relative max-h-60 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Foto selecionada para leitura"
              className="max-h-60 w-auto object-contain"
            />
          </div>

          <div className="p-4 bg-sky-50 dark:bg-sky-950/70 rounded-2xl border-2 border-sky-300 dark:border-sky-700 text-xs text-sky-950 dark:text-sky-200 space-y-2">
            <div className="flex items-center gap-2 font-black text-sky-900 dark:text-sky-100">
              <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0" />
              <span>Aviso de Privacidade e Segurança</span>
            </div>
            <p className="leading-relaxed font-medium">
              Esta imagem é processada temporariamente de forma segura para extrair o texto. Ela não é compartilhada e pode ser apagada a qualquer momento.
            </p>
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="font-black text-slate-900 dark:text-white">
                Compreendo e autorizo o envio para ler as palavras da foto.
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleProcessOCR}
              disabled={!privacyAgreed}
              className="btn-contrast-solid bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black py-3.5 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow"
            >
              <ScanText className="w-5 h-5" />
              <span>Ler o texto da foto</span>
            </button>
            <button
              type="button"
              onClick={handleDeletePhoto}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Escolher ou fotografar outra</span>
            </button>
          </div>
        </section>
      )}

      {/* Loading state */}
      {loading && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-teal-500 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Examinando a imagem...
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            O VIVAConnect está extraindo cada palavra com cuidado sem adivinhar dosagens.
          </p>
        </section>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/80 rounded-2xl border-2 border-red-500 text-xs text-red-900 dark:text-red-200 space-y-1">
          <strong className="block font-black">Aviso de leitura:</strong>
          <p>{errorMsg}</p>
        </div>
      )}

      {/* OCR RESULT */}
      {result && (
        <section className="space-y-4">
          {/* Medicamento Identificado em Destaque com Ícone de Remédio */}
          {result.medicineName && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-emerald-300 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full text-emerald-100 flex items-center gap-1.5 shadow-inner">
                  <Pill className="w-4 h-4 text-emerald-200" />
                  Medicamento Identificado pela Câmera
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleSpeak(
                      `Remédio identificado: ${result.medicineName}. ${result.dosageAndForm ? `Dosagem: ${result.dosageAndForm}.` : ''} ${result.instructions ? `Instruções: ${result.instructions}` : ''}`,
                      'med-ident'
                    )
                  }
                  className="bg-white hover:bg-emerald-50 text-emerald-900 px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow transition"
                >
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span>Ouvir</span>
                </button>
              </div>

              <div>
                <h4 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  {result.medicineName}
                </h4>
                {result.dosageAndForm && (
                  <p className="text-sm sm:text-base font-extrabold text-emerald-100 mt-1">
                    Dosagem: {result.dosageAndForm}
                  </p>
                )}
                {result.instructions && (
                  <p className="text-xs sm:text-sm text-teal-100 font-medium mt-1 leading-relaxed">
                    Como tomar: {result.instructions}
                  </p>
                )}
              </div>
            </div>
          )}

          {(!result.isLegible || result.qualityIssue !== 'nenhum') && (
            <div className="p-5 bg-amber-50 dark:bg-amber-950/80 rounded-3xl border-3 border-amber-500 text-amber-950 dark:text-amber-100 space-y-3">
              <div className="flex items-center gap-2 font-black text-sm sm:text-base">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                <span>Aviso de Qualidade da Imagem ({result.qualityIssue})</span>
              </div>
              <p className="text-xs sm:text-sm font-medium leading-relaxed">
                {result.qualityAdvice ||
                  'A foto não ficou nítida o suficiente. Para sua segurança médica, o VIVAConnect nunca completa palavras ou doses por adivinhação.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setResult(null);
                  handleOpenPromptCamera();
                }}
                className="btn-contrast-solid bg-amber-600 hover:bg-amber-700 text-white font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow"
              >
                <Camera className="w-4 h-4" />
                <span>Fotografar novamente</span>
              </button>
            </div>
          )}

          {/* Recognized Text Box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-slate-300 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Texto reconhecido na imagem
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSpeak(editableText, 'ocr')}
                  className="bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 border border-teal-300 dark:border-teal-700 hover:bg-teal-100"
                  aria-label="Ouvir texto reconhecido em voz alta"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{activeSpeechSection === 'ocr' ? 'Pausar' : 'Ouvir'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingText(!isEditingText)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 border border-slate-300 dark:border-slate-700"
                  aria-label="Corrigir texto reconhecido"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{isEditingText ? 'Concluir' : 'Corrigir texto'}</span>
                </button>
              </div>
            </div>

            {isEditingText ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                  Você pode corrigir qualquer letra ou pontuação abaixo:
                </label>
                <textarea
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  rows={6}
                  className="w-full p-3 rounded-2xl border-2 border-teal-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-base leading-relaxed"
                />
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border-2 border-slate-200 dark:border-slate-700">
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white whitespace-pre-line leading-relaxed">
                  {editableText}
                </p>
              </div>
            )}

            {/* Highlights to check */}
            {result.highlightedFields && result.highlightedFields.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                  <FileCheck2 className="w-4 h-4 text-amber-600" />
                  <span>Trechos que você deve conferir na foto original:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.highlightedFields.map((field, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border-2 border-amber-300 dark:border-amber-700 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-amber-900 dark:text-amber-200">
                          {field.label}:
                        </span>
                        {field.needVerification && (
                          <span className="text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded">
                            Conferir
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {field.value}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        {field.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setResult(null);
                  handleOpenPromptCamera();
                }}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Fotografar novamente</span>
              </button>
              <button
                type="button"
                onClick={handleDeletePhoto}
                className="bg-red-50 hover:bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 border border-red-200 dark:border-red-800"
              >
                <Trash2 className="w-4 h-4" />
                <span>Apagar foto e texto</span>
              </button>
            </div>
          </div>

          {/* Explique para mim */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-teal-500 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-teal-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Explique para mim
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="btn-contrast-solid bg-teal-600 hover:bg-teal-700 text-white font-black py-2 px-3.5 rounded-xl text-xs flex items-center gap-1 shadow"
              >
                <span>{showExplanation ? 'Ocultar' : 'Ver explicação'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              A inteligência artificial explica termos médicos em palavras simples sem alterar doses.
            </p>

            {showExplanation && (
              <div className="space-y-3 pt-2">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-300 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ScanText className="w-4 h-4 text-teal-600" />
                      <span>O que consegui ler na imagem</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        handleSpeak(
                          result.speechTexts.whatWasRead || result.explanation.whatWasRead,
                          'read'
                        )
                      }
                      className="bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-300 dark:border-slate-700"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Ouvir</span>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-bold leading-relaxed whitespace-pre-line">
                    {result.explanation.whatWasRead}
                  </p>
                </div>

                <div className="p-4 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border-2 border-teal-300 dark:border-teal-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-black text-teal-950 dark:text-teal-100 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <span>Explicação em palavras simples</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        handleSpeak(
                          result.speechTexts.plainLanguage ||
                            result.explanation.plainLanguageExplanation,
                          'plain'
                        )
                      }
                      className="bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-teal-300 dark:border-teal-700"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Ouvir</span>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-teal-950 dark:text-teal-100 font-medium leading-relaxed whitespace-pre-line">
                    {result.explanation.plainLanguageExplanation}
                  </p>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border-2 border-amber-300 dark:border-amber-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      <span>O que preciso confirmar</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        handleSpeak(
                          result.speechTexts.needsConfirmation ||
                            result.explanation.needsConfirmation,
                          'confirm'
                        )
                      }
                      className="bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-amber-300 dark:border-amber-700"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Ouvir</span>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 font-medium leading-relaxed whitespace-pre-line">
                    {result.explanation.needsConfirmation}
                  </p>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  {result.safetyWarning}
                </div>
              </div>
            )}
          </div>

          {/* Create Reminder Box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-slate-300 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-600" />
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Deseja criar um lembrete para este remédio?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Confira os campos abaixo. <strong>Nenhum lembrete é salvo sem sua conferência direta.</strong>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do remédio:
                </label>
                <input
                  type="text"
                  value={reminderMedicine}
                  onChange={(e) => setReminderMedicine(e.target.value)}
                  placeholder="Ex: Losartana Potássica"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dose / Concentração:
                </label>
                <input
                  type="text"
                  value={reminderDosage}
                  onChange={(e) => setReminderDosage(e.target.value)}
                  placeholder="Ex: 50mg - 1 comprimido"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Horário diário:
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações:
                </label>
                <input
                  type="text"
                  value={reminderNotes}
                  onChange={(e) => setReminderNotes(e.target.value)}
                  placeholder="Ex: Tomar pela manhã"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/50 rounded-2xl border border-amber-300 dark:border-amber-700 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderConfirmedByUser}
                onChange={(e) => setReminderConfirmedByUser(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs font-black text-amber-950 dark:text-amber-100 leading-snug">
                Conferi estes dados com a receita médica ou embalagem original e confirmo que estão corretos.
              </span>
            </label>

            <button
              type="button"
              disabled={!reminderConfirmedByUser || !reminderMedicine.trim()}
              onClick={handleSaveReminder}
              className="btn-contrast-solid w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Salvar lembrete em Minha Saúde</span>
            </button>

            {reminderSavedSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-2xl border border-emerald-400 text-xs text-emerald-900 dark:text-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Lembrete salvo com sucesso!</span>
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('health')}
                    className="underline font-black text-emerald-700 dark:text-emerald-300"
                  >
                    Ver em Minha Saúde
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* OUVIR UM TEXTO SUB-MODE */}
      {subMode === 'text' && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-indigo-500 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Ouvir um texto
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSubMode('menu')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Voltar ao menu
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Digite, cole ou fale o texto que deseja que o VIVAConnect leia em voz alta ou explique:
          </p>

          <div>
            {isProcessingMic ? (
              <div className="p-3 bg-sky-50 dark:bg-sky-950 rounded-2xl border-2 border-sky-400 text-center flex items-center justify-center gap-2 text-sky-900 dark:text-sky-200 font-bold text-xs sm:text-sm">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                <span>Entendendo o que você falou...</span>
              </div>
            ) : !isListeningMic ? (
              <button
                type="button"
                onClick={handleStartMic}
                className="btn-contrast-solid w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow cursor-pointer"
              >
                <Mic className="w-5 h-5 animate-bounce" />
                <span>Falar texto no microfone</span>
              </button>
            ) : (
              <div className="p-3 bg-red-50 dark:bg-red-950 rounded-2xl border-2 border-red-500 text-center space-y-2">
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center justify-center gap-2 text-red-900 dark:text-red-200 font-black text-xs sm:text-sm"
                >
                  <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                  <span>Estou ouvindo... Pode falar</span>
                </div>
                <button
                  type="button"
                  onClick={handleStopMic}
                  className="text-xs font-black text-red-700 dark:text-red-300 underline cursor-pointer"
                >
                  Concluir e processar áudio
                </button>
              </div>
            )}

            {micPendingPhrase && (
              <div className="mt-2.5 p-3 bg-emerald-50 dark:bg-emerald-950 rounded-2xl border-2 border-emerald-500 text-xs space-y-2">
                <span className="font-black text-emerald-950 dark:text-emerald-100 block">
                  O microfone entendeu: “{micPendingPhrase}”
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmMicPhrase}
                    className="btn-contrast-solid bg-emerald-600 text-white font-black py-1.5 px-3 rounded-xl"
                  >
                    Inserir no texto
                  </button>
                  <button
                    type="button"
                    onClick={() => setMicPendingPhrase(null)}
                    className="bg-slate-200 text-slate-800 font-bold py-1.5 px-3 rounded-xl"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            )}

            {micError && (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400 font-bold">
                {micError}
              </p>
            )}
          </div>

          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={5}
            placeholder="Digite ou cole aqui o texto da bula, receita, anotação ou mensagem..."
            className="w-full p-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm sm:text-base leading-relaxed"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              disabled={!customText.trim()}
              onClick={() => handleSpeak(customText, 'custom')}
              className="btn-contrast-solid bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-3 px-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow"
            >
              <Volume2 className="w-4 h-4" />
              <span>{activeSpeechSection === 'custom' ? 'Pausar leitura' : 'Ouvir em voz alta'}</span>
            </button>
            <button
              type="button"
              disabled={!customText.trim() || explainingText}
              onClick={handleExplainCustomText}
              className="btn-contrast-solid bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black py-3 px-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow"
            >
              <Sparkles className="w-4 h-4" />
              <span>{explainingText ? 'Analisando...' : 'Explique para mim'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomText('');
                setTextExplanationResult(null);
                stopSpeaking();
              }}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 px-3 rounded-2xl text-xs flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          </div>

          {textExplanationResult && (
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Explicação em 3 partes claras:</span>
              </h4>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-black text-slate-800 dark:text-slate-200">
                    1. O que você informou:
                  </strong>
                  <button
                    type="button"
                    onClick={() =>
                      handleSpeak(
                        textSpeechBundle?.whatWasRead || textExplanationResult.whatWasRead,
                        'custom_read'
                      )
                    }
                    className="text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Ouvir</span>
                  </button>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {textExplanationResult.whatWasRead}
                </p>
              </div>

              <div className="p-3.5 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-300 dark:border-teal-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-black text-teal-950 dark:text-teal-100">
                    2. Explicação em palavras simples:
                  </strong>
                  <button
                    type="button"
                    onClick={() =>
                      handleSpeak(
                        textSpeechBundle?.plainLanguage ||
                          textExplanationResult.plainLanguageExplanation,
                        'custom_plain'
                      )
                    }
                    className="text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Ouvir</span>
                  </button>
                </div>
                <p className="text-xs font-medium text-teal-950 dark:text-teal-100 leading-relaxed">
                  {textExplanationResult.plainLanguageExplanation}
                </p>
              </div>

              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-black text-amber-950 dark:text-amber-100">
                    3. O que precisa confirmar com médico ou farmacêutico:
                  </strong>
                  <button
                    type="button"
                    onClick={() =>
                      handleSpeak(
                        textSpeechBundle?.needsConfirmation ||
                          textExplanationResult.needsConfirmation,
                        'custom_confirm'
                      )
                    }
                    className="text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Ouvir</span>
                  </button>
                </div>
                <p className="text-xs font-medium text-amber-950 dark:text-amber-100 leading-relaxed">
                  {textExplanationResult.needsConfirmation}
                </p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
