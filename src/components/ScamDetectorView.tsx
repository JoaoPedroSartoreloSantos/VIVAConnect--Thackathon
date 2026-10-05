import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  Trash2,
  Lock,
  Info,
  Sparkles,
} from 'lucide-react';
import { ScamAnalysisResult } from '../types';
import { speakText, stopSpeaking } from '../utils/speech';

export const ScamDetectorView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ScamAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const samples = [
    {
      title: 'Simular golpe bancário (Urgência e Pix)',
      text: 'BANCO DO BRASIL INFORMA: Sua conta foi bloqueada devido a um acesso suspeito. Evite cancelamento definitivo atualizando sua senha e dados agora pelo link: http://bb-seguranca-verificacao.xyz/login ou responda com sua senha.',
    },
    {
      title: 'Simular golpe do INSS (Falsa Prova de Vida)',
      text: 'PREVIDÊNCIA SOCIAL: Convocação urgente para Prova de Vida online. Caso não confirme seus dados e tire selfie neste site em até 2 horas, seu benefício de aposentadoria será suspenso. Clique aqui: bit.ly/inss-prova-rapida',
    },
    {
      title: 'Mensagem comum de família',
      text: 'Oi vó, boa tarde! Tudo bem por aí? Passando só pra avisar que domingo vou aí almoçar com a senhora. Um beijo com carinho!',
    },
  ];

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setErrorMsg('Por favor, cole ou digite a mensagem recebida antes de analisar.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setAnalysis(null);
    stopSpeaking();

    try {
      const response = await fetch('/api/gemini/analyze-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageText: inputText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao analisar a mensagem.');
      }

      const data: ScamAnalysisResult = await response.json();
      setAnalysis(data);
      speakText(data.speechText, () => setIsSpeaking(true), () => setIsSpeaking(false));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || 'Erro ao conectar com o serviço de análise. Seus dados não foram expostos.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAudio = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else if (analysis) {
      speakText(analysis.speechText, () => setIsSpeaking(true), () => setIsSpeaking(false));
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'alto':
        return {
          bg: 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-200 border-red-300',
          icon: ShieldAlert,
          label: 'ALTO RISCO DE GOLPE',
        };
      case 'medio':
        return {
          bg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300',
          icon: AlertTriangle,
          label: 'MENSAGEM SUSPEITA / ATENÇÃO',
        };
      case 'baixo':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-300',
          icon: CheckCircle,
          label: 'APARENTEMENTE SEGURA (MANTENHA CAUTELA)',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: HelpCircle,
          label: 'RESULTADO INCONCLUSIVO',
        };
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Info */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              Recebi uma mensagem. É golpe?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              Avalie com segurança mensagens do WhatsApp, SMS ou e-mails suspeitos.
            </p>
          </div>
        </div>

        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Proteção ativa:</strong> O VIVA+ analisa apenas o texto. Nenhum link enviado é aberto ou visitado pelo aplicativo, protegendo seu celular contra vírus.
          </span>
        </div>
      </section>

      {/* Input Area */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
        <label
          htmlFor="message-input"
          className="block font-bold text-sm sm:text-base text-slate-900 dark:text-white"
        >
          Cole ou digite aqui a mensagem suspeita:
        </label>
        <textarea
          id="message-input"
          rows={5}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Exemplo: 'BANCO: Sua conta será suspensa hoje se não confirmar sua senha no link...'"
          className="w-full p-4 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-base focus:border-sky-500 focus:bg-white outline-none transition"
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setInputText('')}
            disabled={!inputText || loading}
            className="text-xs font-bold text-slate-500 hover:text-red-600 disabled:opacity-30 flex items-center gap-1 p-2 rounded-xl"
            aria-label="Limpar texto digitado"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar</span>
          </button>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !inputText.trim()}
            className="btn-contrast-solid flex-1 sm:flex-initial bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-black py-3.5 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2 text-base transition active:scale-95"
            aria-label="Analisar mensagem com inteligência artificial"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analisando com IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Verificar se é Golpe</span>
              </>
            )}
          </button>
        </div>

        {/* Samples for Easy Demonstration */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-500 mb-1.5">
            Testar exemplos comuns (toque para preencher):
          </p>
          <div className="flex flex-col gap-1.5">
            {samples.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(sample.text)}
                className="text-left text-xs bg-slate-100 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-slate-700 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition"
              >
                • {sample.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Error State */}
      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/50 border-2 border-red-400 rounded-3xl p-4 text-red-900 dark:text-red-200 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="block mb-1">Atenção:</strong>
            <p>{errorMsg}</p>
            <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
              Dica de segurança: Mesmo se houver falha de rede, nunca passe códigos de confirmação, senhas ou faça transferências para desconhecidos.
            </p>
          </div>
        </div>
      )}

      {/* Analysis Result Display */}
      {analysis && (
        <section
          className={`rounded-3xl p-5 shadow-md border-2 space-y-4 ${
            analysis.riskLevel === 'alto'
              ? 'bg-red-50/80 dark:bg-red-950/40 border-red-400'
              : analysis.riskLevel === 'medio'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400'
              : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400'
          }`}
          aria-live="polite"
        >
          {/* Risk Level Badge & Audio Control */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-3">
            {(() => {
              const badge = getRiskBadge(analysis.riskLevel);
              const Icon = badge.icon;
              return (
                <div
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl font-black text-xs sm:text-sm border ${badge.bg}`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{badge.label}</span>
                </div>
              );
            })()}
            <button
              onClick={handleToggleAudio}
              className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition"
              aria-label={isSpeaking ? 'Parar leitura de áudio' : 'Ouvir análise completa em voz alta'}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 text-red-600 animate-pulse" />
                  <span>Parar áudio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-sky-600" />
                  <span>Ouvir Análise</span>
                </>
              )}
            </button>
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
              {analysis.riskTitle}
            </h3>
            <p className="text-base text-slate-800 dark:text-slate-100 font-medium mt-1 leading-relaxed">
              {analysis.simpleExplanation}
            </p>
          </div>

          {analysis.warningSigns && analysis.warningSigns.length > 0 && (
            <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Sinais de alerta identificados:
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 list-disc list-inside font-medium">
                {analysis.warningSigns.map((sign, idx) => (
                  <li key={idx} className="leading-snug">
                    {sign}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.recommendedSteps && analysis.recommendedSteps.length > 0 && (
            <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                O que você deve fazer agora:
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 list-disc list-inside font-medium">
                {analysis.recommendedSteps.map((step, idx) => (
                  <li key={idx} className="leading-snug">
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-300 dark:border-slate-700 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 italic">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              <strong>Aviso de responsabilidade:</strong> {analysis.disclaimer}
            </span>
          </div>
        </section>
      )}
    </div>
  );
};
