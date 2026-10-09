import React from 'react';

export type LogoVariant = 'full' | 'header' | 'app-icon';
export type LogoTheme = 'light' | 'dark' | 'auto';

interface VivaLogoProps {
  variant?: LogoVariant;
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  showTagline?: boolean;
  theme?: LogoTheme;
  className?: string;
}

export const VivaLogo: React.FC<VivaLogoProps> = ({
  variant,
  layout = 'horizontal',
  size = 'md',
  showTagline = false,
  theme = 'auto',
  className = '',
}) => {
  const effectiveVariant: LogoVariant = variant || (layout === 'horizontal' ? 'header' : 'full');
  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  const renderOriginalSymbol = (symbolSizeClasses: string) => (
    <div className={`${symbolSizeClasses} relative shrink-0 select-none`}>
      <svg
        viewBox="0 0 512 400"
        className="w-full h-full drop-shadow-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`gradBlue_${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#38bdf8' : isLight ? '#0284c7' : '#0284c7'} />
            <stop offset="100%" stopColor={isDark ? '#0284c7' : isLight ? '#0369a1' : '#0369a1'} />
          </linearGradient>
          <linearGradient id={`gradGreen_${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#34d399' : isLight ? '#059669' : '#059669'} />
            <stop offset="100%" stopColor={isDark ? '#10b981' : isLight ? '#047857' : '#047857'} />
          </linearGradient>
        </defs>
        <path
          d="M 110 210 C 180 80, 340 80, 410 210"
          stroke={`url(#gradGreen_${theme})`}
          strokeWidth="42"
          strokeLinecap="round"
        />
        <path
          d="M 110 210 C 180 340, 340 340, 410 210"
          stroke={`url(#gradBlue_${theme})`}
          strokeWidth="42"
          strokeLinecap="round"
        />
        <circle cx="390" cy="95" r="54" fill={`url(#gradGreen_${theme})`} />
        <path
          d="M 360 95 L 372 95 L 380 75 L 392 115 L 402 85 L 408 95 L 420 95"
          stroke="#ffffff"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="256" cy="135" r="32" fill={isDark ? '#34d399' : '#059669'} />
        <path
          d="M 195 190 C 215 160, 245 160, 256 185 C 267 160, 297 160, 317 190 C 295 205, 275 190, 256 220 C 237 190, 217 205, 195 190 Z"
          fill={isDark ? '#34d399' : '#059669'}
        />
        <circle
          cx="305"
          cy="265"
          r="44"
          stroke={`url(#gradBlue_${theme})`}
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray="210 70"
        />
      </svg>
    </div>
  );

  const renderAppIconSymbol = () => (
    <svg
      viewBox="0 0 512 512"
      className="w-full h-full drop-shadow-md select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`appIconBlue_${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? '#38bdf8' : isLight ? '#0284c7' : '#0284c7'} />
          <stop offset="100%" stopColor={isDark ? '#0284c7' : isLight ? '#0369a1' : '#0369a1'} />
        </linearGradient>
        <linearGradient id={`appIconGreen_${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? '#34d399' : isLight ? '#059669' : '#059669'} />
          <stop offset="100%" stopColor={isDark ? '#10b981' : isLight ? '#047857' : '#047857'} />
        </linearGradient>
      </defs>
      <path
        d="M 115 256 C 175 140, 337 140, 397 256"
        stroke={`url(#appIconGreen_${theme})`}
        strokeWidth="48"
        strokeLinecap="round"
      />
      <path
        d="M 115 256 C 175 372, 337 372, 397 256"
        stroke={`url(#appIconBlue_${theme})`}
        strokeWidth="48"
        strokeLinecap="round"
      />
      <circle cx="256" cy="195" r="34" fill={isDark ? '#34d399' : '#059669'} />
      <path
        d="M 210 248 C 228 220, 284 220, 302 248 C 285 272, 227 272, 210 248 Z"
        fill={isDark ? '#34d399' : '#059669'}
      />
      <g transform="translate(365, 155)">
        <circle cx="0" cy="0" r="34" fill={`url(#appIconGreen_${theme})`} />
        <path
          d="M -16 0 L 16 0 M 0 -16 L 0 16"
          stroke="#ffffff"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </g>
      <circle
        cx="290"
        cy="300"
        r="38"
        stroke={`url(#appIconBlue_${theme})`}
        strokeWidth="18"
        strokeLinecap="round"
        strokeDasharray="180 60"
      />
    </svg>
  );

  if (effectiveVariant === 'app-icon') {
    return (
      <div
        className={`relative w-full h-full min-w-[32px] min-h-[32px] flex items-center justify-center select-none ${className}`}
        aria-label="Ícone oficial do aplicativo Viva+"
      >
        <svg
          viewBox="0 0 512 512"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect width="512" height="512" rx="115" fill="#ffffff" />
          <rect width="512" height="512" rx="115" fill="none" stroke="#cbd5e1" strokeWidth="6" />
          <path
            d="M 115 256 C 175 140, 337 140, 397 256"
            stroke="#059669"
            strokeWidth="48"
            strokeLinecap="round"
          />
          <path
            d="M 115 256 C 175 372, 337 372, 397 256"
            stroke="#0284c7"
            strokeWidth="48"
            strokeLinecap="round"
          />
          <circle cx="256" cy="195" r="34" fill="#059669" />
          <path
            d="M 210 248 C 228 220, 284 220, 302 248 C 285 272, 227 272, 210 248 Z"
            fill="#059669"
          />
          <g transform="translate(365, 155)">
            <circle cx="0" cy="0" r="34" fill="#059669" />
            <path
              d="M -16 0 L 16 0 M 0 -16 L 0 16"
              stroke="#ffffff"
              strokeWidth="9"
              strokeLinecap="round"
            />
          </g>
          <circle
            cx="290"
            cy="300"
            r="38"
            stroke="#0284c7"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray="180 60"
          />
        </svg>
      </div>
    );
  }

  if (effectiveVariant === 'header') {
    const symbolSizes = {
      sm: 'w-7 h-7',
      md: 'w-8 h-8 sm:w-9 sm:h-9',
      lg: 'w-10 h-10',
      xl: 'w-12 h-12',
      custom: '',
    };
    const textSizes = {
      sm: 'text-xl',
      md: 'text-2xl sm:text-3xl',
      lg: 'text-3xl sm:text-4xl',
      xl: 'text-4xl sm:text-5xl',
      custom: '',
    };

    const vivaColorClass =
      isDark
        ? 'text-sky-400'
        : isLight
        ? 'text-sky-700'
        : 'text-sky-700 dark:text-sky-400';
    const plusColorClass =
      isDark
        ? 'text-emerald-400'
        : isLight
        ? 'text-emerald-600'
        : 'text-emerald-600 dark:text-emerald-400';

    return (
      <div className={`flex items-center gap-1.5 sm:gap-2 select-none bg-transparent ${className}`}>
        {renderOriginalSymbol(symbolSizes[size])}
        <div className="flex items-center tracking-tight leading-none">
          <span className={`font-black ${textSizes[size]} ${vivaColorClass} tracking-tight`}>
            Viva
          </span>
          <span className={`font-black ${textSizes[size]} ${plusColorClass} tracking-tight ml-0.5`}>
            +
          </span>
        </div>
      </div>
    );
  }

  const fullSymbolSizes = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20 sm:w-24 sm:h-24',
    lg: 'w-28 h-28 sm:w-32 sm:h-32',
    xl: 'w-40 h-40 sm:w-48 sm:h-48',
    custom: '',
  };
  const fullVivaSizes = {
    sm: 'text-3xl',
    md: 'text-4xl sm:text-5xl',
    lg: 'text-5xl sm:text-6xl',
    xl: 'text-6xl sm:text-7xl',
    custom: '',
  };

  const vivaColor = isDark
    ? 'text-sky-400'
    : isLight
    ? 'text-sky-700'
    : 'text-sky-700 dark:text-sky-400';
  const plusColor = isDark
    ? 'text-emerald-400'
    : isLight
    ? 'text-emerald-600'
    : 'text-emerald-600 dark:text-emerald-400';
  const taglineColor = isDark
    ? 'text-slate-200'
    : isLight
    ? 'text-slate-700'
    : 'text-slate-700 dark:text-slate-200';
  const mottoColor = isDark
    ? 'text-emerald-300'
    : isLight
    ? 'text-emerald-800'
    : 'text-emerald-800 dark:text-emerald-300';

  return (
    <div
      className={`flex flex-col items-center justify-center text-center select-none p-4 sm:p-6 ${className}`}
      aria-label="Logo completa do Viva+: Tecnologia que entende você. Enxergue • Entenda • Decida • Viva."
    >
      <div className="mb-2 sm:mb-3">
        {renderOriginalSymbol(fullSymbolSizes[size])}
      </div>
      <div className="flex items-center justify-center tracking-tight leading-none mb-2">
        <span className={`font-black ${fullVivaSizes[size]} ${vivaColor} tracking-tight`}>
          Viva
        </span>
        <span className={`font-black ${fullVivaSizes[size]} ${plusColor} tracking-tight ml-1`}>
          +
        </span>
      </div>
      <p className={`text-sm sm:text-base font-extrabold tracking-wide uppercase ${taglineColor} mb-2`}>
        Tecnologia que entende você
      </p>
      <p
        className={`text-xs sm:text-sm font-black tracking-normal px-3 py-1 rounded-full border ${
          isDark
            ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
            : isLight
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-300'
        } ${mottoColor}`}
      >
        Enxergue • Entenda • Decida • Viva.
      </p>
    </div>
  );
};
