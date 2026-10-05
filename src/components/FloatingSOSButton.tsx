import React from 'react';
import { PhoneCall } from 'lucide-react';

interface FloatingSOSButtonProps {
  onTriggerSOS: () => void;
}

export const FloatingSOSButton: React.FC<FloatingSOSButtonProps> = ({ onTriggerSOS }) => {
  return (
    <aside
      aria-label="Botão de emergência SOS na tela"
      className="fixed z-40 select-none pointer-events-auto"
      style={{
        right: '1rem',
        bottom: 'max(5.4rem, calc(4.8rem + env(safe-area-inset-bottom, 0px)))',
      }}
    >
      {/* Botão de SOS como pop-up flutuante na tela */}
      <button
        type="button"
        onClick={onTriggerSOS}
        className="btn-sos-real group relative bg-red-600 hover:bg-red-700 active:scale-90 text-white font-black px-4 py-3 sm:px-5 sm:py-3.5 rounded-full shadow-[0_10px_30px_rgba(220,38,38,0.5)] border-2 border-white dark:border-red-300 flex items-center gap-2 transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-red-400 animate-in zoom-in-75 duration-200"
        aria-label="Acionar botão de emergência SOS"
        title="Emergência SOS"
      >
        {/* Halo de pulso visual */}
        <span
          className="absolute -inset-1 rounded-full bg-red-500 opacity-75 animate-ping pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-2 z-10">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
          </div>
          <span className="text-base sm:text-lg font-black tracking-wider leading-none">
            SOS
          </span>
        </div>
      </button>
    </aside>
  );
};
