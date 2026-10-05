import React, { useState, useEffect } from 'react';
import { HeartPulse, Activity, X, Check, Clock, AlertCircle, Volume2, Sparkles } from 'lucide-react';
import { HealthLog } from '../types';
import { speakText } from '../utils/speech';

interface RecordHealthMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLog: (log: HealthLog) => void;
  initialType?: 'pressure' | 'glucose' | 'both';
  initialSys?: string;
  initialDia?: string;
}

export const RecordHealthMeasurementModal: React.FC<RecordHealthMeasurementModalProps> = ({
  isOpen,
  onClose,
  onSaveLog,
  initialType = 'both',
  initialSys = '',
  initialDia = '',
}) => {
  const [measurementType, setMeasurementType] = useState<'both' | 'pressure' | 'glucose'>(initialType);

  // Pressure state
  const [systolic, setSystolic] = useState<string>(initialSys);
  const [diastolic, setDiastolic] = useState<string>(initialDia);

  useEffect(() => {
    if (isOpen) {
      if (initialSys) setSystolic(initialSys);
      if (initialDia) setDiastolic(initialDia);
    }
  }, [isOpen, initialSys, initialDia]);

  // Glucose state
  const [glucose, setGlucose] = useState<string>('');
  const [glucoseTiming, setGlucoseTiming] = useState<'jejum' | 'antes' | 'depois' | 'casual'>('jejum');

  // Notes
  const [notes, setNotes] = useState<string>('');

  // Shorthand suggestion
  const isShorthandPressure =
    Boolean(systolic && Number(systolic) >= 9 && Number(systolic) <= 25 && systolic.length <= 2) &&
    Boolean(diastolic && Number(diastolic) >= 5 && Number(diastolic) <= 18 && diastolic.length <= 2);

  if (!isOpen) return null;

  const handleApplyPreset = (sys: string, dia: string) => {
    setSystolic(sys);
    setDiastolic(dia);
    speakText(`Selecionado ${sys} por ${dia} milímetros de mercúrio.`);
  };

  const handleConvertShorthand = () => {
    if (isShorthandPressure) {
      const newSys = String(Number(systolic) * 10);
      const newDia = String(Number(diastolic) * 10);
      setSystolic(newSys);
      setDiastolic(newDia);
      speakText(`Convertido para ${newSys} por ${newDia} milímetros de mercúrio.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalSys = systolic.trim() ? Number(systolic) : undefined;
    let finalDia = diastolic.trim() ? Number(diastolic) : undefined;

    // Auto-normalize shorthand like "12 por 8" to 120 / 80
    if (finalSys && finalSys >= 9 && finalSys <= 25) {
      finalSys = finalSys * 10;
    }
    if (finalDia && finalDia >= 5 && finalDia <= 18) {
      finalDia = finalDia * 10;
    }

    const finalGlucose = glucose.trim() ? Number(glucose) : undefined;

    if (!finalSys && !finalDia && !finalGlucose) {
      speakText('Por favor, informe ao menos a pressão arterial ou o nível de glicose.');
      return;
    }

    let calculatedType: 'pressure' | 'glucose' | 'both' = 'both';
    if (finalSys && finalDia && !finalGlucose) {
      calculatedType = 'pressure';
    } else if (!finalSys && !finalDia && finalGlucose) {
      calculatedType = 'glucose';
    }

    const timingMap = {
      jejum: 'Em jejum',
      antes: 'Antes da refeição',
      depois: 'Após refeição (2h)',
      casual: 'Ao longo do dia',
    };

    let composedNotes = notes.trim();
    if (finalGlucose) {
      composedNotes = composedNotes
        ? `[Glicemia: ${timingMap[glucoseTiming]}] ${composedNotes}`
        : `[Glicemia: ${timingMap[glucoseTiming]}]`;
    }

    const newLog: HealthLog = {
      id: `log-${Date.now()}`,
      type: calculatedType,
      systolic: finalSys,
      diastolic: finalDia,
      glucose: finalGlucose,
      measuredAt: new Date().toISOString(),
      notes: composedNotes || undefined,
    };

    onSaveLog(newLog);

    let message = 'Medição registrada com sucesso!';
    if (finalSys && finalDia) {
      message += ` Pressão: ${finalSys} por ${finalDia}.`;
    }
    if (finalGlucose) {
      message += ` Glicemia: ${finalGlucose} miligramas por decilitro.`;
    }
    speakText(message);

    // Reset & close
    setSystolic('');
    setDiastolic('');
    setGlucose('');
    setNotes('');
    onClose();
  };

  // Interpretation helpers
  const getPressureStatus = () => {
    let sys = Number(systolic);
    let dia = Number(diastolic);
    if (!sys || !dia) return null;
    if (sys <= 25) sys *= 10;
    if (dia <= 18) dia *= 10;

    if (sys < 120 && dia < 80) {
      return { label: 'Pressão Ótima / Normal', color: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300' };
    }
    if (sys <= 139 || dia <= 89) {
      return { label: 'Pressão Limítrofe / Atenção', color: 'text-amber-800 bg-amber-100 dark:bg-amber-950/70 border-amber-300' };
    }
    return { label: 'Pressão Elevada / Consulte seu médico', color: 'text-red-800 bg-red-100 dark:bg-red-950/70 border-red-300' };
  };

  const getGlucoseStatus = () => {
    const val = Number(glucose);
    if (!val) return null;
    if (glucoseTiming === 'jejum') {
      if (val >= 70 && val <= 99) {
        return { label: 'Glicemia Normal em Jejum', color: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300' };
      }
      if (val >= 100 && val <= 125) {
        return { label: 'Glicemia Alterada / Pré-diabetes', color: 'text-amber-800 bg-amber-100 dark:bg-amber-950/70 border-amber-300' };
      }
      return { label: 'Glicemia Elevada / Atenção', color: 'text-red-800 bg-red-100 dark:bg-red-950/70 border-red-300' };
    }
    if (val < 140) {
      return { label: 'Glicemia Normal pós-refeição', color: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300' };
    }
    return { label: 'Glicemia Elevada pós-refeição', color: 'text-amber-800 bg-amber-100 dark:bg-amber-950/70 border-amber-300' };
  };

  const pressureStatus = getPressureStatus();
  const glucoseStatus = getGlucoseStatus();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-health-modal-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 border-2 border-emerald-400 dark:border-emerald-600 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h2
                id="record-health-modal-title"
                className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight"
              >
                Registrar Pressão e Diabetes
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Anote suas medições para manter sua saúde sob controle.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                speakText(
                  'Formulário para registrar pressão arterial e nível de glicemia. Digite sua pressão máxima e mínima ou o valor da sua glicose, e toque em Salvar Medição.'
                )
              }
              className="p-2 text-sky-600 hover:text-sky-800 dark:text-sky-400 rounded-xl"
              aria-label="Ouvir instruções do formulário de saúde"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl"
              aria-label="Fechar janela"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Type Selection */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setMeasurementType('both')}
            className={`py-2 px-1 text-xs font-black rounded-xl transition ${
              measurementType === 'both'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            Pressão + Glicemia
          </button>
          <button
            type="button"
            onClick={() => setMeasurementType('pressure')}
            className={`py-2 px-1 text-xs font-black rounded-xl transition ${
              measurementType === 'pressure'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            Apenas Pressão
          </button>
          <button
            type="button"
            onClick={() => setMeasurementType('glucose')}
            className={`py-2 px-1 text-xs font-black rounded-xl transition ${
              measurementType === 'glucose'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            Apenas Glicemia
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SECTION 1: PRESSÃO ARTERIAL */}
          {(measurementType === 'both' || measurementType === 'pressure') && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-3xl border-2 border-emerald-300 dark:border-emerald-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Pressão Arterial
                </span>
                <span className="text-[11px] font-bold text-slate-500">Unidade: mmHg</span>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                  Toque em um valor comum para preencher rápido:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('110', '70')}
                    className={`btn-contrast-solid p-2.5 rounded-2xl border-2 text-left transition flex flex-col ${
                      systolic === '110' && diastolic === '70'
                        ? 'border-emerald-600 bg-emerald-100 dark:bg-emerald-950 font-black'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-500'
                    }`}
                  >
                    <span className="text-sm font-black text-slate-900 dark:text-white">11 por 7</span>
                    <span className="text-[11px] text-slate-500">110 / 70 mmHg • Normal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('120', '80')}
                    className={`btn-contrast-solid p-2.5 rounded-2xl border-2 text-left transition flex flex-col ${
                      systolic === '120' && diastolic === '80'
                        ? 'border-emerald-600 bg-emerald-100 dark:bg-emerald-950 font-black'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-500'
                    }`}
                  >
                    <span className="text-sm font-black text-emerald-800 dark:text-emerald-300">12 por 8 ⭐</span>
                    <span className="text-[11px] text-slate-500">120 / 80 mmHg • Padrão</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('130', '80')}
                    className={`btn-contrast-solid p-2.5 rounded-2xl border-2 text-left transition flex flex-col ${
                      systolic === '130' && diastolic === '80'
                        ? 'border-amber-600 bg-amber-100 dark:bg-amber-950 font-black'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-500'
                    }`}
                  >
                    <span className="text-sm font-black text-slate-900 dark:text-white">13 por 8</span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400">130 / 80 mmHg • Atenção</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('140', '90')}
                    className={`btn-contrast-solid p-2.5 rounded-2xl border-2 text-left transition flex flex-col ${
                      systolic === '140' && diastolic === '90'
                        ? 'border-orange-600 bg-orange-100 dark:bg-orange-950 font-black'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-orange-500'
                    }`}
                  >
                    <span className="text-sm font-black text-orange-900 dark:text-orange-300">14 por 9</span>
                    <span className="text-[11px] text-orange-700 dark:text-orange-400">140 / 90 mmHg • Alta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('150', '90')}
                    className={`btn-contrast-solid p-2.5 rounded-2xl border-2 text-left transition flex flex-col ${
                      systolic === '150' && diastolic === '90'
                        ? 'border-red-600 bg-red-100 dark:bg-red-950 font-black'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-red-500'
                    }`}
                  >
                    <span className="text-sm font-black text-red-900 dark:text-red-300">15 por 9</span>
                    <span className="text-[11px] text-red-700 dark:text-red-400">150 / 90 mmHg • Alta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('160', '100')}
                    className={`btn-contrast-solid p-2.5 rounded-2xl border-2 text-left transition flex flex-col ${
                      systolic === '160' && diastolic === '100'
                        ? 'border-red-700 bg-red-200 dark:bg-red-950 font-black'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-red-600'
                    }`}
                  >
                    <span className="text-sm font-black text-red-900 dark:text-red-300">16 por 10</span>
                    <span className="text-[11px] text-red-800 dark:text-red-400">160 / 100 • Muito Alta</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                    Pressão Máxima (Sistólica)
                  </label>
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    placeholder="120 ou 12"
                    min="1"
                    max="300"
                    className="w-full p-3 rounded-2xl border-2 border-slate-400 dark:border-slate-600 text-lg font-black bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">Ex: 120 (ou digite 12)</span>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                    Pressão Mínima (Diastólica)
                  </label>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    placeholder="80 ou 8"
                    min="1"
                    max="200"
                    className="w-full p-3 rounded-2xl border-2 border-slate-400 dark:border-slate-600 text-lg font-black bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">Ex: 80 (ou digite 8)</span>
                </div>
              </div>

              {/* Shorthand assistant button */}
              {isShorthandPressure && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center justify-between text-xs">
                  <span className="text-amber-900 dark:text-amber-200 font-bold">
                    Você digitou {systolic} por {diastolic}. Quer salvar como {Number(systolic) * 10} por {Number(diastolic) * 10} mmHg?
                  </span>
                  <button
                    type="button"
                    onClick={handleConvertShorthand}
                    className="ml-2 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black shrink-0"
                  >
                    Sim, converter
                  </button>
                </div>
              )}

              {pressureStatus && (
                <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${pressureStatus.color}`}>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{pressureStatus.label}</span>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: DIABETES / GLICEMIA */}
          {(measurementType === 'both' || measurementType === 'glucose') && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-3xl border-2 border-sky-300 dark:border-sky-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  Nível de Diabetes (Glicemia)
                </span>
                <span className="text-[11px] font-bold text-slate-500">Unidade: mg/dL</span>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                  Momento em que mediu:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGlucoseTiming('jejum')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition ${
                      glucoseTiming === 'jejum'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Em Jejum
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlucoseTiming('antes')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition ${
                      glucoseTiming === 'antes'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Antes da Refeição
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlucoseTiming('depois')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition ${
                      glucoseTiming === 'depois'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Após Comer (2h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlucoseTiming('casual')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition ${
                      glucoseTiming === 'casual'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Ao Longo do Dia
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                  Valor da Glicemia (mg/dL)
                </label>
                <input
                  type="number"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                  placeholder="Ex: 95 ou 110"
                  min="20"
                  max="600"
                  className="w-full p-3 rounded-2xl border-2 border-slate-400 dark:border-slate-600 text-lg font-black bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Valor que apareceu no glicosímetro (aparelho de furar o dedo).
                </span>
              </div>

              {glucoseStatus && (
                <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${glucoseStatus.color}`}>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{glucoseStatus.label}</span>
                </div>
              )}
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
              Observações (como você está se sentindo) - Opcional
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Tomei remédio antes, senti leve tontura, medi em jejum..."
              className="w-full p-3 rounded-2xl border-2 border-slate-400 dark:border-slate-600 text-xs sm:text-sm font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          {/* Ethical disclaimer */}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            * Seus dados são anotados para seu acompanhamento pessoal e para mostrar ao seu médico. O VIVA+ não substitui consultas clínicas.
          </p>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-contrast-solid bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Medição</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
