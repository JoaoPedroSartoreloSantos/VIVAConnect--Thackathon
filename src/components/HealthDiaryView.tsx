import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  PlusCircle,
  Clock,
  Trash2,
  FileText,
  Volume2,
  Pill,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  Smartphone,
  Info,
  BellRing,
  Sparkles,
} from 'lucide-react';
import { HealthLog, MedicationReminder, UserProfile } from '../types';
import { hasSeenGuestWarning, markGuestWarningSeen } from '../utils/storage';
import { speakText } from '../utils/speech';
import {
  testMedicationNotification,
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
} from '../utils/notifications';

interface HealthDiaryViewProps {
  logs: HealthLog[];
  onAddLog: (log: HealthLog) => void;
  onDeleteLog: (id: string) => void;
  medications: MedicationReminder[];
  onAddMedication: (med: MedicationReminder) => void;
  onDeleteMedication: (id: string) => void;
  onUpdateMedicationStatus: (id: string, status: 'taken' | 'skipped') => void;
  currentUser?: UserProfile;
  onNavigateAuth?: () => void;
}

export const HealthDiaryView: React.FC<HealthDiaryViewProps> = ({
  logs,
  onAddLog,
  onDeleteLog,
  medications,
  onAddMedication,
  onDeleteMedication,
  onUpdateMedicationStatus,
  currentUser,
  onNavigateAuth,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'records' | 'meds' | 'summary'>('records');
  const [showGuestPreNotice, setShowGuestPreNotice] = useState(false);

  // Form states for Health Measurement
  const [systolic, setSystolic] = useState<string>('');
  const [diastolic, setDiastolic] = useState<string>('');
  const [glucose, setGlucose] = useState<string>('');
  const [glucoseTiming, setGlucoseTiming] = useState<'jejum' | 'antes' | 'depois' | 'casual'>('jejum');
  const [notes, setNotes] = useState<string>('');
  const [isAddingLog, setIsAddingLog] = useState(false);

  // Form states for Medication
  const [medName, setMedName] = useState<string>('');
  const [medDosage, setMedDosage] = useState<string>('');
  const [medTime, setMedTime] = useState<string>('08:00');
  const [medNotes, setMedNotes] = useState<string>('');
  const [isAddingMed, setIsAddingMed] = useState(false);

  // Summary copy state
  const [copiedSummary, setCopiedSummary] = useState(false);

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();

    let finalSys = systolic.trim() ? Number(systolic) : undefined;
    let finalDia = diastolic.trim() ? Number(diastolic) : undefined;
    // Auto-normalize 12/8 shorthand
    if (finalSys && finalSys >= 9 && finalSys <= 25) finalSys *= 10;
    if (finalDia && finalDia >= 5 && finalDia <= 18) finalDia *= 10;

    const finalGlucose = glucose.trim() ? Number(glucose) : undefined;

    if (!finalSys && !finalDia && !finalGlucose) {
      speakText('Informe ao menos a pressão arterial ou a glicemia.');
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
    onAddLog(newLog);
    setIsAddingLog(false);
    setSystolic('');
    setDiastolic('');
    setGlucose('');
    setNotes('');
    speakText('Medição salva no seu histórico com sucesso.');
  };

  const handleSaveMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;
    const newMed: MedicationReminder = {
      id: `med-${Date.now()}`,
      name: medName.trim(),
      dosage: medDosage.trim() || '1 dose',
      time: medTime || '08:00',
      notes: medNotes.trim() || undefined,
    };
    onAddMedication(newMed);
    setMedName('');
    setMedDosage('');
    setMedNotes('');
    setIsAddingMed(false);
    speakText(`Remédio ${newMed.name} adicionado aos lembretes.`);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const generateDoctorSummary = () => {
    let summary = `*RELATÓRIO DO DIÁRIO DE SAÚDE - VIVA+*\n`;
    summary += `Gerado em: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    summary += `--- MEDIÇÕES REGISTRADAS ---\n`;
    if (logs.length === 0) {
      summary += `Nenhuma medição registrada recentemente.\n`;
    } else {
      logs.slice(0, 10).forEach((l) => {
        summary += `  Data: ${formatDate(l.measuredAt)}\n`;
        if (l.systolic && l.diastolic) {
          summary += `  Pressão Arterial: ${l.systolic}/${l.diastolic} mmHg\n`;
        }
        if (l.glucose) {
          summary += `  Glicemia: ${l.glucose} mg/dL\n`;
        }
        if (l.notes) {
          summary += `  Obs: ${l.notes}\n`;
        }
        summary += `\n`;
      });
    }

    summary += `--- MEDICAMENTOS EM USO ---\n`;
    if (medications.length === 0) {
      summary += `Nenhum medicamento cadastrado.\n`;
    } else {
      medications.forEach((m) => {
        summary += `  ${m.name} (${m.dosage}) - Horário: ${m.time}${
          m.notes ? ` [${m.notes}]` : ''
        }\n`;
      });
    }

    summary += `\n*Aviso*: Dados informados voluntariamente pelo paciente. O VIVA+ não substitui avaliação clínica médica.`;
    return summary;
  };

  const handleCopySummary = () => {
    const text = generateDoctorSummary();
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    speakText('Resumo para o médico copiado para a área de transferência.');
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  const handleHearSummary = () => {
    const speech = `Resumo do seu diário de saúde. Você possui ${logs.length} medições salvas e ${medications.length} remédios cadastrados. Mostre este relatório ao seu médico na consulta.`;
    speakText(speech);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* View Header */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <HeartPulse className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                Minha Saúde: Pressão, Diabetes e Remédios
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                Acompanhe pressão arterial, nível de glicemia e horários de remédios com autonomia.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              speakText(
                'Tela Minha Saúde. Você pode registrar sua pressão pelos atalhos rápidos ou valores personalizados, acompanhar o diabetes e gerenciar seus remédios.'
              )
            }
            className="p-2 text-sky-600 hover:text-sky-800 rounded-xl"
            aria-label="Ouvir instruções de Minha Saúde"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Ethical Medical Notice */}
        <div className="mt-3 space-y-1.5">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
            <AlertCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span>
              <strong>Atenção médica:</strong> O VIVA+ não faz diagnósticos e nunca altera suas doses. Consulte sempre sua equipe de saúde.
            </span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Seus registros são salvos com segurança na memória deste aparelho e continuam disponíveis ao fechar e reabrir.
            </span>
          </div>
        </div>

        {/* Overview Health & Medications Hub */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {/* Card 1: Pressão e Diabetes */}
          <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                Pressão e Diabetes
              </span>
              <span className="text-[11px] font-bold text-slate-500">{logs.length} anotados</span>
            </div>
            {logs.length > 0 ? (
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex flex-wrap gap-2">
                {logs[0].systolic && logs[0].diastolic && (
                  <span className="bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                    Última pressão: <strong>{logs[0].systolic}/{logs[0].diastolic}</strong> mmHg
                  </span>
                )}
                {logs[0].glucose && (
                  <span className="bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200">
                    Glicemia: <strong>{logs[0].glucose}</strong> mg/dL
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Nenhuma medição anotada ainda hoje.
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('records');
                setIsAddingLog(true);
              }}
              className="btn-contrast-solid w-full text-xs font-black py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Anotar Pressão ou Glicemia</span>
            </button>
          </div>

          {/* Card 2: Remédios para Acompanhamento */}
          <div className="p-3.5 bg-sky-50/80 dark:bg-sky-950/40 rounded-2xl border-2 border-sky-300 dark:border-sky-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-sky-600" />
                Remédios para Acompanhamento
              </span>
              <span className="text-[11px] font-bold text-slate-500">{medications.length} cadastrados</span>
            </div>
            {medications.length > 0 ? (
              <div className="text-xs text-slate-800 dark:text-slate-100 font-bold">
                <span>Próximo: {medications[0].name} ({medications[0].dosage}) às {medications[0].time}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Nenhum remédio cadastrado para acompanhamento.
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('meds');
                setIsAddingMed(true);
              }}
              className="btn-contrast-solid w-full text-xs font-black py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-1 shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Cadastrar Remédio para Acompanhamento</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4 bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('records')}
            className={`py-3.5 px-2 text-xs font-black rounded-xl transition flex flex-col items-center justify-center text-center gap-1.5 ${
              activeSubTab === 'records'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-md border-2 border-emerald-400 dark:border-emerald-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="leading-tight">Pressão e Diabetes</span>
            <span className="text-[10px] opacity-75">({logs.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('meds')}
            className={`py-3.5 px-2 text-xs font-black rounded-xl transition flex flex-col items-center justify-center text-center gap-1.5 ${
              activeSubTab === 'meds'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-md border-2 border-sky-400 dark:border-sky-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Pill className="w-5 h-5 text-sky-600 shrink-0" />
            <span className="leading-tight">Remédios</span>
            <span className="text-[10px] opacity-75">({medications.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('summary')}
            className={`py-3.5 px-2 text-xs font-black rounded-xl transition flex flex-col items-center justify-center text-center gap-1.5 ${
              activeSubTab === 'summary'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-md border-2 border-purple-400 dark:border-purple-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-5 h-5 text-purple-600 shrink-0" />
            <span className="leading-tight">Resumo Médico</span>
            <span className="text-[10px] opacity-75">(Relatório)</span>
          </button>
        </div>
      </section>

      {/* SUB-TAB 1: MEDIÇÕES */}
      {activeSubTab === 'records' && (
        <section className="space-y-4">
          {/* Card de Atalhos Rápidos Comuns da Pressão - SEMPRE VISÍVEL */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border-2 border-emerald-400 dark:border-emerald-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Atalhos Rápidos Comuns da Pressão
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                Toque para preencher
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Escolha um dos valores comuns abaixo para preencher ou salvar sua pressão rapidamente:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSystolic('110');
                  setDiastolic('70');
                  setIsAddingLog(true);
                  speakText('Pressão 11 por 7 selecionada (110 por 70 mmHg, pressão ótima).');
                }}
                className={`btn-contrast-solid p-3 rounded-2xl border-2 text-left transition flex flex-col ${
                  systolic === '110' && diastolic === '70'
                    ? 'border-emerald-600 bg-emerald-100 dark:bg-emerald-950 font-black ring-2 ring-emerald-500'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-slate-900 dark:text-white">11 por 7</span>
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-emerald-200">Ótima</span>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-0.5">110 / 70 mmHg</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSystolic('120');
                  setDiastolic('80');
                  setIsAddingLog(true);
                  speakText('Pressão 12 por 8 selecionada (120 por 80 mmHg, padrão normal).');
                }}
                className={`btn-contrast-solid p-3 rounded-2xl border-2 text-left transition flex flex-col ${
                  systolic === '120' && diastolic === '80'
                    ? 'border-emerald-600 bg-emerald-100 dark:bg-emerald-950 font-black ring-2 ring-emerald-500'
                    : 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 hover:border-emerald-500 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-emerald-800 dark:text-emerald-300">12 por 8 ⭐</span>
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-emerald-200">Padrão</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">120 / 80 mmHg</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSystolic('130');
                  setDiastolic('80');
                  setIsAddingLog(true);
                  speakText('Pressão 13 por 8 selecionada (130 por 80 mmHg, nível de atenção).');
                }}
                className={`btn-contrast-solid p-3 rounded-2xl border-2 text-left transition flex flex-col ${
                  systolic === '130' && diastolic === '80'
                    ? 'border-amber-600 bg-amber-100 dark:bg-amber-950 font-black ring-2 ring-amber-500'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-amber-500 hover:bg-amber-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-slate-900 dark:text-white">13 por 8</span>
                  <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-amber-200">Atenção</span>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-0.5">130 / 80 mmHg</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSystolic('140');
                  setDiastolic('90');
                  setIsAddingLog(true);
                  speakText('Pressão 14 por 9 selecionada (140 por 90 mmHg, hipertensão leve).');
                }}
                className={`btn-contrast-solid p-3 rounded-2xl border-2 text-left transition flex flex-col ${
                  systolic === '140' && diastolic === '90'
                    ? 'border-orange-600 bg-orange-100 dark:bg-orange-950 font-black ring-2 ring-orange-500'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-orange-500 hover:bg-orange-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-orange-900 dark:text-orange-300">14 por 9</span>
                  <span className="text-[10px] font-black uppercase text-orange-700 dark:text-orange-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-orange-200">Alta</span>
                </div>
                <span className="text-xs font-bold text-orange-700 dark:text-orange-400 mt-0.5">140 / 90 mmHg</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSystolic('150');
                  setDiastolic('90');
                  setIsAddingLog(true);
                  speakText('Pressão 15 por 9 selecionada (150 por 90 mmHg, hipertensão estágio 2).');
                }}
                className={`btn-contrast-solid p-3 rounded-2xl border-2 text-left transition flex flex-col ${
                  systolic === '150' && diastolic === '90'
                    ? 'border-red-600 bg-red-100 dark:bg-red-950 font-black ring-2 ring-red-500'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-red-500 hover:bg-red-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-red-900 dark:text-red-300">15 por 9</span>
                  <span className="text-[10px] font-black uppercase text-red-700 dark:text-red-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-red-200">Alta</span>
                </div>
                <span className="text-xs font-bold text-red-700 dark:text-red-400 mt-0.5">150 / 90 mmHg</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSystolic('160');
                  setDiastolic('100');
                  setIsAddingLog(true);
                  speakText('Pressão 16 por 10 selecionada (160 por 100 mmHg, hipertensão moderada a alta).');
                }}
                className={`btn-contrast-solid p-3 rounded-2xl border-2 text-left transition flex flex-col ${
                  systolic === '160' && diastolic === '100'
                    ? 'border-red-700 bg-red-200 dark:bg-red-950 font-black ring-2 ring-red-600'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-red-600 hover:bg-red-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-red-900 dark:text-red-300">16 por 10</span>
                  <span className="text-[10px] font-black uppercase text-red-800 dark:text-red-300 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-red-300">Elevada</span>
                </div>
                <span className="text-xs font-bold text-red-800 dark:text-red-400 mt-0.5">160 / 100 mmHg</span>
              </button>
            </div>
          </div>

          {!isAddingLog ? (
            <button
              onClick={() => setIsAddingLog(true)}
              className="btn-contrast-solid w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-4 rounded-3xl shadow-md flex items-center justify-center gap-2.5 text-base transition active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Anotar Outro Valor ou Diabetes (Glicemia)</span>
            </button>
          ) : (
            <form
              onSubmit={handleSaveMeasurement}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border-2 border-emerald-400 dark:border-emerald-700 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-emerald-600" />
                  Confirmar Registro de Medição
                </h3>
                <span className="text-xs text-slate-500 font-bold">Hoje • {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Blood Pressure Section */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Valores da Pressão Arterial (mmHg)
                  </span>
                  <span className="text-[11px] text-slate-500">Ex: 120 por 80</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                      Pressão Máxima (Sistólica)
                    </label>
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      placeholder="Ex: 120 ou 12"
                      min="1"
                      max="300"
                      className="w-full p-3 rounded-2xl border-2 border-slate-400 dark:border-slate-600 text-lg font-black bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">Em mmHg</span>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                      Pressão Mínima (Diastólica)
                    </label>
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      placeholder="Ex: 80 ou 8"
                      min="1"
                      max="200"
                      className="w-full p-3 rounded-2xl border-2 border-slate-400 dark:border-slate-600 text-lg font-black bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">Em mmHg</span>
                  </div>
                </div>
              </div>

              {/* Glucose Section */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-800 dark:text-sky-300">
                    Diabetes / Glicemia (mg/dL) - Opcional
                  </span>
                </div>

                {/* Timing selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => setGlucoseTiming('jejum')}
                    className={`py-1.5 px-1.5 text-xs font-bold rounded-xl border transition ${
                      glucoseTiming === 'jejum'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Em Jejum
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlucoseTiming('antes')}
                    className={`py-1.5 px-1.5 text-xs font-bold rounded-xl border transition ${
                      glucoseTiming === 'antes'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Antes da Refeição
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlucoseTiming('depois')}
                    className={`py-1.5 px-1.5 text-xs font-bold rounded-xl border transition ${
                      glucoseTiming === 'depois'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Após Comer (2h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlucoseTiming('casual')}
                    className={`py-1.5 px-1.5 text-xs font-bold rounded-xl border transition ${
                      glucoseTiming === 'casual'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Ao Longo do Dia
                  </button>
                </div>

                <div>
                  <input
                    type="number"
                    value={glucose}
                    onChange={(e) => setGlucose(e.target.value)}
                    placeholder="Ex: 95 ou 110"
                    min="20"
                    max="600"
                    className="w-full p-3 rounded-2xl border-2 border-slate-400 dark:border-slate-600 text-lg font-black bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">Valor lido no glicosímetro</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                  Observações (como você está se sentindo) - Opcional
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Em jejum, antes do café, senti leve tontura..."
                  className="w-full p-3 rounded-2xl border-2 border-slate-400 dark:border-slate-600 text-sm font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingLog(false)}
                  className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-3 rounded-2xl text-xs sm:text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-contrast-solid flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-xs sm:text-sm shadow-md"
                >
                  Salvar Medição
                </button>
              </div>
            </form>
          )}

          {/* Modal Guest Pre-Notice */}
          {showGuestPreNotice && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-md w-full border-2 border-amber-400 dark:border-amber-600 shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                      Aviso de Modo Convidado
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Entenda como seus dados são guardados sem cadastro.
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-amber-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-amber-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
                  <div className="flex items-start gap-2">
                    <strong className="text-amber-700 dark:text-amber-400 shrink-0">1. Onde salva:</strong>
                    <span>Ficam salvos <strong>exclusivamente na memória deste navegador</strong> neste aparelho.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <strong className="text-emerald-700 dark:text-emerald-400 shrink-0">2. Fechar o app:</strong>
                    <span>Ao fechar e reabrir o aplicativo neste navegador, seus registros continuam aqui.</span>
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      markGuestWarningSeen();
                      setShowGuestPreNotice(false);
                      setIsAddingLog(true);
                    }}
                    className="btn-contrast-solid w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 font-black py-3 px-4 rounded-2xl text-xs sm:text-sm shadow flex items-center justify-center gap-2"
                  >
                    <span>Continuar anotando sem cadastro</span>
                  </button>
                  {onNavigateAuth && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowGuestPreNotice(false);
                        onNavigateAuth();
                      }}
                      className="w-full bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-900 dark:text-sky-200 font-black py-2.5 px-4 rounded-2xl text-xs border border-sky-300 dark:border-sky-800 flex items-center justify-center gap-2"
                    >
                      <Smartphone className="w-4 h-4 text-sky-600" />
                      <span>Entrar com celular</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Records List */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">
              Histórico de Medições ({logs.length})
            </h3>
            {logs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center border border-slate-200 dark:border-slate-800">
                <HeartPulse className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                  Nenhuma medição anotada ainda.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Toque no botão verde acima para fazer seu primeiro registro de pressão ou glicemia.
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(log.measuredAt)}
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {log.systolic && log.diastolic && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                            Pressão:{' '}
                          </span>
                          <strong className="text-base text-emerald-900 dark:text-emerald-200">
                            {log.systolic} / {log.diastolic}
                          </strong>
                          <span className="text-[10px] text-emerald-700 ml-0.5">mmHg</span>
                        </div>
                      )}
                      {log.glucose && (
                        <div className="bg-sky-50 dark:bg-sky-950/60 px-3 py-1 rounded-xl border border-sky-200 dark:border-sky-800">
                          <span className="text-xs text-sky-800 dark:text-sky-300 font-medium">
                            Glicemia:{' '}
                          </span>
                          <strong className="text-base text-sky-900 dark:text-sky-200">
                            {log.glucose}
                          </strong>
                          <span className="text-[10px] text-sky-700 ml-0.5">mg/dL</span>
                        </div>
                      )}
                    </div>
                    {log.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-0.5">
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => {
                        const text = `Medição de ${formatDate(log.measuredAt)}. ${
                          log.systolic ? `Pressão ${log.systolic} por ${log.diastolic}. ` : ''
                        }${log.glucose ? `Glicemia ${log.glucose}. ` : ''}${
                          log.notes ? `Observação: ${log.notes}` : ''
                        }`;
                        speakText(text);
                      }}
                      className="p-2 text-sky-600 hover:text-sky-800 rounded-xl"
                      aria-label="Ouvir esta medição"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-xl"
                      aria-label="Excluir medição"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* SUB-TAB 2: REMÉDIOS */}
      {activeSubTab === 'meds' && (
        <section className="space-y-3">
          {/* Notification Banner with Test Button */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-3xl border-2 border-emerald-300 dark:border-emerald-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-emerald-600 animate-pulse" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Avisos e Notificações de Horário
                </h4>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                getNotificationPermission() === 'granted'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
              }`}>
                {getNotificationPermission() === 'granted' ? 'Notificações Ativas ✅' : 'Toque para Ativar'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              O VIVA+ avisa no horário exato com som, voz acessível e notificação do aparelho quando for o momento de tomar cada remédio.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {getNotificationPermission() !== 'granted' && isNotificationSupported() && (
                <button
                  type="button"
                  onClick={async () => {
                    const granted = await requestNotificationPermission();
                    if (granted) {
                      speakText('Notificações de remédios ativadas com sucesso neste aparelho.');
                    }
                  }}
                  className="btn-contrast-solid bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <BellRing className="w-4 h-4" />
                  <span>Permitir Notificações no Aparelho</span>
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  const res = await testMedicationNotification();
                  if (!res.permissionGranted) {
                    speakText(res.message);
                  }
                }}
                className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-black py-3 px-4 rounded-xl text-xs sm:text-sm border border-emerald-300 dark:border-emerald-700 flex items-center gap-2 transition cursor-pointer shadow-sm"
              >
                <Volume2 className="w-4 h-4" />
                <span>Testar Notificação com Som Agora</span>
              </button>
            </div>
          </div>
          {!isAddingMed ? (
            <button
              onClick={() => setIsAddingMed(true)}
              className="btn-contrast-solid w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-3.5 px-4 rounded-3xl shadow-md flex items-center justify-center gap-2 text-base transition active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Cadastrar Remédio para Acompanhamento</span>
            </button>
          ) : (
            <form
              onSubmit={handleSaveMedication}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-sky-300 dark:border-sky-800 space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pill className="w-5 h-5 text-sky-600" />
                Cadastrar Remédio para Acompanhamento
              </h3>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Remédio:
                </label>
                <input
                  type="text"
                  required
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="Ex: Losartana Potássica"
                  className="w-full p-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 text-base font-bold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dose (ex: 50mg, 1 cp)
                  </label>
                  <input
                    type="text"
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    placeholder="Ex: 50 mg - 1 cp"
                    className="w-full p-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horário do Lembrete
                  </label>
                  <input
                    type="time"
                    required
                    value={medTime}
                    onChange={(e) => setMedTime(e.target.value)}
                    className="w-full p-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 text-sm font-bold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Instruções da receita (opcional)
                </label>
                <input
                  type="text"
                  value={medNotes}
                  onChange={(e) => setMedNotes(e.target.value)}
                  placeholder="Ex: Tomar com água após o almoço..."
                  className="w-full p-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex gap-4 pt-3.5">
                <button
                  type="button"
                  onClick={() => setIsAddingMed(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3.5 px-4 rounded-2xl text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-contrast-solid flex-1 bg-sky-600 hover:bg-sky-700 text-white font-black py-3.5 px-4 rounded-2xl text-sm shadow-md transition cursor-pointer"
                >
                  Salvar Remédio
                </button>
              </div>
            </form>
          )}

          {/* Medications List */}
          <div className="space-y-3">
            {medications.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center border border-slate-200 dark:border-slate-800">
                <Pill className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                  Nenhum remédio cadastrado no momento.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Cadastre seus medicamentos prescritos para não esquecer os horários.
                </p>
              </div>
            ) : (
              medications.map((med) => (
                <div
                  key={med.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                          {med.name}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {med.dosage} • <strong>Horário: {med.time}</strong>
                        </p>
                        {med.notes && (
                          <p className="text-[11px] text-slate-500 italic mt-0.5">
                            Obs: {med.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() =>
                          speakText(
                            `Remédio ${med.name}, dose ${med.dosage}, horário programado: ${med.time}.`
                          )
                        }
                        className="p-2 text-sky-600 hover:text-sky-800 rounded-xl"
                        aria-label="Ouvir informações do remédio"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteMedication(med.id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-xl"
                        aria-label="Excluir remédio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Status Verification */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-500">Hoje:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onUpdateMedicationStatus(med.id, 'taken');
                          speakText(`Marcado que você tomou ${med.name}.`);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                          med.lastTakenStatus === 'taken'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                        }`}
                        aria-label={`Confirmar que tomou ${med.name}`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{med.lastTakenStatus === 'taken' ? 'Tomado hoje ✓' : 'Tomei'}</span>
                      </button>
                      <button
                        onClick={() => {
                          onUpdateMedicationStatus(med.id, 'skipped');
                          speakText(`Marcado que não tomou ${med.name}.`);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                          med.lastTakenStatus === 'skipped'
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300'
                        }`}
                        aria-label={`Marcar que não tomou ${med.name}`}
                      >
                        <XCircle className="w-4 h-4 text-slate-500" />
                        <span>{med.lastTakenStatus === 'skipped' ? 'Não tomado' : 'Não tomei'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* SUB-TAB 3: RESUMO PARA O MÉDICO */}
      {activeSubTab === 'summary' && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Resumo para Consulta Médica
              </h3>
            </div>
            <button
              onClick={handleHearSummary}
              className="p-1.5 text-purple-600 hover:text-purple-800 rounded-xl"
              aria-label="Ouvir resumo em voz alta"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Você pode mostrar esta tela diretamente para seu médico ou enfermeiro durante a consulta, ou copiar o texto para enviar no WhatsApp dele.
          </p>
          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed max-h-80 overflow-y-auto">
            {generateDoctorSummary()}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleCopySummary}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow transition active:scale-95"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Resumo para o Médico</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
