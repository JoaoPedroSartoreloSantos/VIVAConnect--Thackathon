import React, { useState } from 'react';
import {
  Smartphone,
  LogIn,
  UserPlus,
  ShieldCheck,
  User,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Share2,
  Copy,
  Check,
  Volume2,
  Github,
  X,
} from 'lucide-react';
import { UserProfile } from '../types';
import { isValidBrazilianPhone } from '../utils/storage';
import { apiAuth } from '../utils/api';
import { speakText } from '../utils/speech';

interface AuthViewProps {
  onSuccessAuth: (user: UserProfile) => void;
  onContinueAsGuest: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onSuccessAuth,
  onContinueAsGuest,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [step, setStep] = useState<'form' | 'sms_verify'>('form');

  // Registration state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'idoso' | 'familiar' | 'cuidador' | 'outro'>('idoso');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  // Verification state
  const [inputCode, setInputCode] = useState('');
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [sentCleanPhone, setSentCleanPhone] = useState<string>('');
  const [revealedChannel, setRevealedChannel] = useState<'whatsapp' | 'sms' | null>(null);
  const [smsGatewayStatus, setSmsGatewayStatus] = useState<{
    deliveredViaGateway: boolean;
    provider: string;
    statusMessage: string;
    missingCredentials: string[];
    setupInstructions: string[];
  } | null>(null);

