import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) return null;

  return (
    <>
      <div className="bg-sky-50 dark:bg-slate-900 border-2 border-sky-300 dark:border-sky-800 rounded-2xl p-3 mb-3 shadow-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <p className="font-black text-slate-900 dark:text-white text-sm leading-tight">
              Instalar o VIVA+ no seu celular
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Acesso rápido com botão grande na tela inicial e funciona offline.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isInstallable && (
            <button
              onClick={install}
              className="btn-contrast-solid bg-sky-600 hover:bg-sky-700 text-white font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition active:scale-95"
              aria-label="Instalar aplicativo VIVA+"
            >
              <Download className="w-4 h-4" />
              Instalar
            </button>
          )}
          {isIOS && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="btn-contrast-solid bg-sky-600 hover:bg-sky-700 text-white font-black px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
            >
              <Download className="w-4 h-4" />
              Instalar no iPhone
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg transition"
            aria-label="Fechar aviso de instalação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-sky-600" />
              Como colocar o VIVA+ no iPhone
            </h3>
            <ol className="text-sm text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside font-medium leading-relaxed">
              <li>No Safari, toque no botão <strong>Compartilhar</strong> (quadrado com seta para cima).</li>
              <li>Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>.</li>
              <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="btn-contrast-solid w-full bg-sky-600 hover:bg-sky-700 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 shadow"
            >
              <Check className="w-5 h-5" />
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
