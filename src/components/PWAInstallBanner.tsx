import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share2, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { speakText } from '../utils/speech';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (dismissed) return null;

  const renderOfficialLogoSymbol = (size = 'w-11 h-11') => (
    <div className={`${size} shrink-0 relative flex items-center justify-center`}>
      <svg
        viewBox="0 0 512 512"
        className="w-full h-full drop-shadow-md select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pwaIconBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="pwaIconGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="120" fill="#ffffff" />
        <rect width="512" height="512" rx="120" fill="none" stroke="#e2e8f0" strokeWidth="6" />
        {/* Eye/Leaf curves */}
        <path
          d="M 115 256 C 175 140, 337 140, 397 256"
          stroke="url(#pwaIconGreen)"
          strokeWidth="48"
          strokeLinecap="round"
        />
        <path
          d="M 115 256 C 175 372, 337 372, 397 256"
          stroke="url(#pwaIconBlue)"
          strokeWidth="48"
          strokeLinecap="round"
        />
        {/* Pupil and Heart */}
        <circle cx="256" cy="195" r="34" fill="#059669" />
        <path
          d="M 210 248 C 228 220, 284 220, 302 248 C 285 272, 227 272, 210 248 Z"
          fill="#059669"
        />
        {/* Cross */}
        <g transform="translate(365, 155)">
          <circle cx="0" cy="0" r="34" fill="url(#pwaIconGreen)" />
          <path
            d="M -16 0 L 16 0 M 0 -16 L 0 16"
            stroke="#ffffff"
            strokeWidth="9"
            strokeLinecap="round"
          />
        </g>
        {/* Magnifier loop */}
        <circle
          cx="290"
          cy="300"
          r="38"
          stroke="url(#pwaIconBlue)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray="180 60"
        />
      </svg>
    </div>
  );

  const handleMobileInstallClick = async () => {
    if (isInstallable) {
      speakText('Instalando aplicativo VIVA+ no celular.');
      await install();
    } else {
      speakText('Abrindo orientações para baixar e instalar no celular ou computador.');
      setShowHelpModal(true);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-sky-50 via-emerald-50 to-sky-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-2 border-emerald-500 dark:border-emerald-600 rounded-3xl p-3.5 sm:p-4 mb-4 shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-13 h-13 rounded-2xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 shadow-sm border border-slate-200 dark:border-slate-700">
            {renderOfficialLogoSymbol('w-11 h-11')}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                Baixar no Celular & PC
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                VIVA+ App
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug mt-0.5">
              Instale no celular (Android e iPhone) ou baixe o executável .exe para computador. Funciona offline e com som!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Main Action: Install on Mobile or Open Instructions */}
          <button
            onClick={handleMobileInstallClick}
            className="btn-contrast-solid bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition cursor-pointer"
            aria-label="Baixar e instalar aplicativo no celular"
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>{isInstallable ? 'Instalar no Celular' : 'Baixar no Celular'}</span>
          </button>
          
          <a
            href="/download/VivaPlus-App.exe"
            download="VivaPlus.exe"
            onClick={() => speakText('Baixando executável VIVA+ para computador.')}
            className="hidden sm:flex bg-slate-800 hover:bg-slate-900 text-white font-black px-3 py-2.5 rounded-2xl text-xs items-center gap-1.5 border border-slate-700 transition"
            title="Baixar executável .exe direto"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>.exe (PC)</span>
          </a>

          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl transition text-xs font-bold underline cursor-pointer"
            title="Como baixar e instalar no celular e computador"
          >
            Ajuda
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white rounded-xl transition cursor-pointer"
            aria-label="Fechar aviso de download"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-emerald-500 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
                  {renderOfficialLogoSymbol('w-10 h-10')}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    Baixar VIVA+ no Celular e PC
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    Instalação oficial e direta no seu aparelho
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

            {/* Passo a Passo Celular Android e iPhone */}
            <div className="p-4 bg-sky-50 dark:bg-sky-950/60 rounded-2xl border-2 border-sky-300 dark:border-sky-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-600" />
                  Como Baixar no Celular (Android & iPhone):
                </h4>
                <span className="text-[10px] font-bold bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 px-2 py-0.5 rounded-full">
                  Sem Loja
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                  <p><strong>No Android (Google Chrome):</strong> Toque nos 3 pontinhos do menu no canto superior e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                  <p><strong>No iPhone (Safari):</strong> Toque no botão de <strong>Compartilhar (quadrado com seta para cima)</strong> e escolha <strong>"Adicionar à Tela de Início"</strong>.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                  <p>O ícone do <strong>VIVA+</strong> aparecerá na tela do seu celular pronto para abrir em tela cheia com voz e câmera!</p>
                </div>
              </div>

              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    await install();
                    setShowHelpModal(false);
                  }}
                  className="btn-contrast-solid w-full bg-sky-600 hover:bg-sky-700 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow mt-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Instalar agora neste celular</span>
                </button>
              )}
            </div>

            {/* Direct EXE Download Button for PC */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                  <Download className="w-4 h-4" />
                  Baixar para Computador (.exe)
                </span>
                <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600 px-2 py-0.5 rounded-full">
                  Pronto
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Baixe o executável .exe direto para abrir em computadores e notebooks Windows:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <a
                  href="/download/VivaPlus-App.exe"
                  download="VivaPlus.exe"
                  onClick={() => speakText('Baixando executável VIVA+ para computador.')}
                  className="btn-contrast-solid bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar VivaPlus.exe</span>
                </a>
                <a
                  href="/download/VivaPlus-Iniciar.bat"
                  download="VivaPlus-Iniciar.bat"
                  className="bg-slate-800 hover:bg-slate-700 text-white font-black py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-600 transition"
                >
                  <span>Launcher .bat</span>
                </a>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black py-3 rounded-2xl text-xs sm:text-sm transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
