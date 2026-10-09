/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AccessibilitySettings,
  ActiveTab,
  HealthLog,
  MedicationReminder,
  TrustedContact,
  UserProfile,
} from './types';
import {
  getSettings,
  saveSettings,
  getCurrentUser,
  getHealthLogsForUser,
  saveHealthLogsForUser,
  getMedicationsForUser,
  saveMedicationsForUser,
  getTrustedContactForUser,
  saveTrustedContactForUser,
  logout,
  switchToGuestMode,
} from './utils/storage';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { ScamDetectorView } from './components/ScamDetectorView';
import { HealthDiaryView } from './components/HealthDiaryView';
import { NearMeView } from './components/NearMeView';
import { SOSView } from './components/SOSView';
import { FloatingSOSButton } from './components/FloatingSOSButton';
import { AssistedReaderView } from './components/AssistedReaderView';
import { AskVivaView } from './components/AskVivaView';
import { AuthView } from './components/AuthView';
import { ProfileView } from './components/ProfileView';
import { CaregiverNetworkView } from './components/CaregiverNetworkView';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineBanner } from './components/OfflineBanner';
import { AboutModal } from './components/AboutModal';
import { RecordHealthMeasurementModal } from './components/RecordHealthMeasurementModal';
import { MedicationAlertModal } from './components/MedicationAlertModal';
import {
  sendMedicationNotification,
  requestNotificationPermission,
  isNotificationSupported,
} from './utils/notifications';
import { speakText } from './utils/speech';

