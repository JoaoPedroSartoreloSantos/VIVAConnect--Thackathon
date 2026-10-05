import React from 'react';
import { Pill, CheckCircle2, Clock, Volume2, XCircle, BellRing, Sparkles } from 'lucide-react';
import { MedicationReminder } from '../types';
import { speakText, stopSpeaking } from '../utils/speech';
import { playReminderChime } from '../utils/notifications';

interface MedicationAlertModalProps {
  medication: MedicationReminder | null;
  scheduledTime: string;
  onConfirmTaken: (medId: string) => void;
  onSkipMed: (medId: string) => void;
  onSnooze: (medId: string, minutes: number) => void;
  onClose: () => void;
}

export const MedicationAlertModal: React.FC<MedicationAlertModalProps> = ({
  medication,
  scheduledTime,
  onConfirmTaken,
  onSkipMed,
  onSnooze,
  onClose,
}) => {
  if (!medication) return null;

  const handleHearAgain = () => {
    stopSpeaking();
    playReminderChime();
    speakText(
      `Lembrete de remédio: Está na hora de tomar ${medication.name}. Dose: ${medication.dosage}. Horário programado: ${scheduledTime}.`
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="med-alert-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 max-w-md w-full border-4 border-emerald-500 shadow-2xl space-y-4">
        {/* Header with animated bell */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-md animate-bounce">
            <BellRing className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Notificação de Horário
            </span>
            <h3
              id="med-alert-title"
              className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight mt-1"
            >
              Hora do seu Remédio!
            </h3>
          </div>
          <button
            type="button"
            onClick={handleHearAgain}
            className="p-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl"
            title="Ouvir em voz alta"
            aria-label="Ouvir lembrete de remédio"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>

        {/* Medicine card details */}
        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 space-y-2">
          <div className="flex items-start gap-2.5">
            <Pill className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xl font-black text-emerald-950 dark:text-emerald-200 leading-tight">
                {medication.name}
              </p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                Dose: <span className="text-emerald-800 dark:text-emerald-300">{medication.dosage}</span>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1 mt-1">
                <Clock className="w-3.5 h-3.5" />
                Horário previsto: <strong>{scheduledTime}</strong>
              </p>
              {medication.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 mt-2">
                  Orientação: {medication.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={() => onConfirmTaken(medication.id)}
            className="btn-contrast-solid w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black py-4 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-base transition"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span>Já tomei meu remédio</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSnooze(medication.id, 10)}
              className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 font-bold py-3 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-amber-300 dark:border-amber-700 transition"
            >
              <Clock className="w-4 h-4" />
              <span>Adiar 10 min</span>
            </button>
            <button
              type="button"
              onClick={() => onSkipMed(medication.id)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700 transition"
            >
              <XCircle className="w-4 h-4" />
              <span>Não tomei</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-semibold py-1.5 text-center"
          >
            Fechar este aviso
          </button>
        </div>
      </div>
    </div>
  );
};
