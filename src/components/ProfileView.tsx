import React, { useState } from 'react';
import {
  User,
  Shield,
  Download,
  Trash2,
  LogOut,
  Heart,
  Save,
  Volume2,
  Sun,
  Moon,
  Contrast,
  Info,
  Smartphone,
  Users,
  PlusCircle,
  X,
  PhoneCall,
} from 'lucide-react';
import {
  AccessibilitySettings,
  CareNetworkMember,
  TrustedContact,
  UserProfile,
} from '../types';
import {
  saveTrustedContactForUser,
  getCareNetworkForUser,
  saveCareNetworkForUser,
  exportUserDataJson,
  deleteUserData,
  updateUserProfile,
} from '../utils/storage';
import { speakText } from '../utils/speech';

interface ProfileViewProps {
  currentUser: UserProfile;
  contact: TrustedContact;
  settings: AccessibilitySettings;
  onUpdateContact: (contact: TrustedContact) => void;
  onUpdateSettings: (settings: AccessibilitySettings) => void;
  onNavigateAuth: () => void;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  contact,
  settings,
  onUpdateContact,
  onUpdateSettings,
  onNavigateAuth,
  onLogout,
  onNavigateHome,
}) => {
  const [userName, setUserName] = useState(currentUser.name);
  const [userEmail, setUserEmail] = useState(currentUser.email || '');
  const [isEditingData, setIsEditingData] = useState(false);
  const [dataFeedback, setDataFeedback] = useState<string | null>(null);

  const [contactName, setContactName] = useState(contact.name || '');
  const [contactRel, setContactRel] = useState(contact.relationship || '');
  const [contactPhone, setContactPhone] = useState(contact.phone || '');
  const [hasWhatsApp, setHasWhatsApp] = useState(contact.hasWhatsApp !== false);
  const [contactFeedback, setContactFeedback] = useState<string | null>(null);

  const [careNetwork, setCareNetwork] = useState<CareNetworkMember[]>(() =>
    getCareNetworkForUser(currentUser.id)
  );
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  const [isDeletingData, setIsDeletingData] = useState(false);

  const handleSaveUserData = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...currentUser,
      name: userName.trim() || currentUser.name,
      email: userEmail.trim() || undefined,
    };
    updateUserProfile(updated);
    setIsEditingData(false);
    setDataFeedback('Seus dados foram atualizados com sucesso!');
    speakText('Seus dados foram atualizados com sucesso.');
    setTimeout(() => setDataFeedback(null), 3000);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TrustedContact = {
      name: contactName.trim(),
      relationship: contactRel.trim() || 'Familiar / Amigo',
      phone: contactPhone.trim(),
      hasWhatsApp,
    };
    onUpdateContact(updated);
    saveTrustedContactForUser(currentUser.id, updated);
    setContactFeedback('Contato principal salvo com sucesso!');
    speakText('Contato de emergência salvo com sucesso!');
    setTimeout(() => setContactFeedback(null), 3000);
  };

  const handleRemoveContact = () => {
    const empty: TrustedContact = {
      name: '',
      relationship: '',
      phone: '',
      hasWhatsApp: true,
    };
    setContactName('');
    setContactRel('');
    setContactPhone('');
    onUpdateContact(empty);
    saveTrustedContactForUser(currentUser.id, empty);
    setContactFeedback('Contato principal removido.');
    speakText('Contato removido.');
    setTimeout(() => setContactFeedback(null), 2500);
  };

  const handleAddCareMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberPhone.trim()) return;
    const newMember: CareNetworkMember = {
      id: `care_${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole.trim() || 'Apoio de Saúde',
      phone: newMemberPhone.trim(),
    };
    const updated = [...careNetwork, newMember];
    setCareNetwork(updated);
    saveCareNetworkForUser(currentUser.id, updated);
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberPhone('');
    setIsAddingMember(false);
    setContactFeedback(`Membro ${newMember.name} adicionado à sua rede de cuidado.`);
    speakText(`${newMember.name} adicionado à rede de cuidado.`);
    setTimeout(() => setContactFeedback(null), 3000);
  };

  const handleRemoveCareMember = (memberId: string) => {
    const updated = careNetwork.filter((m) => m.id !== memberId);
    setCareNetwork(updated);
    saveCareNetworkForUser(currentUser.id, updated);
    speakText('Membro removido da rede de cuidado.');
  };

  const handleExportData = () => {
    try {
      const dataStr = exportUserDataJson(currentUser.id);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meus_dados_vivaplus_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      speakText('Arquivo de dados exportado para o seu aparelho.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDeleteData = () => {
    deleteUserData(currentUser.id);
    setIsDeletingData(false);
    speakText('Todos os seus dados foram excluídos deste aparelho.');
    onLogout();
    onNavigateHome();
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                Meu Perfil
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                Gerencie seus dados, acessibilidade e sua rede de cuidado.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              speakText(
                'Tela Meu Perfil. Dividida em três áreas: Meus dados, Minhas preferências de acessibilidade e Minha rede de cuidado.'
              )
            }
            className="p-2 text-sky-600 hover:text-sky-800 rounded-xl"
            aria-label="Ouvir instruções do perfil"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ÁREA 1: MEUS DADOS */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border-2 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-black">
              1
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Meus Dados
            </h3>
          </div>
          {!currentUser.isGuest && (
            <button
              onClick={() => setIsEditingData(!isEditingData)}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 dark:text-sky-400 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              {isEditingData ? 'Cancelar' : 'Alterar meus dados'}
            </button>
          )}
        </div>

        {dataFeedback && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-400 text-xs font-bold text-emerald-900 dark:text-emerald-200">
            {dataFeedback}
          </div>
        )}

        {currentUser.isGuest ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border-2 border-amber-300 dark:border-amber-700 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black text-sm">
              <Info className="w-4 h-4 text-amber-600" />
              <span>Você está no Modo Convidado (Sem cadastro)</span>
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
              Suas anotações de saúde e remédios ficam guardadas na memória deste navegador.
            </p>
            <button
              type="button"
              onClick={onNavigateAuth}
              className="btn-contrast-solid w-full bg-sky-600 hover:bg-sky-700 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow"
            >
              <Smartphone className="w-4 h-4" />
              <span>Entrar ou criar conta com celular para proteger registros</span>
            </button>
          </div>
        ) : (
          <div>
            {!isEditingData ? (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {currentUser.name}
                  </span>
                  <span className="text-xs font-bold text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2.5 py-0.5 rounded-full">
                    {currentUser.role === 'familiar' ? 'Familiar / Cuidador' : 'Idoso(a) / Principal'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Celular cadastrado: <strong className="font-mono text-slate-900 dark:text-white">{currentUser.phone || 'Não informado'}</strong>
                </p>
                {currentUser.email && (
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    E-mail opcional: <strong className="text-slate-900 dark:text-white">{currentUser.email}</strong>
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveUserData} className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                    Nome:
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                    E-mail opcional:
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-contrast-solid bg-sky-600 hover:bg-sky-700 text-white font-black py-2.5 px-4 rounded-xl text-xs shadow"
                >
                  Salvar Alterações
                </button>
              </form>
            )}
          </div>
        )}

        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Onde seus dados ficam guardados?</span>
          </div>
          <p className="leading-relaxed">
            Seus registros de saúde ficam armazenados <strong>exclusivamente na memória deste aparelho</strong>. O aplicativo não vende seus dados nem exige CPF.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={handleExportData}
            className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-sky-600" />
            <span>Baixar meus dados (JSON)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDeletingData(true)}
            className="bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-red-300 dark:border-red-800 transition"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Excluir dados deste aparelho</span>
          </button>
        </div>

        {!currentUser.isGuest && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-slate-500 hover:text-red-600 font-bold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair da conta e voltar ao modo convidado</span>
            </button>
          </div>
        )}
      </section>

      {/* ÁREA 2: MINHAS PREFERÊNCIAS DE ACESSIBILIDADE */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border-2 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black">
            2
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              Minhas Preferências de Acessibilidade
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Ajuste cores, fontes e leitura para o seu conforto visual.
            </p>
          </div>
        </div>

        {/* 1. Theme Selection */}
        <div>
          <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-2">
            Contraste e Tema de Cores:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({ ...settings, theme: 'normal' });
                speakText('Modo claro ativado.');
              }}
              className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-1.5 ${
                settings.theme === 'normal'
                  ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-500 font-black'
                  : 'border-slate-300 dark:border-slate-700 bg-white text-slate-800 font-bold'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span className="text-xs">Modo Claro</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({ ...settings, theme: 'contrast' });
                speakText('Modo de alto contraste amarelo e preto ativado.');
              }}
              className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-1.5 ${
                settings.theme === 'contrast'
                  ? 'border-yellow-400 bg-black text-yellow-300 ring-2 ring-yellow-400 font-black'
                  : 'border-slate-700 bg-black text-yellow-300 font-bold'
              }`}
            >
              <Contrast className="w-5 h-5 text-yellow-400" />
              <span className="text-xs">Alto Contraste</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({ ...settings, theme: 'rest' });
                speakText('Modo escuro de descanso visual ativado.');
              }}
              className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-1.5 ${
                settings.theme === 'rest'
                  ? 'border-sky-500 bg-slate-900 text-white ring-2 ring-sky-500 font-black'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-900 text-slate-300 font-bold'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span className="text-xs">Modo Escuro</span>
            </button>
          </div>
        </div>

        {/* 2. Font Scaling */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-black text-slate-800 dark:text-slate-200">
              Tamanho do Texto no Aplicativo:
            </label>
            <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-md">
              {Math.round(settings.fontScale * 100)}%
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[1.0, 1.15, 1.3, 1.45].map((scale) => (
              <button
                key={scale}
                type="button"
                onClick={() => {
                  onUpdateSettings({ ...settings, fontScale: scale });
                  speakText(`Tamanho da letra ajustado para ${Math.round(scale * 100)} por cento.`);
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold border-2 transition ${
                  settings.fontScale === scale
                    ? 'btn-contrast-solid bg-sky-600 text-white border-sky-600 shadow'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800'
                }`}
              >
                {Math.round(scale * 100)}%
              </button>
            ))}
          </div>
        </div>

        {/* 3. Audio Voice Assistant Toggle */}
        <div className="pt-2 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white">
                Leitura em Voz Alta e Instruções
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Lê botões, medições e orientações em português natural.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !settings.voiceEnabled;
              onUpdateSettings({ ...settings, voiceEnabled: next });
              if (next) speakText('Voz ativada com sucesso.');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
              settings.voiceEnabled
                ? 'btn-contrast-solid bg-emerald-600 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {settings.voiceEnabled ? 'Ativada' : 'Desativada'}
          </button>
        </div>
      </section>

      {/* ÁREA 3: MINHA REDE DE CUIDADO */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border-2 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black">
            3
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              Minha Rede de Cuidado
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Pessoas de confiança, familiares e serviços de saúde que apoiam você.
            </p>
          </div>
        </div>

        {contactFeedback && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-400 text-xs font-bold text-emerald-900 dark:text-emerald-200">
            {contactFeedback}
          </div>
        )}

        {/* Contato Principal (SOS) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border-2 border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" />
              Contato de Emergência Principal (SOS)
            </span>
            {contact.name && (
              <button
                type="button"
                onClick={handleRemoveContact}
                className="text-[11px] text-slate-500 hover:text-red-600 font-bold"
              >
                Remover
              </button>
            )}
          </div>

          <form onSubmit={handleSaveContact} className="space-y-3">
            <div>
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                Nome ou apelido:
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ex: Filha Maria ou Vizinho Roberto"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                  Parentesco / Relação:
                </label>
                <input
                  type="text"
                  value={contactRel}
                  onChange={(e) => setContactRel(e.target.value)}
                  placeholder="Ex: Filha, Sobrinho, Cuidador"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                  Telefone com DDD:
                </label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(41) 98888-7777"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="contact-wa"
                checked={hasWhatsApp}
                onChange={(e) => setHasWhatsApp(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <label htmlFor="contact-wa" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Este número possui WhatsApp para receber mensagem com localização
              </label>
            </div>
            <button
              type="submit"
              className="btn-contrast-solid bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Contato de Emergência</span>
            </button>
          </form>
        </div>

        {/* Outros membros */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-600" />
              Outros Membros e Serviços da Rede ({careNetwork.length})
            </span>
            <button
              type="button"
              onClick={() => setIsAddingMember(!isAddingMember)}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 dark:text-sky-400 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isAddingMember ? 'Cancelar' : 'Adicionar Membro'}</span>
            </button>
          </div>

          {isAddingMember && (
            <form
              onSubmit={handleAddCareMember}
              className="p-3.5 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800 space-y-2.5"
            >
              <span className="text-xs font-black text-sky-900 dark:text-sky-200 block">
                Novo Membro da Rede de Cuidado:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nome (Ex: Dra. Ana)"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Função (Ex: Médica da UBS)"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <input
                  type="tel"
                  required
                  placeholder="Telefone (com DDD)"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="btn-contrast-solid bg-sky-600 hover:bg-sky-700 text-white font-black py-2 px-3 rounded-xl text-xs shadow"
              >
                Cadastrar na Rede de Cuidado
              </button>
            </form>
          )}

          {careNetwork.length === 0 && !isAddingMember ? (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              Nenhum outro membro cadastrado. Você pode incluir o posto de saúde, médico, vizinho ou outros familiares.
            </p>
          ) : (
            <div className="space-y-2">
              {careNetwork.map((member) => (
                <div
                  key={member.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {member.name}
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">
                      {member.role} • {member.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${member.phone.replace(/\D/g, '')}`}
                      className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-bold"
                      aria-label={`Ligar para ${member.name}`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveCareMember(member.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-xl"
                      aria-label={`Remover ${member.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal Deletion Confirmation */}
      {isDeletingData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border-2 border-red-500 shadow-2xl space-y-4">
            <div className="text-center">
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                Excluir todos os seus dados?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Esta ação apagará permanentemente suas medições de pressão, glicose, horários de remédios e contatos deste aparelho.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmDeleteData}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-2xl text-xs shadow transition"
              >
                Sim, apagar tudo deste aparelho
              </button>
              <button
                type="button"
                onClick={() => setIsDeletingData(false)}
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
