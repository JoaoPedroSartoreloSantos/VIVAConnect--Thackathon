import React, { useState, useEffect } from 'react';
import { Camera, MapPin, CheckCircle2, AlertTriangle, ShieldCheck, X, Volume2, Sparkles, RefreshCw } from 'lucide-react';
import { speakText } from '../utils/speech';

interface PermissionsSetupBannerProps {
  onPermissionsUpdated?: () => void;
}

export const PermissionsSetupBanner: React.FC<PermissionsSetupBannerProps> = ({ onPermissionsUpdated }) => {
  const [cameraStatus, setCameraStatus] = useState<'granted' | 'prompt' | 'denied' | 'unknown'>('prompt');
  const [geoStatus, setGeoStatus] = useState<'granted' | 'prompt' | 'denied' | 'unknown'>('prompt');
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [isRequestingGeo, setIsRequestingGeo] = useState(false);
  const [isRequestingBoth, setIsRequestingBoth] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check current permission state on mount if supported by browser
  const checkPermissions = async () => {
    if (typeof navigator === 'undefined') return;

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const cam = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraStatus(cam.state as any);
        cam.onchange = () => setCameraStatus(cam.state as any);
      } catch {
        // Some browsers don't support 'camera' in query
      }

      try {
        const geo = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setGeoStatus(geo.state as any);
        geo.onchange = () => setGeoStatus(geo.state as any);
      } catch {}
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const handleRequestCamera = async () => {
    setIsRequestingCamera(true);
    setStatusMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Aparelho ou navegador sem suporte a câmera.');
      }

      speakText('Pedindo permissão para usar a câmera. Toque em Permitir na janela do navegador.');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      }).catch(async () => {
        // Fallback for simple webcams
        return await navigator.mediaDevices.getUserMedia({ video: true });
      });

      // Stream successfully acquired, immediately release the camera hardware
      stream.getTracks().forEach((track) => track.stop());
      setCameraStatus('granted');
      setStatusMessage('Câmera autorizada com sucesso! Você já pode fotografar caixas de remédios e receitas.');
      speakText('Câmera autorizada com sucesso.');
      if (onPermissionsUpdated) onPermissionsUpdated();
    } catch (err: any) {
      console.warn('Erro ao solicitar permissão de câmera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setStatusMessage('Permissão da câmera foi negada. Se desejar usar a câmera, autorize nas configurações do seu navegador.');
        speakText('A permissão da câmera foi negada.');
      } else {
        setStatusMessage('Não foi possível ativar a câmera neste momento. Verifique se outro aplicativo está usando a câmera.');
      }
    } finally {
      setIsRequestingCamera(false);
    }
  };

  const handleRequestLocation = async () => {
    setIsRequestingGeo(true);
    setStatusMessage(null);

    if (!navigator.geolocation) {
      setGeoStatus('denied');
      setStatusMessage('Este navegador ou dispositivo não possui suporte a localização GPS.');
      setIsRequestingGeo(false);
      return;
    }

    speakText('Pedindo permissão para usar sua localização. Toque em Permitir na janela do navegador.');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus('granted');
        setIsRequestingGeo(false);
        setStatusMessage('Localização autorizada com sucesso! Você pode encontrar postos de saúde e farmácias perto de você.');
        speakText('Localização autorizada com sucesso.');
        if (onPermissionsUpdated) onPermissionsUpdated();
      },
      (err) => {
        setIsRequestingGeo(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus('denied');
          setStatusMessage('Permissão de localização negada. Se desejar, você pode digitar sua cidade ou bairro na busca de locais.');
          speakText('A permissão de localização foi negada.');
        } else {
          setStatusMessage('Sinal de localização indisponível no momento. Você pode tentar novamente.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleRequestBoth = async () => {
    setIsRequestingBoth(true);
    setStatusMessage(null);

    // 1. First trigger camera
    try {
      if (cameraStatus !== 'granted' && navigator.mediaDevices?.getUserMedia) {
        speakText('Solicitando permissões de câmera e localização para o VIVA Plus. Toque em Permitir nas janelas do navegador.');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        setCameraStatus('granted');
      }
    } catch (camErr: any) {
      if (camErr.name === 'NotAllowedError') setCameraStatus('denied');
    }

    // 2. Next trigger geolocation
    if (geoStatus !== 'granted' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setGeoStatus('granted');
          setIsRequestingBoth(false);
          setStatusMessage('Permissões de câmera e localização configuradas com sucesso!');
          speakText('Câmera e localização configuradas.');
          if (onPermissionsUpdated) onPermissionsUpdated();
        },
        () => {
          setIsRequestingBoth(false);
          setStatusMessage('Uma ou mais permissões foram concluídas. Você pode conferir os botões abaixo.');
        },
        { timeout: 8000 }
      );
    } else {
      setIsRequestingBoth(false);
      setStatusMessage('Permissões verificadas e prontas para uso!');
    }
  };

  const bothGranted = cameraStatus === 'granted' && geoStatus === 'granted';

  if (isDismissed && bothGranted) {
    return null;
  }

  return (
    <section
      role="region"
      aria-label="Permissões de Câmera e Localização"
      className={`rounded-3xl p-4 sm:p-5 border-2 transition-all shadow-sm ${
        bothGranted
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
          : 'bg-white dark:bg-slate-900 border-sky-300 dark:border-sky-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              bothGranted
                ? 'bg-emerald-600 text-white'
                : 'bg-sky-600 text-white'
            }`}
          >
            {bothGranted ? <ShieldCheck className="w-6 h-6" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
              {bothGranted
                ? 'Câmera e Localização prontas para uso'
                : 'Permissão para Câmera e Localização'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              {bothGranted
                ? 'Seu aparelho está autorizado a fotografar receitas e buscar locais próximos.'
                : 'Autorize para tirar fotos de remédios e encontrar postos de saúde perto de você.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() =>
              speakText(
                bothGranted
                  ? 'Câmera e localização já estão permitidas e funcionando no VIVA Plus.'
                  : 'Permissões de câmera e localização. Toque em Pedir permissão para autorizar a câmera na leitura de remédios e a localização para buscar postos e farmácias próximas.'
              )
            }
            className="p-1.5 text-sky-600 hover:text-sky-800 dark:text-sky-400 rounded-xl"
            aria-label="Ouvir orientações sobre permissões"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          {bothGranted && (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              aria-label="Dispensar aviso de permissões"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3.5">
        {/* Camera Item */}
        <div className="p-3 rounded-2xl border bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black block text-slate-900 dark:text-white truncate">
                Câmera
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                Para fotos de receitas e caixas
              </span>
            </div>
          </div>

          <div>
            {cameraStatus === 'granted' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-1 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Permitida
              </span>
            ) : cameraStatus === 'denied' ? (
              <button
                onClick={handleRequestCamera}
                disabled={isRequestingCamera}
                className="btn-contrast-solid text-[11px] font-bold text-amber-900 dark:text-amber-200 bg-amber-200 hover:bg-amber-300 dark:bg-amber-900 px-2.5 py-1 rounded-xl transition flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3 text-amber-700" />
                <span>Reativar</span>
              </button>
            ) : (
              <button
                onClick={handleRequestCamera}
                disabled={isRequestingCamera}
                className="btn-contrast-solid text-xs font-black text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1"
              >
                {isRequestingCamera && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Permitir</span>
              </button>
            )}
          </div>
        </div>

        {/* Location Item */}
        <div className="p-3 rounded-2xl border bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black block text-slate-900 dark:text-white truncate">
                Localização (GPS)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                Para postos e farmácias perto
              </span>
            </div>
          </div>

          <div>
            {geoStatus === 'granted' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-1 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Permitida
              </span>
            ) : geoStatus === 'denied' ? (
              <button
                onClick={handleRequestLocation}
                disabled={isRequestingGeo}
                className="btn-contrast-solid text-[11px] font-bold text-amber-900 dark:text-amber-200 bg-amber-200 hover:bg-amber-300 dark:bg-amber-900 px-2.5 py-1 rounded-xl transition flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3 text-amber-700" />
                <span>Reativar</span>
              </button>
            ) : (
              <button
                onClick={handleRequestLocation}
                disabled={isRequestingGeo}
                className="btn-contrast-solid text-xs font-black text-white bg-sky-600 hover:bg-sky-700 px-3 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1"
              >
                {isRequestingGeo && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Permitir</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Single Action Button if both not yet granted */}
      {!bothGranted && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleRequestBoth}
            disabled={isRequestingBoth}
            className="btn-contrast-solid w-full bg-sky-700 hover:bg-sky-800 active:scale-95 text-white font-black py-3 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow transition"
          >
            {isRequestingBoth ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Pedir permissões de Câmera e Localização agora</span>
          </button>
        </div>
      )}

      {statusMessage && (
        <div
          role="alert"
          className="mt-2.5 p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/70 border border-sky-300 dark:border-sky-800 text-xs font-bold text-sky-900 dark:text-sky-200 flex items-start gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <p className="leading-snug">{statusMessage}</p>
        </div>
      )}
    </section>
  );
};