export default function App() {
  const [settings, setSettings] = useState<AccessibilitySettings>(getSettings);
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser);
  const [currentTab, setCurrentTab] = useState<ActiveTab>('home');
  // Track previous screen before user tapped the SOS button
  const [previousTab, setPreviousTab] = useState<ActiveTab>('home');

  const [healthLogs, setHealthLogs] = useState<HealthLog[]>(() =>
    getHealthLogsForUser(getCurrentUser().id)
  );
  const [medications, setMedications] = useState<MedicationReminder[]>(() =>
    getMedicationsForUser(getCurrentUser().id)
  );
  const [trustedContact, setTrustedContact] = useState<TrustedContact>(() =>
    getTrustedContactForUser(getCurrentUser().id)
  );
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isRecordHealthModalOpen, setIsRecordHealthModalOpen] = useState(false);
  const [healthPreset, setHealthPreset] = useState<{ sys?: string; dia?: string } | undefined>(undefined);

  // Active in-app medication alert state
  const [activeMedicationAlert, setActiveMedicationAlert] = useState<{
    medication: MedicationReminder;
    scheduledTime: string;
  } | null>(null);

  const notifiedRemindersRef = useRef<Set<string>>(new Set());

  // Request notification permission once on app mount if supported
  useEffect(() => {
    if (isNotificationSupported() && Notification.permission === 'default') {
      requestNotificationPermission().catch(() => {});
    }
  }, []);

  // Interval ticker: check medication schedule every 15 seconds
  useEffect(() => {
    const normalizeTime = (rawTime: string) => {
      const parts = rawTime.trim().split(':');
      if (parts.length >= 2) {
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
      return rawTime.trim();
    };

    const checkSchedules = () => {
      if (medications.length === 0) return;
      const now = new Date();
      const currentHoursMinutes = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      medications.forEach((med) => {
        const allTimes = new Set<string>();
        if (med.time) allTimes.add(normalizeTime(med.time));
        if (Array.isArray(med.schedules)) {
          med.schedules.forEach((t) => allTimes.add(normalizeTime(t)));
        }

        allTimes.forEach((scheduledTime) => {
          if (scheduledTime === currentHoursMinutes) {
            const reminderKey = `${med.id}_${todayDate}_${scheduledTime}`;
            if (!notifiedRemindersRef.current.has(reminderKey)) {
              notifiedRemindersRef.current.add(reminderKey);

              // 1. Send system browser push notification + chime sound + voice
              sendMedicationNotification(med, scheduledTime);

              // 2. Open prominent in-app alert modal
              setActiveMedicationAlert({
                medication: med,
                scheduledTime,
              });
            }
          }
        });
      });
    };

    checkSchedules();
    const intervalId = setInterval(checkSchedules, 10000);
    return () => clearInterval(intervalId);
  }, [medications]);

  const handleOpenRecordHealth = (preset?: { sys: string; dia: string }) => {
    setHealthPreset(preset);
    setIsRecordHealthModalOpen(true);
  };

  // Synchronize CSS class and CSS variables on mount & settings change
  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(`theme-${settings.theme}`);
    document.documentElement.style.setProperty('--font-scale', `${settings.fontScale}`);
  }, [settings]);

  // When user profile changes (switch account, login, logout), reload partitioned data
  useEffect(() => {
    const activeId = currentUser.id;
    setHealthLogs(getHealthLogsForUser(activeId));
    setMedications(getMedicationsForUser(activeId));
    setTrustedContact(getTrustedContactForUser(activeId));
  }, [currentUser.id]);

  const handleUpdateSettings = (newSettings: AccessibilitySettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleAddHealthLog = (newLog: HealthLog) => {
    const updated = [newLog, ...healthLogs];
    setHealthLogs(updated);
    saveHealthLogsForUser(currentUser.id, updated);
  };

  const handleDeleteHealthLog = (id: string) => {
    const updated = healthLogs.filter((l) => l.id !== id);
    setHealthLogs(updated);
    saveHealthLogsForUser(currentUser.id, updated);
  };

  const handleAddMedication = (newMed: MedicationReminder) => {
    const updated = [...medications, newMed];
    setMedications(updated);
    saveMedicationsForUser(currentUser.id, updated);
  };

  const handleDeleteMedication = (id: string) => {
    const updated = medications.filter((m) => m.id !== id);
    setMedications(updated);
    saveMedicationsForUser(currentUser.id, updated);
  };

  const handleUpdateMedicationStatus = (id: string, status: 'taken' | 'skipped') => {
    const today = new Date().toISOString().split('T')[0];
    const updated = medications.map((m) =>
      m.id === id ? { ...m, lastTakenDate: today, lastTakenStatus: status } : m
    );
    setMedications(updated);
    saveMedicationsForUser(currentUser.id, updated);
  };

  const handleUpdateContact = (newContact: TrustedContact) => {
    setTrustedContact(newContact);
    saveTrustedContactForUser(currentUser.id, newContact);
  };

  const handleSuccessAuth = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentTab('home');
  };

  const handleLogout = () => {
    logout();
    const guest = switchToGuestMode();
    setCurrentUser(guest);
    setCurrentTab('home');
  };

  // Navigating to SOS: store the current screen as the previous screen
  const handleTriggerSOS = () => {
    setPreviousTab(currentTab !== 'sos' ? currentTab : 'home');
    setCurrentTab('sos');
  };

  // Returning from SOS back to the screen the user was on
  const handleBackFromSOS = () => {
    setCurrentTab(previousTab !== 'sos' ? previousTab : 'home');
  };

  // Map of human-readable tab names
  const tabNames: Record<ActiveTab, string> = {
    home: 'Início',
    reader: 'Ler e ouvir',
    health: 'Minha Saúde',
    places: 'Ajuda Perto',
    assistant: 'Pedir Ajuda',
    scam: 'Verificar Mensagem',
    profile: 'Meu Perfil',
    auth: 'Entrar com Celular',
    caregiver: 'Rede de Cuidado',
    sos: 'Emergência SOS',
  };

  // Find next pending medication for today
  const nextMedication =
    medications.length > 0
      ? medications.find((m) => m.lastTakenStatus !== 'taken') || medications[0]
      : undefined;

  // Screen audio descriptions for accessibility "Ouvir" button in Header
  const screenDescriptions: Record<ActiveTab, string> = {
    home: `Tela inicial do VIVA Plus, tecnologia que entende você. Cuide da sua rotina, entenda informações e encontre ajuda quando precisar. Você pode acessar Minha Saúde, Verificar Mensagem, Ajuda Perto de Mim ou Falar com o VIVA Plus.`,
    scam: `Tela de verificação de mensagens suspeitas. Cole o texto ou link recebido no WhatsApp ou SMS para analisar possíveis sinais de golpe com inteligência artificial, com total segurança.`,
    health: `Tela do diário de saúde. Registre sua pressão arterial, glicemia e remédios para acompanhar sua rotina e gerar um resumo para mostrar ao seu médico.`,
    places: `Tela de ajuda perto de você. Encontre postos de saúde, unidades de pronto atendimento, farmácias com orientação sobre a Farmácia Popular e telefones do SAMU 192 e Bombeiros 193.`,
    reader: `Tela Ler e ouvir. Fotografe caixas de remédios, receitas e bulas com a câmera, escolha uma foto salva ou digite qualquer texto para ouvir em voz alta com a função Explique para mim.`,
    sos: `Tela de emergência SOS. Contato cadastrado: ${
      trustedContact.name || 'Nenhum contato cadastrado ainda'
    }. Toque no botão de voltar para retornar à tela anterior. Ao tocar para ligar ou enviar WhatsApp, o aplicativo pedirá sua confirmação antes de abrir a discagem.`,
    assistant: `Tela Pedir Ajuda ao VIVA Plus. Assistente inteligente para tirar dúvidas sobre o uso do aplicativo, suas medições de saúde e dicas de proteção. Você pode digitar ou falar ao microfone.`,
    profile: `Tela Meu Perfil. Aqui você pode cadastrar e alterar seu contato de confiança, ajustar o contraste e tamanho da letra, e consultar, baixar ou excluir seus dados deste aparelho.`,
    auth: `Tela de Entrada e Cadastro do VIVA Plus. Crie sua conta simples com celular ou entre na sua conta para acessar seus registros com segurança.`,
    caregiver: `Tela da Rede de Cuidado e Acompanhamento. Vincule o aplicativo a familiares ou cuidadores para acompanhamento em tempo real e avisos sincronizados.`,
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-150 relative">
      {/* Header with consistent VIVA+ logo on the left, Account button, font zoom, contrast themes, and Info button */}
      <Header
        settings={settings}
        currentUser={currentUser}
        onUpdateSettings={handleUpdateSettings}
        onOpenAbout={() => setIsAboutOpen(true)}
        onNavigateHome={() => setCurrentTab('home')}
        onNavigateProfile={() => setCurrentTab('profile')}
        onNavigateAuth={() => setCurrentTab('auth')}
        screenDescription={screenDescriptions[currentTab] || screenDescriptions.home}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-3 sm:p-4 pb-36 sm:pb-40">
        {/* Offline Banner indicator */}
        <OfflineBanner />

        {/* PWA Install Invitation Banner */}
        <PWAInstallBanner />

        {/* Tab views */}
        {currentTab === 'home' && (
          <HomeView
            onNavigate={(tab) => setCurrentTab(tab)}
            currentUser={currentUser}
            nextMedication={nextMedication}
            medicationsCount={medications.length}
            healthLogsCount={healthLogs.length}
            latestHealthLog={healthLogs[0]}
            onOpenRecordHealth={handleOpenRecordHealth}
            onUpdateMedicationStatus={handleUpdateMedicationStatus}
            trustedContact={trustedContact}
            onTriggerSOS={handleTriggerSOS}
          />
        )}

        {currentTab === 'auth' && (
          <AuthView
            onSuccessAuth={handleSuccessAuth}
            onContinueAsGuest={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            contact={trustedContact}
            settings={settings}
            onUpdateContact={handleUpdateContact}
            onUpdateSettings={handleUpdateSettings}
            onNavigateAuth={() => setCurrentTab('auth')}
            onLogout={handleLogout}
            onNavigateHome={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'scam' && <ScamDetectorView />}

        {currentTab === 'health' && (
          <HealthDiaryView
            logs={healthLogs}
            onAddLog={handleAddHealthLog}
            onDeleteLog={handleDeleteHealthLog}
            medications={medications}
            onAddMedication={handleAddMedication}
            onDeleteMedication={handleDeleteMedication}
            onUpdateMedicationStatus={handleUpdateMedicationStatus}
            currentUser={currentUser}
            onNavigateAuth={() => setCurrentTab('auth')}
          />
        )}

        {currentTab === 'places' && <NearMeView />}

        {currentTab === 'reader' && (
          <AssistedReaderView
            onNavigate={(tab) => setCurrentTab(tab)}
            onAddMedication={handleAddMedication}
            settings={settings}
          />
        )}

        {currentTab === 'assistant' && (
          <AskVivaView
            onNavigate={(tab) => setCurrentTab(tab)}
            healthLogs={healthLogs}
            medications={medications}
            hasTrustedContact={!!trustedContact.phone}
            contact={trustedContact}
            settings={settings}
            onTriggerSOS={handleTriggerSOS}
          />
        )}

        {currentTab === 'sos' && (
          <SOSView
            contact={trustedContact}
            onUpdateContact={handleUpdateContact}
            onNavigateProfile={() => setCurrentTab('profile')}
            onBack={handleBackFromSOS}
            previousTabName={tabNames[previousTab] || 'Início'}
          />
        )}

        {currentTab === 'caregiver' && (
          <CaregiverNetworkView
            currentUser={currentUser}
            onNavigateAuth={() => setCurrentTab('auth')}
          />
        )}

        {/* Guaranteed bottom spacing safe-area */}
        <div className="h-16 sm:h-20 w-full shrink-0" aria-hidden="true" />
      </main>

      {/* Floating SOS Pop-up Button on Screen: Only when not already on the SOS view */}
      {currentTab !== 'sos' && (
        <FloatingSOSButton onTriggerSOS={handleTriggerSOS} />
      )}

      {/* Accessible Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab !== 'sos') {
            setPreviousTab(tab);
          }
          setCurrentTab(tab);
        }}
      />

      {/* About & Privacy Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Direct Blood Pressure & Diabetes Measurement Modal */}
      <RecordHealthMeasurementModal
        isOpen={isRecordHealthModalOpen}
        onClose={() => {
          setIsRecordHealthModalOpen(false);
          setHealthPreset(undefined);
        }}
        initialSys={healthPreset?.sys}
        initialDia={healthPreset?.dia}
        onSaveLog={handleAddHealthLog}
      />

      {/* Medication Reminder Alarm Notification Modal */}
      <MedicationAlertModal
        medication={activeMedicationAlert?.medication || null}
        scheduledTime={activeMedicationAlert?.scheduledTime || ''}
        onConfirmTaken={(medId) => {
          handleUpdateMedicationStatus(medId, 'taken');
          speakText('Muito bem! Marcado que você tomou seu remédio.');
          setActiveMedicationAlert(null);
        }}
        onSkipMed={(medId) => {
          handleUpdateMedicationStatus(medId, 'skipped');
          speakText('Marcado que você não tomou este remédio agora.');
          setActiveMedicationAlert(null);
        }}
        onSnooze={(medId, minutes) => {
          const med = activeMedicationAlert?.medication;
          speakText(`Lembrete adiado em ${minutes} minutos. O aplicativo avisará novamente.`);
          setActiveMedicationAlert(null);
          if (med) {
            setTimeout(() => {
              const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              sendMedicationNotification(med, nowTime);
              setActiveMedicationAlert({
                medication: med,
                scheduledTime: nowTime,
              });
            }, minutes * 60 * 1000);
          }
        }}
        onClose={() => setActiveMedicationAlert(null)}
      />
    </div>
  );
}
