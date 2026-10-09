import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share2, MoreVertical, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { VivaLogo } from './VivaLogo';
import { speakText } from '../utils/speech';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setShowHelpModal(true);
      }
    } else {
      setShowHelpModal(true);
      speakText('Para baixar e instalar o VIVAConnect no celular, siga o passo a passo na tela.');
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-sky-50 via-emerald-50 to-sky-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-2 border-sky-400 dark:border-sky-600 rounded-3xl p-3.5 sm:p-4 mb-4 shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 shadow-sm border border-slate-200 dark:border-slate-700">
            <VivaLogo variant="app-icon" size="sm" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                Baixar VIVAConnect no Celular
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                App Oficial
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug mt-0.5">
              Instale na tela inicial com ícone do aplicativo. Funciona offline e com aviso de remédio!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="btn-contrast-solid bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-black px-4 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition cursor-pointer"
            aria-label="Baixar e instalar aplicativo VIVAConnect no celular"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Baixar App</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white rounded-xl transition"
            aria-label="Fechar aviso de download do VIVAConnect"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-sky-500 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
                  <VivaLogo variant="app-icon" size="sm" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    Instalar VIVAConnect no Celular
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    Aplicativo leve, seguro e direto na tela inicial
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isInstallable && (
              <button
                onClick={async () => {
                  await install();
                  setShowHelpModal(false);
                }}
                className="btn-contrast-solid w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-5 h-5" />
                <span>Confirmar Instalação Agora</span>
              </button>
            )}

            {/* Android Instructions */}
            <div className="p-4 bg-sky-50 dark:bg-sky-950/60 rounded-2xl border border-sky-200 dark:border-sky-800 space-y-2">
              <h4 className="text-xs font-black uppercase text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-sky-600" />
                No Celular Android (Chrome, Edge ou Samsung):
              </h4>
              <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-decimal list-inside font-medium leading-relaxed">
                <li>Toque no menu de <strong>3 pontinhos (⋮)</strong> no canto superior direito do navegador.</li>
                <li>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                <li>Confirme em <strong>"Instalar"</strong>. O ícone do VIVAConnect aparecerá junto aos seus outros aplicativos!</li>
              </ol>
            </div>

            {/* iPhone / iOS Instructions */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
              <h4 className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-emerald-600" />
                No iPhone / iPad (Safari):
              </h4>
              <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-decimal list-inside font-medium leading-relaxed">
                <li>No Safari, toque no botão <strong>Compartilhar</strong> (quadradinho com uma seta para cima).</li>
                <li>Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
                <li>Toque em <strong>"Adicionar"</strong> no canto superior direito.</li>
              </ol>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black py-3 rounded-2xl text-xs sm:text-sm transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
