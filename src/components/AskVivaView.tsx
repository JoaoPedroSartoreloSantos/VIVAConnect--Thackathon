import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquareHeart,
  Send,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  MapPin,
  ExternalLink,
  PhoneCall,
  Phone,
  Check,
  Edit2,
  RefreshCw,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import {
  ActiveTab,
  HealthLog,
  MedicationReminder,
  NearbyPlace,
  TrustedContact,
  AccessibilitySettings,
} from '../types';
import { speakText, stopSpeaking } from '../utils/speech';
import { getPlaces } from '../utils/placesService';
import { UniversalVoiceListener } from '../utils/audioRecorder';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  speechText?: string;
  suggestedAction?: ActiveTab | 'none';
  suggestedActionLabel?: string;
  isEmergency?: boolean;
  placesCategory?: string;
  realPlaces?: NearbyPlace[];
  trustedContactData?: TrustedContact;
  timestamp: string;
}

interface AskVivaViewProps {
  onNavigate: (tab: ActiveTab) => void;
  healthLogs: HealthLog[];
  medications: MedicationReminder[];
  hasTrustedContact: boolean;
  contact?: TrustedContact;
  settings?: AccessibilitySettings;
  onTriggerSOS?: () => void;
}

export const AskVivaView: React.FC<AskVivaViewProps> = ({
  onNavigate,
  healthLogs,
  medications,
  hasTrustedContact,
  contact,
  settings,
  onTriggerSOS,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Olá! Esta é a aba Pedir Ajuda. Você pode falar usando o microfone ou digitar o que precisa. Posso ajudar você a encontrar postos de saúde, farmácias, avisar sua pessoa de confiança ou tirar dúvidas sobre suas anotações.',
      speechText:
        'Olá! Esta é a aba Pedir Ajuda do VIVA Plus. Toque no botão Falar o que preciso para falar por voz, ou digite abaixo.',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const [voiceRecognizedNotice, setVoiceRecognizedNotice] = useState<string | null>(null);

  const [pendingPhrase, setPendingPhrase] = useState<string | null>(null);
  const [isEditingPending, setIsEditingPending] = useState(false);
  const [editedPhrase, setEditedPhrase] = useState('');

  const [callConfirmation, setCallConfirmation] = useState<{
    isOpen: boolean;
    name: string;
    number: string;
  } | null>(null);

  const voiceListenerRef = useRef<UniversalVoiceListener | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickQuestions = [
    'Onde fica a UBS mais próxima?',
    'Encontre uma farmácia perto de mim.',
    'Qual o telefone desta unidade?',
    'Preciso de ajuda para encontrar um hospital.',
    'Como aviso minha pessoa de confiança?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, pendingPhrase]);

  const handleStartListening = async () => {
    setMicError(null);
    setVoiceRecognizedNotice(null);
    stopSpeaking();

    const listener = new UniversalVoiceListener({
      onStart: () => {
        setIsListening(true);
        setIsProcessingVoice(false);
        setMicError(null);
        setPendingPhrase(null);
      },
      onTranscript: (transcript: string) => {
        setIsListening(false);
        setIsProcessingVoice(false);
        if (transcript) {
          setInputQuestion(transcript);
          setPendingPhrase(transcript);
          setEditedPhrase(transcript);
          setVoiceRecognizedNotice(`Texto reconhecido: "${transcript}". Toque em Confirmar e enviar.`);
          inputRef.current?.focus();
          if (settings?.voiceEnabled) {
            speakText(`Entendi: ${transcript}. Toque em Confirmar e enviar para receber a resposta.`);
          }
        }
      },
      onError: (errorMsg: string) => {
        setIsListening(false);
        setIsProcessingVoice(false);
        setMicError(errorMsg);
        speakText(errorMsg);
      },
      onEnd: () => {
        setIsListening(false);
        setIsProcessingVoice(false);
      },
    });

    voiceListenerRef.current = listener;
    await listener.start();
  };

  const handleStopListening = async () => {
    if (voiceListenerRef.current) {
      setIsProcessingVoice(true);
      await voiceListenerRef.current.stop();
    } else {
      setIsListening(false);
      setIsProcessingVoice(false);
    }
  };

  const handleConfirmPendingPhrase = () => {
    const finalPhrase = (isEditingPending ? editedPhrase : pendingPhrase || '').trim();
    if (!finalPhrase) return;
    setPendingPhrase(null);
    setIsEditingPending(false);
    handleSendQuestion(finalPhrase);
  };

  const checkEmergencyKeywords = (text: string): boolean => {
    const lower = text.toLowerCase();
    return (
      lower.includes('socorro') ||
      lower.includes('emergência') ||
      lower.includes('emergencia') ||
      lower.includes('dor no peito') ||
      lower.includes('falta de ar') ||
      lower.includes('infarto') ||
      lower.includes('infartando') ||
      lower.includes('avc') ||
      lower.includes('derrame') ||
      lower.includes('desmaiei') ||
      lower.includes('caí e não consigo') ||
      lower.includes('cai e nao consigo') ||
      lower.includes('sangrando muito')
    );
  };

  const handleSendQuestion = async (questionText: string) => {
    const cleanQuestion = questionText.trim();
    if (!cleanQuestion) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: cleanQuestion,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setVoiceRecognizedNotice(null);
    setLoading(true);
    setMicError(null);

    const isEmergency = checkEmergencyKeywords(cleanQuestion);

    const latestHealth = healthLogs[0];
    const userContext = {
      healthLogsCount: healthLogs.length,
      latestHealthLog: latestHealth,
      medicationsCount: medications.length,
      medications: medications.map((m) => `${m.name} (${m.dosage}) às ${m.time}`),
      hasTrustedContact,
    };

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuestion: cleanQuestion,
          userContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor.');
      }

      const data = await response.json();
      const detectedEmergency = isEmergency || data.isEmergency;

      let realPlaces: NearbyPlace[] | undefined;
      const placesCat = data.placesCategory;

      if (
        placesCat &&
        placesCat !== 'none' &&
        ['ubs', 'upa', 'hospital', 'pharmacy', 'all'].includes(placesCat)
      ) {
        const placesRes = await getPlaces({
          category: placesCat as any,
        });
        realPlaces = placesRes.places.slice(0, 3);
      } else if (
        cleanQuestion.toLowerCase().includes('ubs') ||
        cleanQuestion.toLowerCase().includes('posto de saúde') ||
        cleanQuestion.toLowerCase().includes('farmácia') ||
        cleanQuestion.toLowerCase().includes('hospital')
      ) {
        let cat: any = 'all';
        if (cleanQuestion.toLowerCase().includes('farmácia')) cat = 'pharmacy';
        else if (cleanQuestion.toLowerCase().includes('hospital')) cat = 'hospital';
        else if (cleanQuestion.toLowerCase().includes('ubs')) cat = 'ubs';
        const placesRes = await getPlaces({ category: cat });
        realPlaces = placesRes.places.slice(0, 3);
      }

      const assistantMsg: ChatMessage = {
        id: `assist_${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        speechText: data.speechText,
        suggestedAction: data.suggestedAction,
        suggestedActionLabel: data.suggestedActionLabel,
        isEmergency: detectedEmergency,
        placesCategory: placesCat,
        realPlaces,
        trustedContactData: contact,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (settings?.voiceEnabled) {
        speakText(data.speechText || data.reply);
      }
    } catch (err: any) {
      console.error('Erro na resposta:', err);
      const fallbackMsg: ChatMessage = {
        id: `assist_${Date.now()}`,
        sender: 'assistant',
        text: 'Não consegui me conectar à inteligência no momento. Mas se você precisa de ajuda com saúde, postos próximos ou emergências, você pode usar os botões diretos abaixo.',
        speechText:
          'Não consegui me conectar no momento. Use os botões na tela para encontrar ajuda.',
        isEmergency,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSOS = () => {
    if (onTriggerSOS) {
      onTriggerSOS();
    } else {
      onNavigate('sos');
    }
  };

  return (
    <div className="space-y-4 pb-36">
      {/* Header Info */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <MessageSquareHeart className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                Pedir Ajuda
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                Fale ou digite o que precisa. O VIVA+ orienta você com calma.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              speakText(
                'Tela Pedir Ajuda. Toque no botão grande Falar o que preciso para ditar por voz, ou digite sua pergunta no campo abaixo.'
              )
            }
            className="p-2 text-sky-600 hover:text-sky-800 rounded-xl"
            aria-label="Ouvir orientações da tela de pedir ajuda"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Mic Action */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          {isProcessingVoice ? (
            <div className="bg-sky-50 dark:bg-sky-950/60 p-4 rounded-3xl border-2 border-sky-400 text-center flex items-center justify-center gap-3 text-sky-900 dark:text-sky-200 font-black">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
              <span>Entendendo o que você falou com inteligência artificial...</span>
            </div>
          ) : !isListening ? (
            <button
              type="button"
              onClick={handleStartListening}
              className="btn-contrast-solid w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black py-4 px-5 rounded-3xl flex items-center justify-center gap-3 text-base sm:text-lg shadow-lg transition cursor-pointer"
              aria-label="Falar o que preciso usando microfone deste aparelho"
            >
              <Mic className="w-7 h-7 shrink-0 animate-bounce" />
              <span>Falar o que preciso</span>
            </button>
          ) : (
            <div className="space-y-3 bg-red-50 dark:bg-red-950/60 p-4 rounded-3xl border-2 border-red-500 text-center">
              <div
                role="status"
                aria-live="polite"
                className="flex items-center justify-center gap-3 text-red-900 dark:text-red-200 font-black text-base"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping" />
                <span>Estou ouvindo... Pode falar agora</span>
              </div>
              <p className="text-xs text-red-800 dark:text-red-300 font-medium">
                Fale perto do microfone com clareza. Toque no botão abaixo quando terminar de falar.
              </p>
              <button
                type="button"
                onClick={handleStopListening}
                className="btn-contrast-solid w-full bg-red-700 hover:bg-red-800 active:scale-95 text-white font-black py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow transition cursor-pointer"
                aria-label="Concluir fala agora"
              >
                <MicOff className="w-5 h-5" />
                <span>Concluir e processar o que falei</span>
              </button>
            </div>
          )}

          {micError && (
            <div className="mt-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/60 rounded-2xl border-2 border-amber-400 dark:border-amber-700 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black">Aviso do microfone:</strong>
                <p className="leading-relaxed">{micError}</p>
                <p className="pt-1 font-bold">
                  Dica: Você pode tocar em uma das opções abaixo ou digitar no campo de texto.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Confirmation of Speech */}
      {pendingPhrase !== null && (
        <section
          role="region"
          aria-labelledby="confirm-speech-title"
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-3 border-emerald-500 dark:border-emerald-600 shadow-xl space-y-3"
        >
          <div className="flex items-center gap-2">
            <Check className="w-6 h-6 text-emerald-600" />
            <h3
              id="confirm-speech-title"
              className="text-base font-black text-slate-900 dark:text-white"
            >
              O VIVA+ entendeu sua fala:
            </h3>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-300 dark:border-slate-700">
            {isEditingPending ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editedPhrase}
                  onChange={(e) => setEditedPhrase(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-sky-500 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                  autoFocus
                />
              </div>
            ) : (
              <p className="text-base font-black text-slate-900 dark:text-white leading-relaxed">
                “{pendingPhrase}”
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={handleConfirmPendingPhrase}
              className="btn-contrast-solid bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black py-3 px-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar e enviar</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditingPending(!isEditingPending)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black py-3 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700"
            >
              <Edit2 className="w-4 h-4" />
              <span>{isEditingPending ? 'Concluir edição' : 'Corrigir frase'}</span>
            </button>
            <button
              type="button"
              onClick={handleStartListening}
              className="bg-sky-50 hover:bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-black py-3 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-sky-300 dark:border-sky-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Falar de novo</span>
            </button>
          </div>
        </section>
      )}

      {/* Suggested Quick Question Pills */}
      <section className="bg-slate-100 dark:bg-slate-900/80 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
            Ou toque em uma das opções frequentes:
          </span>
          <span className="text-[11px] text-slate-500 font-bold">1 toque para enviar</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendQuestion(q)}
              className="p-3 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-left text-xs sm:text-sm font-bold flex items-center justify-between gap-2 shadow-sm transition active:scale-98"
            >
              <span>{q}</span>
              <ArrowRight className="w-4 h-4 text-sky-600 shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* Chat Messages */}
      <section className="space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
            >
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-3xl p-4 sm:p-5 shadow-sm space-y-2.5 ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-bl-none border-2 border-slate-200 dark:border-slate-800'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-sky-700 dark:text-sky-400">
                      <Sparkles className="w-4 h-4" />
                      <span>Orientação do VIVA+</span>
                    </div>
                    <button
                      onClick={() => speakText(msg.speechText || msg.text)}
                      className="p-1 text-slate-500 hover:text-sky-600 rounded-lg"
                      aria-label="Ouvir esta resposta"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <p className="text-sm sm:text-base leading-relaxed font-bold whitespace-pre-line">
                  {msg.text}
                </p>

                {/* Emergency block */}
                {msg.isEmergency && (
                  <div className="mt-3 p-4 bg-red-50 dark:bg-red-950/80 rounded-2xl border-3 border-red-600 space-y-3">
                    <div className="flex items-center gap-2 text-red-900 dark:text-red-200 font-black text-sm sm:text-base">
                      <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
                      <span>ATENÇÃO: Situação de Urgência</span>
                    </div>
                    <p className="text-xs text-red-900 dark:text-red-200 font-medium leading-relaxed">
                      O VIVA+ <strong>não substitui médicos e não faz diagnósticos</strong>. Em caso de dor no peito, falta de ar, suspeita de AVC ou desmaio, ligue imediatamente para os serviços de socorro:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCallConfirmation({
                            isOpen: true,
                            name: 'SAMU - Serviço de Atendimento Móvel de Urgência',
                            number: '192',
                          })
                        }
                        className="btn-contrast-solid bg-red-600 hover:bg-red-700 text-white font-black py-3 px-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Ligar SAMU 192 (Grátis)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCallConfirmation({
                            isOpen: true,
                            name: 'Corpo de Bombeiros (Resgate)',
                            number: '193',
                          })
                        }
                        className="btn-contrast-solid bg-orange-600 hover:bg-orange-700 text-white font-black py-3 px-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Ligar Bombeiros 193</span>
                      </button>
                    </div>
                    {contact?.phone && (
                      <button
                        type="button"
                        onClick={handleOpenSOS}
                        className="w-full bg-slate-900 text-white font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span>Abrir Pop-up de SOS para avisar {contact.name || 'contato'}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Real Places Results */}
                {msg.realPlaces && msg.realPlaces.length > 0 && (
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                      <MapPin className="w-4 h-4 text-sky-600" />
                      <span>Dados oficiais do local • Fonte: OpenStreetMap</span>
                    </div>
                    {msg.realPlaces.map((pl) => (
                      <div
                        key={pl.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-300 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded-full">
                              {pl.categoryLabel}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                              {pl.name}
                            </h4>
                          </div>
                          {pl.formattedDistance && (
                            <span className="text-[11px] font-mono font-bold text-sky-800 dark:text-sky-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 shrink-0">
                              {pl.formattedDistance}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1 font-medium">
                          <p>
                            <strong className="text-slate-900 dark:text-white">Endereço: </strong>
                            {pl.address}
                          </p>
                          <p>
                            <strong className="text-slate-900 dark:text-white">Telefone: </strong>
                            {pl.phone ? (
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {pl.phone}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">
                                Telefone não informado
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {pl.phone ? (
                            <button
                              type="button"
                              onClick={() =>
                                setCallConfirmation({
                                  isOpen: true,
                                  name: pl.name,
                                  number: pl.phone!,
                                })
                              }
                              className="btn-contrast-solid bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Ligar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="bg-slate-200 dark:bg-slate-700 text-slate-400 font-bold py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                            >
                              <span>Sem telefone</span>
                            </button>
                          )}
                          <a
                            href={
                              pl.lat && pl.lng
                                ? `https://www.google.com/maps/search/?api=1&query=${pl.lat},${pl.lng}`
                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    `${pl.name}, ${pl.address}`
                                  )}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-sky-50 hover:bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-200 font-black py-2 px-2.5 rounded-xl text-xs border border-sky-300 dark:border-sky-700 flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                            <span>Ver rota</span>
                          </a>
                        </div>
                      </div>
                    ))}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => onNavigate('places')}
                        className="text-xs font-black text-sky-700 dark:text-sky-300 underline"
                      >
                        Ver todos os locais na aba Ajuda Perto →
                      </button>
                    </div>
                  </div>
                )}

                {/* Trusted Contact advice */}
                {msg.text.toLowerCase().includes('confiança') && contact?.name && (
                  <div className="mt-3 p-3.5 bg-sky-50 dark:bg-sky-950/60 rounded-2xl border-2 border-sky-300 dark:border-sky-700 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-sky-900 dark:text-sky-200">
                      <UserCheck className="w-4 h-4 text-sky-600" />
                      <span>Sua pessoa de confiança cadastrada:</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">
                          {contact.name} ({contact.relationship})
                        </p>
                        <p className="font-mono text-slate-700 dark:text-slate-300">
                          {contact.phone}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCallConfirmation({
                            isOpen: true,
                            name: contact.name,
                            number: contact.phone,
                          })
                        }
                        className="btn-contrast-solid bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Ligar</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenSOS}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow mt-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Abrir Pop-up do Botão SOS</span>
                    </button>
                  </div>
                )}

                {/* Suggested Action Navigation Button */}
                {msg.suggestedAction &&
                  msg.suggestedAction !== 'none' &&
                  msg.suggestedActionLabel && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          if (msg.suggestedAction === 'sos') {
                            handleOpenSOS();
                          } else {
                            onNavigate(msg.suggestedAction as ActiveTab);
                          }
                        }}
                        className="btn-contrast-solid bg-sky-600 hover:bg-sky-700 text-white font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow"
                      >
                        <span>{msg.suggestedActionLabel}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                <div
                  className={`text-[10px] pt-1 ${
                    isUser ? 'text-sky-200' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 p-2">
            <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
            <span>O VIVA+ está formulando uma resposta clara para você...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </section>

      {/* Input section with Mic and Send buttons */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-3 sm:p-4 border-2 border-slate-300 dark:border-slate-700 shadow-sm space-y-2.5">
        {isListening && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-between p-3.5 bg-red-50 dark:bg-red-950/80 rounded-2xl border-2 border-red-500 text-red-950 dark:text-red-100 animate-pulse"
          >
            <div className="flex items-center gap-2.5 font-black text-sm sm:text-base">
              <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping shrink-0" />
              <span>Estou ouvindo... Pode falar</span>
            </div>
            <button
              type="button"
              onClick={handleStopListening}
              className="btn-contrast-solid bg-red-700 hover:bg-red-800 active:scale-95 text-white font-black px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow transition"
              aria-label="Parar de ouvir agora"
            >
              <MicOff className="w-4 h-4 shrink-0" />
              <span>Parar</span>
            </button>
          </div>
        )}

        {voiceRecognizedNotice && !isListening && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-400 dark:border-emerald-700 rounded-2xl text-emerald-950 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{voiceRecognizedNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setVoiceRecognizedNotice(null)}
              className="text-xs font-black underline shrink-0 px-1 py-0.5"
            >
              Entendi
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuestion(inputQuestion);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputQuestion}
              onChange={(e) => {
                setInputQuestion(e.target.value);
                if (voiceRecognizedNotice) setVoiceRecognizedNotice(null);
              }}
              placeholder="Digite sua dúvida ou o que precisa..."
              className="w-full p-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 text-sm sm:text-base font-bold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
              disabled={loading}
              aria-label="Digite sua dúvida ou o que precisa"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isProcessingVoice ? (
              <div className="btn-contrast-solid flex-1 sm:flex-initial bg-sky-600 text-white font-black px-4 py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow min-h-[48px]">
                <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                <span>Ouvindo...</span>
              </div>
            ) : !isListening ? (
              <button
                type="button"
                onClick={handleStartListening}
                className="btn-contrast-solid flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black px-4 py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow transition min-h-[48px] cursor-pointer"
                aria-label="Falar mensagem usando microfone deste aparelho"
                title="Falar o que preciso"
              >
                <Mic className="w-5 h-5 shrink-0" />
                <span>Falar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopListening}
                className="btn-contrast-solid flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black px-4 py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow transition min-h-[48px] cursor-pointer animate-pulse"
                aria-label="Concluir fala e enviar"
                title="Concluir fala"
              >
                <MicOff className="w-5 h-5 shrink-0" />
                <span>Concluir</span>
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !inputQuestion.trim()}
              className="btn-contrast-solid flex-1 sm:flex-initial bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-black px-5 py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow transition min-h-[48px]"
              aria-label="Enviar mensagem digitada ou confirmada"
            >
              <Send className="w-5 h-5 shrink-0" />
              <span>Enviar</span>
            </button>
          </div>
        </form>
      </section>

      {/* Confirmation Call Modal */}
      {callConfirmation && callConfirmation.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-call-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border-2 border-emerald-500 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h4
                id="confirm-call-title"
                className="text-base font-black text-slate-900 dark:text-white"
              >
                Confirmar ligação telefônica
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Você solicitou ligar para:
              </p>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {callConfirmation.name}
              </p>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 my-2">
                <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400 tracking-wider">
                  {callConfirmation.number}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                O discador do seu celular será aberto com este número.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <a
                href={`tel:${callConfirmation.number.replace(/[^\d+]/g, '')}`}
                onClick={() => setCallConfirmation(null)}
                className="btn-contrast-solid w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow"
              >
                <Phone className="w-4 h-4" />
                <span>Sim, ligar agora</span>
              </a>
              <button
                type="button"
                onClick={() => setCallConfirmation(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-2xl text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
