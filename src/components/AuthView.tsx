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
      setRevealedChannel(null); // Keep code hidden until user clicks WhatsApp or SMS
      setStep('sms_verify');
      speakText(
        `Código de segurança pronto para o número ${phoneCheck.formatted}. Toque em WhatsApp ou SMS para receber seu código no celular.`
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

    const messageText = `VIVA+: Seu código de verificação é ${sentCode}. Digite no aplicativo para concluir seu acesso com segurança.`;
    if (channel === 'whatsapp') {
      window.open(
        `https://api.whatsapp.com/send?phone=55${sentCleanPhone}&text=${encodeURIComponent(messageText)}`,
        '_blank',
        'noopener,noreferrer'
      );
    } else {
      window.location.href = `sms:+55${sentCleanPhone}?body=${encodeURIComponent(
        `VIVA+: Seu código de verificação é ${sentCode}`
      )}`;
    }

    speakText(
      `Código liberado para envio pelo ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}. Seu código é ${sentCode
        .split('')
        .join(' ')}.`
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
      speakText(`Conta criada com sucesso! Bem-vindo, ${regRes.user.name}.`);
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

  return (
    <div className="space-y-4 pb-20">
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              Entrar ou Criar Conta no VIVA+
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              Sua conta sincroniza remédios, medições e rede de cuidado com segurança.
            </p>
          </div>
        </div>
        <div className="mt-3 p-3 bg-sky-50 dark:bg-sky-950/50 rounded-2xl border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            Proteção e Privacidade Garantidas
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Não solicitamos CPF como senha. As senhas são criptografadas e seus dados pertencem a você.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setStep('form');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition ${
            mode === 'register'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Criar Nova Conta</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition ${
            mode === 'login'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>Já Tenho Conta</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/70 border-2 border-red-300 dark:border-red-700 rounded-2xl text-red-900 dark:text-red-200 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="font-semibold leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl text-emerald-900 dark:text-emerald-200 text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="font-bold leading-relaxed">{successMessage}</div>
        </div>
      )}

      {mode === 'register' && step === 'form' && (
        <form onSubmit={handleStartRegister} className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-sky-600" />
            <span>Dados para Cadastro Simples</span>
          </h3>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
              Como você prefere ser chamado(a)? *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Dona Helena, Seu José, Maria"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 text-base"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
              Número de Celular com DDD *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(41) 98888-7777"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Usado para verificação por código de segurança e para entrar em outro celular.
            </p>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
              Perfil de uso
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-sky-500"
            >
              <option value="idoso">Pessoa idosa ou usuária principal</option>
              <option value="familiar">Familiar ou pessoa de apoio</option>
              <option value="cuidador">Cuidador(a) profissional de saúde</option>
              <option value="outro">Outro perfil</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
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
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-center text-lg tracking-widest focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
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
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-center text-lg tracking-widest focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
              E-mail de Contato (Opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-contrast-solid bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-black py-4 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2 text-base transition disabled:opacity-50"
          >
            {loading ? (
              <span>Enviando código...</span>
            ) : (
              <>
                <span>Continuar para Verificação</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      )}

      {mode === 'register' && step === 'sms_verify' && (
        <form onSubmit={handleConfirmCodeAndRegister} className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border-2 border-sky-400 dark:border-sky-600 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center shrink-0 shadow-sm">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Código de Verificação do Celular
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Enviado para o número <strong>{phone}</strong>
              </p>
            </div>
          </div>

          {/* Real Dispatch to Cell Phone: WhatsApp & SMS Integration */}
          {sentCode && (
            <div className="p-4 bg-emerald-50/90 dark:bg-emerald-950/70 rounded-3xl border-2 border-emerald-400 dark:border-emerald-600 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Envio do Código para o Celular:
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

              {/* Status prompt before clicking */}
              {!revealedChannel ? (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    O código será enviado diretamente para seu aparelho.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Toque em um dos botões abaixo para receber o código via WhatsApp ou SMS:
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/60 rounded-xl text-center">
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-100 flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Código enviado via {revealedChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} para seu celular!
                  </span>
                </div>
              )}

              {/* Code display: Masked until user clicks WhatsApp or SMS */}
              <div className="bg-white dark:bg-slate-900 py-3.5 px-4 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 text-center shadow-inner">
                {revealedChannel ? (
                  <div className="space-y-1">
                    <span className="text-3xl sm:text-4xl font-black tracking-[0.35em] text-emerald-700 dark:text-emerald-400 select-all font-mono">
                      {sentCode}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                      Código liberado com sucesso
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-2xl sm:text-3xl font-black tracking-[0.5em] text-slate-400 dark:text-slate-500 font-mono select-none">
                      ••••••
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      Toque no WhatsApp ou SMS abaixo para liberar seu código
                    </span>
                  </div>
                )}
              </div>

              {/* Real action buttons to send/open via WhatsApp or SMS */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* WhatsApp Direct button */}
                  <button
                    type="button"
                    onClick={() => handleRevealAndSendVia('whatsapp')}
                    className="btn-contrast-solid bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black py-3 px-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow transition cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span>Ir pelo WhatsApp</span>
                  </button>

                  {/* Native SMS message app button */}
                  <button
                    type="button"
                    onClick={() => handleRevealAndSendVia('sms')}
                    className="btn-contrast-solid bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-black py-3 px-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow transition cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>Ir por SMS</span>
                  </button>
                </div>

                {/* Instant Auto-fill button: available after revealing */}
                {revealedChannel && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputCode(sentCode);
                      speakText('Código preenchido automaticamente.');
                    }}
                    className="w-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-black py-2.5 px-3 rounded-xl text-xs border border-emerald-300 dark:border-emerald-700 flex items-center justify-center gap-1.5 transition"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Preencher código {sentCode} automaticamente</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {smsGatewayStatus && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span>Status da Telefonia:</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] ${smsGatewayStatus.deliveredViaGateway ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-900'}`}>
                  {smsGatewayStatus.deliveredViaGateway ? 'Operadora Ativa' : 'Disponível no Celular / WhatsApp'}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                {smsGatewayStatus.statusMessage}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
              Digite ou confirme o código de 6 dígitos: *
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
              className="w-full text-center tracking-[0.4em] text-2xl font-black px-4 py-3 rounded-xl border-2 border-sky-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading || inputCode.length !== 6}
              className="flex-1 btn-contrast-solid bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black py-3.5 px-4 rounded-xl shadow flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? 'Confirmando...' : 'Confirmar e Entrar'}
            </button>
            <button
              type="button"
              onClick={() => setStep('form')}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3.5 px-4 rounded-xl text-sm border border-slate-300 dark:border-slate-700"
            >
              Voltar
            </button>
          </div>
        </form>
      )}

      {mode === 'login' && (
        <form onSubmit={handleLogin} className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <LogIn className="w-5 h-5 text-sky-600" />
            <span>Entrar na sua conta existente</span>
          </h3>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
              Número do seu Celular com DDD *
            </label>
            <input
              type="tel"
              required
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              placeholder="(41) 98888-7777"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
              Código PIN ou Senha *
            </label>
            <input
              type="password"
              inputMode="numeric"
              required
              value={loginPin}
              onChange={(e) => setLoginPin(e.target.value)}
              placeholder="Digite seu PIN de 4 números"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-center text-lg tracking-widest focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-contrast-solid bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-black py-4 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2 text-base transition disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar com meu celular'}
          </button>
        </form>
      )}

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onContinueAsGuest}
          className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline p-2"
        >
          Continuar no modo local deste aparelho (sem sincronizar entre celulares)
        </button>
      </div>
    </div>
  );
};
