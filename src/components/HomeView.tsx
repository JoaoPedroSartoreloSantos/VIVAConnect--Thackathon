import React from 'react';
import {
  HeartPulse,
  ShieldAlert,
  MapPin,
  MessageSquareHeart,
  PhoneCall,
  ScanText,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Volume2,
  ChevronRight,
  ShieldCheck,
  User,
  Smartphone,
} from 'lucide-react';
import { ActiveTab, HealthLog, MedicationReminder, TrustedContact, UserProfile } from '../types';
import { speakText } from '../utils/speech';
import { PermissionsSetupBanner } from './PermissionsSetupBanner';

interface HomeViewProps {
  onNavigate: (tab: ActiveTab) => void;
  currentUser: UserProfile;
  nextMedication?: MedicationReminder;
  medicationsCount: number;
  healthLogsCount: number;
  latestHealthLog?: HealthLog;
  onOpenRecordHealth: (preset?: { sys: string; dia: string }) => void;
  onUpdateMedicationStatus: (medId: string, status: 'taken' | 'skipped') => void;
  trustedContact: TrustedContact;
  onTriggerSOS?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  currentUser,
  nextMedication,
  medicationsCount,
  healthLogsCount,
  latestHealthLog,
  onOpenRecordHealth,
  onUpdateMedicationStatus,
  trustedContact,
  onTriggerSOS,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Olá, bom dia!';
    if (hour >= 12 && hour < 18) return 'Olá, boa tarde!';
    return 'Olá, boa noite!';
  };

  const handleHearWelcome = () => {
    const greeting = getGreeting();
    let text = `${greeting} VIVA Plus: Tecnologia que entende você. Enxergue, Entenda, Decida e Viva. `;
    text += `Leia informações, cuide da saúde e peça ajuda com autonomia. `;
    if (nextMedication) {
      text += `Próximo remédio: ${nextMedication.name} às ${nextMedication.time}. `;
    }
    text += `Toque nas opções: Ler e ouvir, Pedir ajuda, Minha saúde, Ajuda perto de mim ou Verificar mensagem.`;
    speakText(text);
  };

  const hasContact = Boolean(trustedContact.name && trustedContact.phone);

  return (
    <div className="space-y-3.5 pb-24">
      {/* 1. Welcoming Hero Banner: Autêntico, inclusivo e acolhedor */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-12 items-center">
          <div className="sm:col-span-5 relative h-28 sm:h-44 md:h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              src="/assets/senior_hero.svg"
              alt="Pessoa idosa utilizando smartphone com autonomia, serenidade e inclusão"
              className="w-full h-full object-cover object-[center_18%]"
              loading="eager"
            />
          </div>
          <div className="sm:col-span-7 p-3.5 sm:p-5 flex flex-col justify-center space-y-1 sm:space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">
                Tecnologia que entende você
              </span>
              <button
                onClick={handleHearWelcome}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition shrink-0"
                aria-label="Ouvir apresentação da tela inicial"
                title="Ouvir em voz alta"
              >
                <Volume2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Ouvir</span>
              </button>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
              Enxergue • Entenda • Decida • Viva.
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Leia informações, cuide da saúde e peça ajuda com autonomia.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Permissões de Câmera e Localização */}
      <PermissionsSetupBanner />

      {/* 3. Destaques principais: "Ler e ouvir" e "Pedir ajuda" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Botão 1: Ler e ouvir */}
        <button
          type="button"
          onClick={() => onNavigate('reader')}
          className="btn-contrast-solid w-full text-left bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 active:scale-[0.98] text-white p-4 sm:p-5 rounded-3xl border-2 border-teal-400 shadow-md hover:shadow-lg transition flex items-center gap-3.5 sm:gap-4 group min-h-[76px]"
          aria-label="Acessar Ler e ouvir: Fotografar remédio, bula ou ouvir qualquer texto"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
            <ScanText className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider bg-white/25 text-white px-2 py-0.5 rounded-full">
                Leitura
              </span>
              <ChevronRight className="w-5 h-5 opacity-80 group-hover:translate-x-1 transition shrink-0" />
            </div>
            <h2 className="text-base sm:text-lg font-black leading-tight text-white mt-0.5">
              Ler e ouvir
            </h2>
            <p className="text-xs text-teal-100 font-medium mt-0.5 line-clamp-2">
              Fotografe caixas de remédios, receitas e bulas ou ouça textos digitados.
            </p>
          </div>
        </button>

        {/* Botão 2: Pedir ajuda */}
        <button
          type="button"
          onClick={() => onNavigate('assistant')}
          className="btn-contrast-solid w-full text-left bg-gradient-to-r from-indigo-600 to-sky-700 hover:from-indigo-700 hover:to-sky-800 active:scale-[0.98] text-white p-4 sm:p-5 rounded-3xl border-2 border-indigo-400 shadow-md hover:shadow-lg transition flex items-center gap-3.5 sm:gap-4 group min-h-[76px]"
          aria-label="Acessar Pedir ajuda: Falar o que preciso no microfone ou tirar dúvidas"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition">
            <MessageSquareHeart className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider bg-white/25 text-white px-2 py-0.5 rounded-full">
                Voz e Chat
              </span>
              <ChevronRight className="w-5 h-5 opacity-80 group-hover:translate-x-1 transition shrink-0" />
            </div>
            <h2 className="text-base sm:text-lg font-black leading-tight text-white mt-0.5">
              Pedir ajuda
            </h2>
            <p className="text-xs text-indigo-100 font-medium mt-0.5 line-clamp-2">
              Toque para falar no microfone ou digite sua dúvida com calma.
            </p>
          </div>
        </button>
      </div>

      {/* 4. Ações de Apoio e Rotina */}
      <div className="px-1 flex items-center justify-between pt-1">
        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
          Mais ações de cuidado e rotina
        </h3>
        <span className="text-xs font-semibold text-slate-500">Toque para abrir:</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Minha Saúde (Pressão, Diabetes e Remédios) */}
        <button
          onClick={() => onNavigate('health')}
          className="w-full text-left bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-slate-800 p-4 rounded-3xl border-2 border-emerald-300 dark:border-emerald-700 shadow-sm hover:shadow-md transition active:scale-[0.98] flex sm:flex-col items-start gap-3.5 group"
          aria-label="Acessar Minha Saúde: Pressão, glicemia e remédios para acompanhamento"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                Minha saúde
              </h4>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 transition" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-snug">
              Anote pressão arterial, nível de diabetes (glicemia) e remédios para acompanhamento.
            </p>
            {latestHealthLog && (
              <div className="mt-2 flex flex-wrap gap-1">
                {latestHealthLog.systolic && latestHealthLog.diastolic && (
                  <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    Pressão: {latestHealthLog.systolic}/{latestHealthLog.diastolic}
                  </span>
                )}
                {latestHealthLog.glucose && (
                  <span className="text-[10px] font-black bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-lg border border-sky-200 dark:border-sky-800">
                    Glicemia: {latestHealthLog.glucose} mg/dL
                  </span>
                )}
              </div>
            )}
          </div>
        </button>

        {/* Card 2: Ajuda Perto de Mim */}
        <button
          onClick={() => onNavigate('places')}
          className="w-full text-left bg-white dark:bg-slate-900 hover:bg-sky-50/50 dark:hover:bg-slate-800 p-4 rounded-3xl border-2 border-sky-300 dark:border-sky-700 shadow-sm hover:shadow-md transition active:scale-[0.98] flex sm:flex-col items-start gap-3.5 group"
          aria-label="Acessar Ajuda Perto de Mim: Postos de saúde, farmácias e emergências"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                Ajuda perto de mim
              </h4>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0 transition" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-snug">
              Encontre postos de saúde (UBS), Farmácia Popular e telefones do SAMU 192.
            </p>
          </div>
        </button>

        {/* Card 3: Verificar Mensagem */}
        <button
          onClick={() => onNavigate('scam')}
          className="w-full text-left bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-slate-800 p-4 rounded-3xl border-2 border-amber-300 dark:border-amber-700 shadow-sm hover:shadow-md transition active:scale-[0.98] flex sm:flex-col items-start gap-3.5 group"
          aria-label="Acessar Verificar Mensagem: Avaliar se mensagem recebida é golpe"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                Verificar mensagem
              </h4>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 shrink-0 transition" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-snug">
              Analise mensagens de WhatsApp ou SMS para se proteger de fraudes e golpes.
            </p>
          </div>
        </button>
      </div>

      {/* 4. Próximo Remédio Programado (se houver) */}
      {nextMedication ? (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-sm border-l-8 border-l-sky-600 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              PRÓXIMO LEMBRETE PROGRAMADO
            </h3>
            <button
              onClick={() =>
                speakText(
                  `Lembrete: Seu remédio ${nextMedication.name}, dose ${nextMedication.dosage}, está programado para as ${nextMedication.time}.`
                )
              }
              className="text-sky-600 hover:text-sky-800 p-1 rounded-lg"
              aria-label="Ouvir lembrete de remédio"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <div>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">
              {nextMedication.name}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              {nextMedication.dosage} • <strong>Horário: {nextMedication.time}</strong>
            </p>
            {nextMedication.notes && (
              <p className="text-xs text-slate-500 italic mt-0.5">Obs: {nextMedication.notes}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                onUpdateMedicationStatus(nextMedication.id, 'taken');
                speakText(`Marcado que você tomou ${nextMedication.name}.`);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs sm:text-sm shadow transition"
              aria-label={`Confirmar que tomou ${nextMedication.name}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tomei</span>
            </button>
            <button
              onClick={() => {
                onUpdateMedicationStatus(nextMedication.id, 'skipped');
                speakText(`Marcado que não tomou ${nextMedication.name} agora.`);
              }}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 transition"
              aria-label={`Marcar que não tomou ${nextMedication.name}`}
            >
              <XCircle className="w-4 h-4 text-slate-500" />
              <span>Não tomei</span>
            </button>
          </div>
        </section>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Nenhum remédio cadastrado ainda
              </p>
              <p className="text-xs text-slate-500">
                Toque em "Minha saúde" para cadastrar seus medicamentos prescritos.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('health')}
            className="text-xs font-bold text-sky-600 hover:text-sky-800 shrink-0 flex items-center gap-1 py-1.5 px-2.5 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar</span>
          </button>
        </div>
      )}

      {/* 5. Conta e Privacidade */}
      {currentUser.isGuest ? (
        <section className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-black text-slate-800 dark:text-slate-200">
                Modo sem cadastro • Dados salvos neste aparelho
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Se desejar proteger seus dados, você pode entrar ou cadastrar com seu celular.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('auth')}
            className="btn-contrast-solid bg-sky-600 hover:bg-sky-700 text-white font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shrink-0"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Entrar com celular</span>
          </button>
        </section>
      ) : (
        <section className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-3 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-emerald-950 dark:text-emerald-200 font-bold truncate">
              Conta ativa: {currentUser.name} (Dados salvos com privacidade)
            </span>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="text-xs font-black text-emerald-700 dark:text-emerald-300 hover:underline shrink-0 flex items-center gap-1"
          >
            <User className="w-3.5 h-3.5" />
            <span>Meu Perfil</span>
          </button>
        </section>
      )}

      {/* 6. Emergency Contact Card: Opens SOS Pop-up directly */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-sm border-2 border-red-200 dark:border-red-900/60 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {hasContact ? 'Contato de Confiança Ativo' : 'Contato de Confiança Não Configurado'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {hasContact
                  ? `${trustedContact.name} (${trustedContact.relationship || 'Contato'}) • ${trustedContact.phone}`
                  : 'Cadastre alguém próximo para receber ligação e mensagem caso você precise.'}
              </p>
            </div>
          </div>
        </div>

        <div>
          {hasContact ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('sos')}
                className="btn-contrast-solid flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow"
              >
                <PhoneCall className="w-4 h-4 animate-pulse" />
                <span>Abrir Tela de SOS</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3 px-3.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700"
              >
                Editar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('sos')}
              className="btn-contrast-solid w-full bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black py-3 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Adicionar Contato de Confiança no SOS</span>
            </button>
          )}
        </div>
      </section>

      <div className="h-6 w-full shrink-0" aria-hidden="true" />
    </div>
  );
};
