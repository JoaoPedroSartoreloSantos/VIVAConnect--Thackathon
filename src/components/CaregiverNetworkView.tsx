import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Bell,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  HeartPulse,
  Pill,
  Shield,
} from 'lucide-react';
import {
  CaregiverInvite,
  CaregiverLink,
  CaregiverNotification,
  CaregiverPermissions,
  MedicationReminder,
  MedicationDose,
  HealthLog,
  UserProfile,
} from '../types';
import { apiCaregiver } from '../utils/api';
import { speakText } from '../utils/speech';

interface CaregiverNetworkViewProps {
  currentUser: UserProfile;
  onNavigateAuth: () => void;
}

export const CaregiverNetworkView: React.FC<CaregiverNetworkViewProps> = ({
  currentUser,
  onNavigateAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'my_caregivers' | 'my_patients' | 'notifications'>(
    currentUser.role === 'cuidador' || currentUser.role === 'familiar'
      ? 'my_patients'
      : 'my_caregivers'
  );

  const [patientLinks, setPatientLinks] = useState<CaregiverLink[]>([]);
  const [activeInvite, setActiveInvite] = useState<CaregiverInvite | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [invitePermissions, setInvitePermissions] = useState<CaregiverPermissions>({
    viewMedications: true,
    receiveAlerts: true,
    viewVitals: true,
    viewLocation: true,
  });
  const [alertIntervalMinutes, setAlertIntervalMinutes] = useState<number>(30);
  const [copiedCode, setCopiedCode] = useState(false);

  const [caregiverLinks, setCaregiverLinks] = useState<CaregiverLink[]>([]);
  const [inputInviteCode, setInputInviteCode] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientData, setSelectedPatientData] = useState<{
    patientName: string;
    patientPhone: string;
    permissions: CaregiverPermissions;
    alertIntervalMinutes: number;
    medications?: MedicationReminder[];
    todayDoses?: MedicationDose[];
    healthLogs?: HealthLog[];
  } | null>(null);

  const [notifications, setNotifications] = useState<CaregiverNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser.isGuest) {
      loadData();
    }
  }, [currentUser.id, currentUser.isGuest]);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [pLinks, cLinks, notifs] = await Promise.all([
        apiCaregiver.getPatientLinks().catch(() => []),
        apiCaregiver.getMyPatients().catch(() => []),
        apiCaregiver.getNotifications().catch(() => []),
      ]);
      setPatientLinks(pLinks);
      setCaregiverLinks(cLinks);
      setNotifications(notifs);

      if (cLinks.length > 0 && !selectedPatientId) {
        handleSelectPatient(cLinks[0].patientId);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patientId: string) => {
    setSelectedPatientId(patientId);
    try {
      const data = await apiCaregiver.getPatientData(patientId);
      setSelectedPatientData(data);
    } catch (err: any) {
      console.error(err);
      setSelectedPatientData(null);
    }
  };

  const handleGenerateInvite = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const invite = await apiCaregiver.createInvite(invitePermissions, alertIntervalMinutes);
      setActiveInvite(invite);
      setIsCreatingInvite(false);
      setSuccessMsg(`Código de convite ${invite.code} gerado com sucesso!`);
      speakText(`Código gerado: ${invite.code}. Compartilhe com quem vai cuidar de você.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao gerar convite.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputInviteCode.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiCaregiver.acceptInvite(inputInviteCode.trim());
      setInputInviteCode('');
      setSuccessMsg('Vínculo com a pessoa idosa estabelecido com sucesso!');
      speakText('Vínculo realizado com sucesso.');
      loadData();
      if (res.link) {
        handleSelectPatient(res.link.patientId);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Não foi possível vincular com este código.');
      speakText(err.message || 'Erro no vínculo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    if (!confirm('Deseja realmente revogar este vínculo?')) {
      return;
    }
    setLoading(true);
    try {
      await apiCaregiver.revokeLink(linkId);
      setSuccessMsg('Vínculo revogado.');
      speakText('Vínculo revogado.');
      loadData();
      if (selectedPatientId) setSelectedPatientData(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao revogar vínculo.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await apiCaregiver.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    speakText(`Código ${code} copiado.`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (currentUser.isGuest) {
    return (
      <div className="space-y-4 pb-20">
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-sky-100 dark:bg-sky-950 text-sky-600 mx-auto flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Rede de Apoio e Vínculo entre Dois Aparelhos
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1.5 max-w-md mx-auto">
              Para convidar um cuidador, autorizar permissões de saúde e receber avisos sincronizados em dois celulares, é necessário entrar na sua conta.
            </p>
          </div>
          <button
            onClick={onNavigateAuth}
            className="btn-contrast-solid bg-sky-600 hover:bg-sky-700 text-white font-black py-3 px-6 rounded-2xl text-sm shadow inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Entrar ou Criar Minha Conta</span>
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                Rede de Apoio e Cuidado
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                Vínculo seguro entre o celular da pessoa idosa e o do cuidador autorizado.
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition shrink-0"
            title="Atualizar dados"
            aria-label="Atualizar dados da rede"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-2 mt-4 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('my_caregivers')}
            className={`py-2.5 px-3 rounded-xl font-black transition flex items-center justify-center gap-1.5 ${
              activeTab === 'my_caregivers'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Meus Cuidadores</span>
            {patientLinks.length > 0 && (
              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {patientLinks.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my_patients')}
            className={`py-2.5 px-3 rounded-xl font-black transition flex items-center justify-center gap-1.5 ${
              activeTab === 'my_patients'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Pessoas que Cuido</span>
            {caregiverLinks.length > 0 && (
              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {caregiverLinks.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`py-2.5 px-3 rounded-xl font-black transition flex items-center justify-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Avisos</span>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </button>
        </div>
      </section>

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/70 border-2 border-red-300 dark:border-red-700 rounded-2xl text-red-900 dark:text-red-200 text-sm flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="font-semibold leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl text-emerald-900 dark:text-emerald-200 text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="font-bold leading-relaxed">{successMsg}</div>
        </div>
      )}

      {/* TAB 1: MEUS CUIDADORES */}
      {activeTab === 'my_caregivers' && (
        <div className="space-y-4">
          {activeInvite && (
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-300 dark:border-emerald-700 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Código de Convite Ativo
                </span>
                <span className="text-xs text-slate-500">Válido por 7 dias</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white dark:bg-slate-900 py-3 px-4 rounded-2xl border-2 border-dashed border-emerald-400 font-mono text-2xl font-black text-center tracking-wider text-emerald-700 dark:text-emerald-300">
                  {activeInvite.code}
                </div>
                <button
                  onClick={() => handleCopyCode(activeInvite.code)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center gap-1.5 text-xs shadow transition shrink-0"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Passe este código para o familiar ou cuidador digitar no aplicativo VIVA+ no celular dele.
              </p>
            </div>
          )}

          {!isCreatingInvite ? (
            <button
              onClick={() => setIsCreatingInvite(true)}
              className="w-full btn-contrast-solid bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-5 rounded-3xl shadow-md flex items-center justify-center gap-2 text-sm transition"
            >
              <UserPlus className="w-5 h-5" />
              <span>Convidar Familiar ou Cuidador para Acompanhar</span>
            </button>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border-2 border-indigo-300 dark:border-indigo-700 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Escolha o que Compartilhar</span>
                </h3>
                <button
                  onClick={() => setIsCreatingInvite(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invitePermissions.viewMedications}
                    onChange={(e) =>
                      setInvitePermissions({ ...invitePermissions, viewMedications: e.target.checked })
                    }
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <p className="font-black text-slate-900 dark:text-white">
                      Ver meus remédios prescritos e horários
                    </p>
                    <p className="text-slate-500">
                      O cuidador vê a lista dos remédios e o status do dia.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invitePermissions.receiveAlerts}
                    onChange={(e) =>
                      setInvitePermissions({ ...invitePermissions, receiveAlerts: e.target.checked })
                    }
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <p className="font-black text-slate-900 dark:text-white">
                      Receber avisos se eu não confirmar um remédio
                    </p>
                    <p className="text-slate-500">
                      Aviso enviado ao cuidador caso a dose permaneça como "Ainda não confirmei".
                    </p>
                  </div>
                </label>

                {invitePermissions.receiveAlerts && (
                  <div className="pl-8 pt-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tempo de tolerância antes do aviso:
                    </label>
                    <select
                      value={alertIntervalMinutes}
                      onChange={(e) => setAlertIntervalMinutes(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value={15}>15 minutos após o horário</option>
                      <option value={30}>30 minutos após o horário (Recomendado)</option>
                      <option value={60}>1 hora após o horário</option>
                      <option value={120}>2 horas após o horário</option>
                    </select>
                  </div>
                )}

                <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invitePermissions.viewVitals}
                    onChange={(e) =>
                      setInvitePermissions({ ...invitePermissions, viewVitals: e.target.checked })
                    }
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <p className="font-black text-slate-900 dark:text-white">
                      Ver anotações de pressão arterial e glicemia
                    </p>
                    <p className="text-slate-500">
                      Permite que o familiar acompanhe as medições feitas em casa.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invitePermissions.viewLocation}
                    onChange={(e) =>
                      setInvitePermissions({ ...invitePermissions, viewLocation: e.target.checked })
                    }
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <p className="font-black text-slate-900 dark:text-white">
                      Receber minha localização em caso de SOS
                    </p>
                    <p className="text-slate-500">
                      Ajuda a pessoa a saber onde você está em caso de emergência.
                    </p>
                  </div>
                </label>
              </div>

              <button
                type="button"
                onClick={handleGenerateInvite}
                disabled={loading}
                className="w-full btn-contrast-solid bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 px-4 rounded-2xl shadow flex items-center justify-center gap-2 text-sm"
              >
                {loading ? 'Gerando...' : 'Gerar Código de Convite Seguro'}
              </button>
            </div>
          )}

          {/* List */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Cuidadores e Familiares com Acesso Autorizado ({patientLinks.length})</span>
            </h3>
            {patientLinks.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-6 text-center text-xs text-slate-500 space-y-1">
                <Users className="w-8 h-8 mx-auto text-slate-400 mb-1" />
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  Nenhum cuidador vinculado no momento.
                </p>
                <p>Toque no botão acima para gerar um convite seguro.</p>
              </div>
            ) : (
              patientLinks.map((link) => (
                <div
                  key={link.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {link.caregiverName}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        Celular: {link.caregiverPhone}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Vinculado desde: {new Date(link.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevokeLink(link.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                      title="Revogar acesso"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Revogar</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PESSOAS QUE CUIDO */}
      {activeTab === 'my_patients' && (
        <div className="space-y-4">
          <form onSubmit={handleAcceptInvite} className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <span>Vincular-se a uma Pessoa Idosa / Paciente</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Digite o código de convite (ex: VIVA-1234) gerado no aplicativo da pessoa que você cuida:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={inputInviteCode}
                onChange={(e) => setInputInviteCode(e.target.value.toUpperCase())}
                placeholder="VIVA-0000"
                className="flex-1 font-mono font-black text-lg tracking-wider px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
              />
              <button
                type="submit"
                disabled={loading || !inputInviteCode.trim()}
                className="btn-contrast-solid bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow transition disabled:opacity-50"
              >
                {loading ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
          </form>

          {caregiverLinks.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-6 text-center text-xs text-slate-500 space-y-1">
              <Users className="w-8 h-8 mx-auto text-slate-400 mb-1" />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                Você ainda não está vinculado(a) a nenhuma pessoa.
              </p>
              <p>Peça para a pessoa idosa gerar um código de convite no menu "Meus Cuidadores" dela.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {caregiverLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => handleSelectPatient(link.patientId)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black shrink-0 border transition flex items-center gap-2 ${
                      selectedPatientId === link.patientId
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <span>{link.patientName}</span>
                    <span className="text-[10px] opacity-75">({link.patientPhone})</span>
                  </button>
                ))}
              </div>

              {selectedPatientData && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white">
                        Acompanhamento de {selectedPatientData.patientName}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {selectedPatientData.patientPhone} • Atualização em tempo real
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectPatient(selectedPatientId!)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Atualizar</span>
                    </button>
                  </div>

                  {selectedPatientData.permissions.viewMedications && (
                    <div className="space-y-3">
                      <h5 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-sky-600" />
                        Remédios e Status das Doses de Hoje
                      </h5>
                      {!selectedPatientData.medications || selectedPatientData.medications.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">
                          Nenhum medicamento cadastrado pelo paciente.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5">
                          {selectedPatientData.medications.map((med) => {
                            const schedules = med.schedules && med.schedules.length > 0 ? med.schedules : [med.time || '08:00'];
                            return (
                              <div
                                key={med.id}
                                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-black text-sm text-slate-900 dark:text-white">
                                      {med.name}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                      Dose: {med.dosage} • Duração: {med.duration || 'Uso contínuo'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {schedules.map((time) => {
                                    const doseRecord = selectedPatientData.todayDoses?.find(
                                      (d) => d.medicationId === med.id && d.time === time
                                    );
                                    const status = doseRecord ? doseRecord.status : 'pending';
                                    return (
                                      <div
                                        key={time}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                                          status === 'taken'
                                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                            : status === 'skipped'
                                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                                            : 'bg-amber-100 text-amber-900 border-amber-300'
                                        }`}
                                      >
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{time}</span>
                                        <span className="font-black">
                                          {status === 'taken'
                                            ? '✓ Tomei'
                                            : status === 'skipped'
                                            ? '✗ Não tomei'
                                            : '⏳ Ainda não confirmei'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedPatientData.permissions.viewVitals && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <h5 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <HeartPulse className="w-4 h-4 text-emerald-600" />
                        Últimas Medições de Saúde
                      </h5>
                      {!selectedPatientData.healthLogs || selectedPatientData.healthLogs.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">
                          Nenhuma medição registrada recentemente.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {selectedPatientData.healthLogs.slice(0, 3).map((log) => (
                            <div
                              key={log.id}
                              className="text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {log.systolic && log.diastolic ? `Pressão: ${log.systolic}/${log.diastolic} mmHg` : ''}
                                  {log.glucose ? ` • Glicose: ${log.glucose} mg/dL` : ''}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {new Date(log.measuredAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NOTIFICAÇÕES */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center text-xs text-slate-500 space-y-1 border border-slate-200 dark:border-slate-800">
              <Bell className="w-8 h-8 mx-auto text-slate-400 mb-1" />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                Nenhum aviso recebido até o momento.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-3xl border shadow-sm transition space-y-2 ${
                  notif.read
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        notif.type === 'sos_alert'
                          ? 'bg-red-600 animate-ping'
                          : notif.type === 'dose_unconfirmed'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {notif.title}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(notif.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {notif.message}
                </p>
                {!notif.read && (
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => handleMarkNotificationRead(notif.id)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-300"
                    >
                      Marcar como lido
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
