import React from 'react';
import {
  Volume2,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Eye,
  Info,
  User,
  Smartphone,
} from 'lucide-react';
import { AccessibilitySettings, UserProfile } from '../types';
import { VivaLogo } from './VivaLogo';
import { speakText } from '../utils/speech';

interface HeaderProps {
  settings: AccessibilitySettings;
  currentUser: UserProfile;
  onUpdateSettings: (newSettings: AccessibilitySettings) => void;
  onOpenAbout: () => void;
  onNavigateHome: () => void;
  onNavigateProfile: () => void;
  onNavigateAuth: () => void;
  screenDescription: string;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  onUpdateSettings,
  onOpenAbout,
  onNavigateHome,
  onNavigateProfile,
  onNavigateAuth,
  screenDescription,
}) => {
  const handleFontChange = (delta: number) => {
    let nextScale = Math.round((settings.fontScale + delta) * 100) / 100;
    if (nextScale < 0.85) nextScale = 0.85;
    if (nextScale > 1.45) nextScale = 1.45;
    const updated = { ...settings, fontScale: nextScale };
    onUpdateSettings(updated);
    document.documentElement.style.setProperty('--font-scale', `${nextScale}`);
  };

  const handleThemeChange = (theme: 'normal' | 'contrast' | 'rest') => {
    const updated = { ...settings, theme };
    onUpdateSettings(updated);
    document.body.className = '';
    document.body.classList.add(`theme-${theme}`);
    speakText(
      `Tema ${
        theme === 'contrast'
          ? 'alto contraste preto e amarelo'
          : theme === 'rest'
          ? 'descanso noturno'
          : 'padrão saúde claro'
      } ativado.`
    );
  };

  const handleReadScreen = () => {
    speakText(screenDescription);
  };

  return (
    <header className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-2 sm:px-3 py-1.5 sm:py-2 transition-colors shadow-sm">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Brand Logo on the left */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-xl p-1 -ml-1 transition hover:opacity-90 shrink-0"
          aria-label="VIVAConnect Início - Toque para voltar à tela inicial"
        >
          <VivaLogo variant="header" size="md" />
        </button>

        {/* Right Tools: Account (Entrar / Meu Perfil), SOS, Voice, Font, Themes & Info */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap justify-end overflow-x-auto no-scrollbar py-0.5">
          {/* Account Button: Entrar / Criar Conta (if Guest) or Meu Perfil (if Logged in) */}
          {currentUser.isGuest ? (
            <button
              onClick={onNavigateAuth}
              className="bg-sky-50 hover:bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200 border-2 border-sky-400 dark:border-sky-600 px-2 sm:px-2.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 transition shrink-0"
              aria-label="Entrar ou criar conta com celular no VIVAConnect"
              title="Entrar com celular"
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-300" />
              <span className="hidden sm:inline">Entrar com celular</span>
              <span className="sm:hidden">Entrar</span>
            </button>
          ) : (
            <button
              onClick={onNavigateProfile}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 px-2 sm:px-2.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 transition shrink-0"
              aria-label="Acessar meu perfil e dados"
              title="Meu perfil"
            >
              <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
              <span className="hidden sm:inline">Meu perfil</span>
              <span className="sm:hidden">Perfil</span>
            </button>
          )}

          {/* Read Screen Aloud */}
          <button
            onClick={handleReadScreen}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition shrink-0"
            aria-label="Ouvir instruções da tela atual em voz alta"
            title="Ouvir esta tela"
          >
            <Volume2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-300" />
            <span className="hidden md:inline">Ouvir</span>
          </button>

          {/* Font Controls (A- / A+) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-0.5 shrink-0">
            <button
              onClick={() => handleFontChange(-0.1)}
              className="p-1 text-slate-700 dark:text-slate-200 hover:text-slate-900 rounded-lg font-black text-xs min-w-[24px] text-center"
              aria-label="Diminuir tamanho do texto"
              title="Diminuir fonte"
            >
              <ZoomOut className="w-3 h-3 inline" />
              <span className="text-[10px] ml-0.5">A-</span>
            </button>
            <button
              onClick={() => handleFontChange(0.1)}
              className="p-1 text-slate-700 dark:text-slate-200 hover:text-slate-900 rounded-lg font-black text-xs min-w-[24px] text-center"
              aria-label="Aumentar tamanho do texto"
              title="Aumentar fonte"
            >
              <ZoomIn className="w-3 h-3 inline" />
              <span className="text-[10px] ml-0.5">A+</span>
            </button>
          </div>

          {/* Theme Selector (Saúde, Contraste, Noite) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-0.5 shrink-0">
            <button
              onClick={() => handleThemeChange('normal')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                settings.theme === 'normal'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="Tema Padrão Saúde (Claro)"
              aria-label="Tema Padrão Saúde"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleThemeChange('contrast')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                settings.theme === 'contrast'
                  ? 'bg-yellow-400 text-black shadow-sm font-black active-theme-contrast'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="Tema Alto Contraste (Preto e Amarelo WCAG AAA)"
              aria-label="Tema Alto Contraste"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleThemeChange('rest')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                settings.theme === 'rest'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="Tema Descanso (Modo Escuro Suave)"
              aria-label="Tema Descanso"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* About Button */}
          <button
            onClick={onOpenAbout}
            className="p-1.5 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            aria-label="Informações sobre o aplicativo VIVAConnect"
            title="Sobre o aplicativo"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
