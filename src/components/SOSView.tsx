import React, { useState } from 'react';
import {
  PhoneCall,
  UserCheck,
  UserPlus,
  MapPin,
  MessageCircle,
  AlertTriangle,
  Edit2,
  Check,
  ShieldAlert,
  Volume2,
  Navigation,
  Info,
  X,
  PhoneForwarded,
  ArrowLeft,
} from 'lucide-react';
import { TrustedContact } from '../types';
import { speakText } from '../utils/speech';

interface SOSViewProps {
  contact: TrustedContact;
  onUpdateContact: (contact: TrustedContact) => void;
  onNavigateProfile?: () => void;
  onBack?: () => void;
  previousTabName?: string;
}

export const SOSView: React.FC<SOSViewProps> = ({
  contact,
  onUpdateContact,
  onNavigateProfile,
  onBack,
  previousTabName,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(contact.name || '');
  const [relationship, setRelationship] = useState(contact.relationship || '');
  const [phone, setPhone] = useState(contact.phone || '');
  const [hasWhatsApp, setHasWhatsApp] = useState(contact.hasWhatsApp !== false);

  // GPS for SOS message
  const [includeLocation, setIncludeLocation] = useState(true);
  const [gpsLocation, setGpsLocation] = useState<{ lat?: number; lng?: number }>({});
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'call_contact' | 'whatsapp_contact' | 'samu' | 'bombeiros';
    title: string;
    description: string;
    actionUrl: string;
  }>({
    isOpen: false,
    type: 'call_contact',
    title: '',
    description: '',
    actionUrl: '',
  });

  const hasContact = Boolean(contact.name && contact.phone);

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TrustedContact = {
      name: name.trim(),
      relationship: relationship.trim() || 'Familiar / Amigo',
      phone: phone.trim(),
      hasWhatsApp,
    };
    onUpdateContact(updated);
    setIsEditing(false);
    speakText(`Contato de confiança ${updated.name} salvo com sucesso.`);
  };

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('GPS não suportado neste aparelho.');
      return;
    }
    setIsLocating(true);
    setLocationStatus('Buscando sinal GPS do aparelho...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocating(false);
        setLocationStatus('Localização GPS capturada com sucesso.');
        speakText('Localização GPS incluída na mensagem de emergência.');
      },
      () => {
        setIsLocating(false);
        setLocationStatus('Não foi possível obter o GPS. A mensagem será enviada sem as coordenadas.');
      },
      { timeout: 8000 }
    );
  };

  const generateSOSMessage = () => {
    let msg = `🚨 *PEDIDO DE AJUDA - APLICATIVO VIVA+*\n`;
    msg += `Olá, ${contact.name}! Preciso da sua ajuda ou atenção agora.\n`;
    if (includeLocation && gpsLocation.lat && gpsLocation.lng) {
      msg += `📍 Minha localização aproximada:\nhttps://maps.google.com/?q=${gpsLocation.lat},${gpsLocation.lng}\n`;
    }
    msg += `Por favor, me ligue ou me responda assim que puder.`;
    return msg;
  };

  const cleanPhone = contact.phone ? contact.phone.replace(/\D/g, '') : '';

  const triggerCallContact = () => {
    if (!cleanPhone) {
      setIsEditing(true);
      return;
    }
    speakText(`Confirmar ligação para ${contact.name}?`);
    setConfirmModal({
      isOpen: true,
      type: 'call_contact',
      title: `Ligar para ${contact.name}?`,
      description: `O aplicativo VIVA+ abrirá o discador do seu telefone com o número ${contact.phone}. Você precisará confirmar a chamada no seu aparelho.`,
      actionUrl: `tel:${cleanPhone}`,
    });
  };

  const triggerWhatsAppContact = () => {
    if (!cleanPhone) {
      setIsEditing(true);
      return;
    }
    const message = generateSOSMessage();
    const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    speakText(`Confirmar abertura do WhatsApp para conversar com ${contact.name}?`);
    setConfirmModal({
      isOpen: true,
      type: 'whatsapp_contact',
      title: `Enviar WhatsApp para ${contact.name}?`,
      description: `O aplicativo abrirá o WhatsApp com a mensagem de socorro pré-digitada. Você poderá revisar o texto e apertar o botão de enviar no próprio WhatsApp.`,
      actionUrl: waUrl,
    });
  };

  const triggerSamu = () => {
    speakText('Confirmar ligação para o SAMU 192?');
    setConfirmModal({
      isOpen: true,
      type: 'samu',
      title: 'Ligar para o SAMU 192?',
      description: 'Você será direcionado para a central de emergência médica pública do SAMU (ligação gratuita).',
      actionUrl: 'tel:192',
    });
  };

  const triggerBombeiros = () => {
    speakText('Confirmar ligação para os Bombeiros 193?');
    setConfirmModal({
      isOpen: true,
      type: 'bombeiros',
      title: 'Ligar para os Bombeiros 193?',
      description: 'Você será direcionado para o Corpo de Bombeiros para resgates e urgências graves (ligação gratuita).',
      actionUrl: 'tel:193',
    });
  };

  const executeConfirmedAction = () => {
    const url = confirmModal.actionUrl;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    if (url.startsWith('tel:')) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Botão de voltar para a página em que a pessoa estava antes de clicar no botão pop up do SOS */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="btn-contrast-solid w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-800 dark:text-slate-100 font-black py-3.5 px-4 rounded-2xl flex items-center gap-2.5 border-2 border-slate-300 dark:border-slate-700 shadow-sm transition cursor-pointer"
          aria-label={`Voltar para ${previousTabName || 'a tela anterior'}`}
        >
          <ArrowLeft className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
          <span className="text-sm sm:text-base font-black">
            {previousTabName ? `Voltar para ${previousTabName}` : 'Voltar à tela anterior'}
          </span>
        </button>
      )}

      {/* Header Info */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <PhoneCall className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                SOS e Contato de Confiança
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                Peça ajuda com rapidez, transparência e confirmação antes de discar.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              speakText(
                'Tela de emergência SOS. Você pode ligar diretamente para seu contato de confiança ou discar para os serviços públicos 192 e 193 com confirmação prévia.'
              )
            }
            className="p-2 text-red-600 hover:text-red-800 rounded-xl"
            aria-label="Ouvir instruções do SOS"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Clear Explanation */}
        <div className="mt-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block mb-0.5 font-bold">
              Transparência no acionamento:
            </strong>
            <p>
              O VIVA+ <strong>não realiza chamadas invisíveis nem envia mensagens sem sua autorização</strong>. Ao tocar em qualquer opção, o aplicativo pede sua confirmação e abre o discador do seu celular.
            </p>
          </div>
        </div>
      </section>

      {/* When NO CONTACT is registered */}
      {!hasContact && !isEditing && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center border-2 border-dashed border-red-300 dark:border-red-800 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
            <UserPlus className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Nenhum contato de confiança cadastrado
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
              Cadastre um filho, vizinho ou amigo próximo para poder ligar rapidamente ou enviar uma mensagem de socorro com um só toque.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full max-w-xs mx-auto bg-red-600 hover:bg-red-700 text-white font-black py-3.5 px-6 rounded-2xl shadow-md transition active:scale-[0.98] text-sm flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Cadastrar Contato de Confiança</span>
          </button>
        </section>
      )}

      {/* Edit Contact Form */}
      {isEditing && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {hasContact ? 'Editar Contato de Confiança' : 'Cadastrar Contato de Confiança'}
            </h3>
            {hasContact && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold"
              >
                Cancelar
              </button>
            )}
          </div>
          <form onSubmit={handleSaveContact} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                Nome ou Apelido:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Filha Lúcia ou Vizinho Roberto"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                  Parentesco / Relação:
                </label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="Ex: Filha, Cuidador, Sobrinho"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                  Telefone com DDD:
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(41) 98888-7777"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="wa-check"
                checked={hasWhatsApp}
                onChange={(e) => setHasWhatsApp(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
              />
              <label htmlFor="wa-check" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                Este telefone possui WhatsApp
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              {hasContact && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl text-xs shadow"
              >
                Salvar Contato
              </button>
            </div>
          </form>
        </section>
      )}

      {/* When Contact Exists */}
      {hasContact && !isEditing && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Seu Contato Cadastrado
              </h3>
            </div>
            <button
              onClick={() => {
                setName(contact.name);
                setRelationship(contact.relationship);
                setPhone(contact.phone);
                setHasWhatsApp(contact.hasWhatsApp);
                setIsEditing(true);
              }}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 dark:text-sky-400 flex items-center gap-1 p-1 rounded-lg"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Alterar</span>
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {contact.name}
              </span>
              <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-2.5 py-0.5 rounded-full">
                {contact.relationship || 'Contato'}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
              Telefone: <span className="font-mono text-base font-bold text-slate-900 dark:text-white">{contact.phone}</span>
            </p>
          </div>

          {/* Location Toggle for SOS Message */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLocation}
                  onChange={(e) => setIncludeLocation(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 cursor-pointer"
                />
                <span>Incluir localização aproximada na mensagem</span>
              </label>
              {includeLocation && !gpsLocation.lat && (
                <button
                  type="button"
                  onClick={handleCaptureLocation}
                  disabled={isLocating}
                  className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-1"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isLocating ? 'Buscando...' : 'Obter GPS'}</span>
                </button>
              )}
            </div>
            {locationStatus && (
              <p className="text-[11px] text-slate-500 italic">{locationStatus}</p>
            )}
          </div>

          {/* Real Action Buttons with Safety Confirmation */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={triggerCallContact}
              className="btn-contrast-solid w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black py-4 px-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 text-base sm:text-lg transition text-center"
              aria-label={`Ligar para ${contact.name}`}
            >
              <PhoneCall className="w-6 h-6 animate-pulse" />
              <span>LIGAR PARA {contact.name.toUpperCase()}</span>
            </button>

            {contact.hasWhatsApp && (
              <button
                type="button"
                onClick={triggerWhatsAppContact}
                className="btn-contrast-solid w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold py-3.5 px-5 rounded-2xl shadow flex items-center justify-center gap-2 text-sm sm:text-base transition text-center"
                aria-label={`Enviar mensagem no WhatsApp para ${contact.name}`}
              >
                <MessageCircle className="w-5 h-5" />
                <span>PREPARAR MENSAGEM NO WHATSAPP</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Emergency Fallback: Direct Public Helplines 192 / 193 */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          NÃO CONSEGUIU CONTATO? LIGUE GRATUITAMENTE:
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={triggerSamu}
            className="btn-contrast-solid bg-red-700 hover:bg-red-800 text-white font-black p-3.5 rounded-2xl flex flex-col items-center justify-center text-center shadow transition active:scale-95"
            aria-label="Ligar para SAMU 192"
          >
            <span className="text-2xl">🚨 192</span>
            <span className="text-xs mt-1 font-bold">SAMU Ambulância</span>
          </button>
          <button
            type="button"
            onClick={triggerBombeiros}
            className="btn-contrast-solid bg-orange-600 hover:bg-orange-700 text-white font-black p-3.5 rounded-2xl flex flex-col items-center justify-center text-center shadow transition active:scale-95"
            aria-label="Ligar para Bombeiros 193"
          >
            <span className="text-2xl">🚒 193</span>
            <span className="text-xs mt-1 font-bold">Bombeiros Resgate</span>
          </button>
        </div>
      </section>

      {/* Safety Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border-2 border-red-500 shadow-2xl space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <PhoneForwarded className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                {confirmModal.title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {confirmModal.description}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={executeConfirmedAction}
                className="btn-contrast-solid w-full bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-2xl text-sm shadow transition active:scale-95"
              >
                Confirmar e Abrir no Telefone
              </button>
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
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
