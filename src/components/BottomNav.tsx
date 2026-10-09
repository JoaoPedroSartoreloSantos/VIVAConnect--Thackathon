import React from 'react';
import { Home, HeartPulse, ScanText, MapPin, MessageSquareHeart } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    {
      id: 'home' as ActiveTab,
      label: 'Início',
      icon: Home,
    },
    {
      id: 'reader' as ActiveTab,
      label: 'Ler e ouvir',
      icon: ScanText,
    },
    {
      id: 'health' as ActiveTab,
      label: 'Minha Saúde',
      icon: HeartPulse,
    },
    {
      id: 'places' as ActiveTab,
      label: 'Ajuda Perto',
      icon: MapPin,
    },
    {
      id: 'assistant' as ActiveTab,
      label: 'Pedir Ajuda',
      icon: MessageSquareHeart,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-3 py-2 transition-colors"
      role="navigation"
      aria-label="Navegação Principal do Aplicativo"
      style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="max-w-2xl mx-auto grid grid-cols-5 gap-2 sm:gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition font-bold text-xs min-h-[56px] ${
                isActive
                  ? 'nav-active bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-300 ring-2 ring-sky-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Ir para ${tab.label}`}
            >
              <Icon
                className={`w-5 h-5 mb-1 shrink-0 ${
                  isActive ? 'text-sky-700 dark:text-sky-300' : 'text-slate-500'
                }`}
              />
              <span className="truncate text-[10px] sm:text-[11px] leading-tight text-center max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