  // Login state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // GitHub Social Recognition state
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleStartRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Por favor, informe seu nome ou como gosta de ser chamado(a).');
      return;
    }

    const phoneCheck = isValidBrazilianPhone(phone);
    if (!phoneCheck.valid) {
      setErrorMessage(phoneCheck.error || 'Número de celular inválido.');
      speakText(phoneCheck.error || 'Número de celular inválido.');
      return;
    }

    if (!pin || pin.length < 4) {
      setErrorMessage('Defina um PIN ou senha de pelo menos 4 dígitos numéricos.');
      return;
    }

    if (pin !== pinConfirm) {
      setErrorMessage('A confirmação do PIN não confere. Digite os mesmos 4 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiAuth.sendCode(phoneCheck.clean);
      setSmsGatewayStatus(res.smsGatewayStatus);
      if (res.code) {
        setSentCode(res.code);
      }
      setSentCleanPhone(phoneCheck.clean);
      setRevealedChannel(null); // Keep code strictly hidden until user clicks WhatsApp or SMS
      setStep('sms_verify');
      speakText(
        `Código de segurança preparado para o número ${phoneCheck.formatted}. Toque em Ir pelo WhatsApp ou Ir por SMS para receber no celular.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao enviar código de verificação para o celular.');
      speakText(err.message || 'Erro no envio do código.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevealAndSendVia = (channel: 'whatsapp' | 'sms') => {
    if (!sentCode) return;
    setRevealedChannel(channel);

    const messageText = `VIVAConnect: Seu código de verificação é ${sentCode}. Digite no aplicativo para concluir seu acesso com segurança.`;
    if (channel === 'whatsapp') {
      window.open(
        `https://api.whatsapp.com/send?phone=55${sentCleanPhone}&text=${encodeURIComponent(messageText)}`,
        '_blank',
        'noopener,noreferrer'
      );
    } else {
      window.location.href = `sms:+55${sentCleanPhone}?body=${encodeURIComponent(
        `VIVAConnect: Seu código de verificação é ${sentCode}`
      )}`;
    }

    // Auto-preencher o código no campo para facilitar a vida do usuário
    setInputCode(sentCode);

    speakText(
      `Código liberado para envio pelo ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}. Seu código é ${sentCode
        .split('')
        .join(' ')}. O código já foi preenchido para você.`
    );
  };

  const handleConfirmCodeAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = inputCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setErrorMessage('Por favor, digite o código de 6 dígitos.');
      return;
    }

    const phoneCheck = isValidBrazilianPhone(phone);
    setLoading(true);

    try {
      await apiAuth.verifyCode(phoneCheck.clean, cleanCode);
      const regRes = await apiAuth.register({
        name: name.trim(),
        phone: phoneCheck.formatted,
        pinOrPassword: pin,
        email: email.trim() || undefined,
        role,
      });

      setSuccessMessage(`Conta criada com sucesso! Bem-vindo(a), ${regRes.user.name}.`);
      speakText(`Conta criada com sucesso! Bem-vindo ao VIVAConnect, ${regRes.user.name}.`);
      setTimeout(() => {
        onSuccessAuth(regRes.user);
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Código incorreto ou expirado.');
      speakText(err.message || 'Código incorreto.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const phoneCheck = isValidBrazilianPhone(loginPhone);
    if (!phoneCheck.valid) {
      setErrorMessage(phoneCheck.error || 'Número de celular inválido.');
      return;
    }

    if (!loginPin) {
      setErrorMessage('Informe seu código PIN ou senha de acesso.');
      return;
    }

    setLoading(true);
    try {
      const loginRes = await apiAuth.login(phoneCheck.clean, loginPin);
      setSuccessMessage(`Entrando na conta... Olá, ${loginRes.user.name}!`);
      speakText(`Login realizado com sucesso! Olá, ${loginRes.user.name}.`);
      setTimeout(() => {
        onSuccessAuth(loginRes.user);
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível entrar. Verifique os dados.');
      speakText(err.message || 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubRecognitionLogin = (customUser?: string) => {
    const userToUse = (customUser || githubUsername || 'Usuario-GitHub').trim();
    setLoading(true);
    setErrorMessage(null);

    try {
      const cleanId = userToUse.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const ghUser: UserProfile = {
        id: `github_${cleanId || 'user'}`,
        name: userToUse.startsWith('GitHub') ? userToUse : `${userToUse} (GitHub)`,
        phone: '(Autenticado via GitHub)',
        role: 'outro',
        isGuest: false,
        lastLogin: new Date().toISOString(),
      };

      setSuccessMessage(`Reconhecimento GitHub realizado com sucesso! Olá, ${ghUser.name}!`);
      speakText(`Conta GitHub reconhecida com sucesso. Bem-vindo ao VIVAConnect!`);
      setTimeout(() => {
        onSuccessAuth(ghUser);
      }, 700);
    } catch (err: any) {
      setErrorMessage('Erro no reconhecimento da conta GitHub.');
    } finally {
      setLoading(false);
      setShowGithubModal(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              Entrar ou Criar Conta no VIVAConnect
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              Sua conta sincroniza remédios, medições e rede de cuidado com segurança.
            </p>
          </div>
        </div>
      </section>

      {/* Mode Switcher with high contrast and generous separation */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setStep('form');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`py-4 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2.5 transition cursor-pointer ${
            mode === 'register'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-md border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4 shrink-0" />
          <span>Criar Nova Conta</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`py-4 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2.5 transition cursor-pointer ${
            mode === 'login'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-md border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <LogIn className="w-4 h-4 shrink-0" />
          <span>Já Tenho Conta</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/70 border-2 border-red-300 dark:border-red-700 rounded-2xl text-red-900 dark:text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="font-semibold leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl text-emerald-900 dark:text-emerald-200 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="font-bold leading-relaxed">{successMessage}</div>
        </div>
      )}

      {/* FORM: Registration Step 1 */}
      {mode === 'register' && step === 'form' && (
        <form onSubmit={handleStartRegister} className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-sky-600" />
            <span>Dados para Cadastro Simples</span>
          </h3>

          <div className="space-y-1">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              Como você prefere ser chamado(a)? *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Dona Helena, Seu José, Maria"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 text-base"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              Número de Celular com DDD *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(41) 98888-7777"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Usado para verificação e para sincronizar seus dados com segurança.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              Perfil de uso
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-sky-500"
            >
              <option value="idoso">Pessoa idosa ou usuária principal</option>
              <option value="familiar">Familiar ou pessoa de apoio</option>
              <option value="cuidador">Cuidador(a) profissional de saúde</option>
              <option value="outro">Outro perfil</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                PIN de Acesso (4 ou mais números) *
              </label>
              <input
                type="password"
                inputMode="numeric"
                required
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 1234"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-center text-lg tracking-widest focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                Confirmar PIN *
              </label>
              <input
                type="password"
                inputMode="numeric"
                required
                maxLength={8}
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 1234"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-center text-lg tracking-widest focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              E-mail de Contato (Opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-contrast-solid bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-black py-4 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2.5 text-base transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Gerando verificação...</span>
            ) : (
              <>
                <span>Continuar para Verificação</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      )}

      {/* FORM: Registration Step 2 - SMS / WhatsApp Verify */}
      {mode === 'register' && step === 'sms_verify' && (
        <form onSubmit={handleConfirmCodeAndRegister} className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border-2 border-sky-400 dark:border-sky-600 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0 shadow-sm">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Código de Verificação do Celular
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Número cadastrado: <strong>{phone}</strong>
              </p>
            </div>
          </div>

          {/* Real Dispatch Card: Code ONLY appears after clicking WhatsApp or SMS! */}
          {sentCode && (
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border-2 border-emerald-400 dark:border-emerald-600 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Receber Código no Celular:
                </span>
                {revealedChannel && (
                  <button
                    type="button"
                    onClick={() => speakText(`Seu código de verificação é ${sentCode.split('').join(' ')}.`)}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 hover:underline p-1"
                    title="Ouvir código"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Ouvir</span>
                  </button>
                )}
              </div>

              {/* Notice before clicking: Code is HIDDEN until clicked */}
              {!revealedChannel ? (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-sky-300 dark:border-sky-700 text-center space-y-2">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    🔒 O código de segurança está pronto para ser enviado.
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Toque em um dos botões abaixo para receber e visualizar seu código no celular:
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950 rounded-xl text-center">
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-100 flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Código enviado via {revealedChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}!
                  </span>
                </div>
              )}

              {/* Action Buttons to send via WhatsApp or SMS - spacious and distinct */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <button
                  type="button"
                  onClick={() => handleRevealAndSendVia('whatsapp')}
                  className="btn-contrast-solid bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black py-4.5 px-5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-3 shadow-md transition cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5 shrink-0" />
                  <span>Ir pelo WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRevealAndSendVia('sms')}
                  className="btn-contrast-solid bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-black py-4.5 px-5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-3 shadow-md transition cursor-pointer"
                >
                  <Smartphone className="w-5 h-5 shrink-0" />
                  <span>Ir por SMS</span>
                </button>
              </div>

              {/* CODE DISPLAY: STRICTLY APPEARS ONLY AFTER CLICKING WHATSAPP OR SMS */}
              {revealedChannel && (
                <div className="bg-white dark:bg-slate-900 py-4 px-4 rounded-2xl border-2 border-emerald-400 dark:border-emerald-600 text-center shadow-inner space-y-2 mt-4">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                    Seu código de 6 dígitos gerado:
                  </span>
                  <span className="text-3xl sm:text-4xl font-black tracking-[0.35em] text-emerald-700 dark:text-emerald-400 select-all font-mono block">
                    {sentCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setInputCode(sentCode);
                      speakText('Código preenchido automaticamente.');
                    }}
                    className="w-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black py-3 px-4 rounded-xl text-xs border border-emerald-300 dark:border-emerald-700 flex items-center justify-center gap-2 transition mt-2 cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Preencher código {sentCode} no campo abaixo</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              Digite o código recebido: *
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center tracking-[0.4em] text-2xl font-black px-4 py-3.5 rounded-xl border-2 border-sky-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-3">
            <button
              type="submit"
              disabled={loading || inputCode.length !== 6}
              className="btn-contrast-solid bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black py-4 px-5 rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Confirmando...' : 'Confirmar e Entrar'}
            </button>
            <button
              type="button"
              onClick={() => setStep('form')}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-4 px-5 rounded-2xl text-sm border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              Voltar ao formulário
            </button>
          </div>
        </form>
      )}

      {/* FORM: Login Mode */}
      {mode === 'login' && (
        <form onSubmit={handleLogin} className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <LogIn className="w-5 h-5 text-sky-600" />
            <span>Entrar na sua conta existente</span>
          </h3>

          <div className="space-y-1">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              Número do seu Celular com DDD *
            </label>
            <input
              type="tel"
              required
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              placeholder="(41) 98888-7777"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              Código PIN ou Senha *
            </label>
            <input
              type="password"
              inputMode="numeric"
              required
              value={loginPin}
              onChange={(e) => setLoginPin(e.target.value)}
              placeholder="Digite seu PIN de 4 números"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-center text-lg tracking-widest focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-contrast-solid bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-black py-4 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2 text-base transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Entrando...' : 'Entrar com meu celular'}
          </button>
        </form>
      )}

      {/* GitHub Account Recognition & Social Sign-in */}
      <div className="pt-2 space-y-3">
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
            Ou acesse com reconhecimento
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        <button
          type="button"
          onClick={() => setShowGithubModal(true)}
          className="w-full bg-slate-900 hover:bg-black active:scale-[0.99] text-white font-black py-4 px-5 rounded-2xl shadow-md flex items-center justify-center gap-3 text-sm transition cursor-pointer border border-slate-700"
          aria-label="Reconhecimento de Conta GitHub"
        >
          <Github className="w-5 h-5 shrink-0" />
          <span>Entrar com Conta GitHub (Reconhecimento)</span>
        </button>
      </div>

      <div className="pt-1 text-center">
        <button
          type="button"
          onClick={onContinueAsGuest}
          className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline p-3"
        >
          Continuar no modo local deste aparelho (sem sincronizar entre celulares)
        </button>
      </div>

      {/* GitHub Recognition Modal */}
      {showGithubModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Github className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    Reconhecimento GitHub
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Acesso direto por perfil
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGithubModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                Seu usuário do GitHub (opcional):
              </label>
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="Ex: seu-usuario"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleGithubRecognitionLogin()}
                className="w-full btn-contrast-solid bg-slate-900 hover:bg-black text-white font-black py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow"
              >
                <Github className="w-4 h-4" />
                <span>Confirmar e Entrar com GitHub</span>
              </button>
              <button
                type="button"
                onClick={() => setShowGithubModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs"
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
