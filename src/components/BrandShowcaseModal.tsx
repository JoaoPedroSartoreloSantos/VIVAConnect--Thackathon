import React, { useState } from 'react';
import {
  X,
  Download,
  Sun,
  Moon,
  Smartphone,
  CheckCircle2,
  Sparkles,
  Layers,
  Layout,
  Phone,
  MessageCircle,
  Camera,
} from 'lucide-react';
import { VivaLogo } from './VivaLogo';

interface BrandShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandShowcaseModal: React.FC<BrandShowcaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [iconMask, setIconMask] = useState<'squircle' | 'circle' | 'square'>('squircle');
  const [showSafeArea, setShowSafeArea] = useState<boolean>(true);

  if (!isOpen) return null;

  const isDark = previewTheme === 'dark';

  const downloadAsset = (filename: string, url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Sistema de Identidade Visual VIVA+
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Três versões coordenadas para bancas, cabeçalho e ícone de celular
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
              <button
                onClick={() => setPreviewTheme('light')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  previewTheme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
                title="Visualizar em Fundo Claro"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Claro</span>
              </button>
              <button
                onClick={() => setPreviewTheme('dark')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  previewTheme === 'dark'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
                title="Visualizar em Fundo Escuro"
              >
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Escuro</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Fechar painel de marcas"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1. AS TRÊS VERSÕES COORDENADAS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              1. As Três Versões Coordenadas Lado a Lado
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Tema ativo: <strong>{isDark ? 'Fundo Escuro' : 'Fundo Claro'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* VERSÃO 1: LOGO COMPLETA */}
            <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded-full">
                    Apresentações & Slides
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                    LOGO COMPLETA
                  </h4>
                </div>
              </div>
              <div
                className={`p-4 flex-1 flex flex-col items-center justify-center min-h-[260px] transition-colors ${
                  isDark ? 'bg-[#0f172a]' : 'bg-white'
                }`}
              >
                <VivaLogo variant="full" size="md" theme={previewTheme} />
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <p className="line-clamp-2">
                  Inclui o símbolo, o nome <strong>VIVA+</strong>, <em>“Tecnologia que entende você”</em> e <em>“Enxergue • Entenda • Decida • Viva.”</em>.
                </p>
                <button
                  onClick={() =>
                    downloadAsset(
                      `viva_logo_completa_${previewTheme}.svg`,
                      `/assets/brand/viva_logo_completa_${previewTheme}.svg`
                    )
                  }
                  className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar SVG Vetorial Alta Resolução</span>
                </button>
              </div>
            </div>

            {/* VERSÃO 2: LOGO DE CABEÇALHO */}
            <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded-full">
                    Topo do Celular
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                    LOGO DE CABEÇALHO
                  </h4>
                </div>
              </div>
              <div
                className={`p-4 flex-1 flex flex-col items-center justify-center min-h-[260px] relative transition-colors ${
                  isDark ? 'bg-slate-900' : 'bg-slate-50'
                }`}
                style={{
                  backgroundImage: isDark
                    ? 'radial-gradient(#334155 1px, transparent 1px)'
                    : 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              >
                <div
                  className={`p-4 rounded-2xl ${
                    isDark ? 'bg-slate-950/80 border border-slate-800' : 'bg-white/80 border border-slate-200'
                  } backdrop-blur-sm shadow-sm flex items-center justify-center`}
                >
                  <VivaLogo variant="header" size="lg" theme={previewTheme} />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 mt-3">
                  Fundo 100% Transparente • Sem textos miúdos
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <p className="line-clamp-2">
                  Horizontal e compacta: apenas símbolo e <strong>VIVA+</strong>. Perfeita para topo de smartphones sem sobrecarregar.
                </p>
                <button
                  onClick={() =>
                    downloadAsset(
                      `viva_logo_cabecalho_${previewTheme}.svg`,
                      `/assets/brand/viva_logo_cabecalho_${previewTheme}.svg`
                    )
                  }
                  className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar SVG Fundo Transparente</span>
                </button>
              </div>
            </div>

            {/* VERSÃO 3: ÍCONE DO APLICATIVO */}
            <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    Launcher & PWA
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                    ÍCONE DO APLICATIVO
                  </h4>
                </div>
                <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    onClick={() => setIconMask('squircle')}
                    className={`px-1.5 py-0.5 rounded ${
                      iconMask === 'squircle' ? 'bg-white dark:bg-slate-900 shadow-sm text-sky-600' : 'text-slate-600 dark:text-slate-300'
                    }`}
                    title="Formato iOS / PWA (Squircle)"
                  >
                    iOS
                  </button>
                  <button
                    onClick={() => setIconMask('circle')}
                    className={`px-1.5 py-0.5 rounded ${
                      iconMask === 'circle' ? 'bg-white dark:bg-slate-900 shadow-sm text-sky-600' : 'text-slate-600 dark:text-slate-300'
                    }`}
                    title="Formato Android (Círculo Adaptativo)"
                  >
                    Android
                  </button>
                  <button
                    onClick={() => setIconMask('square')}
                    className={`px-1.5 py-0.5 rounded ${
                      iconMask === 'square' ? 'bg-white dark:bg-slate-900 shadow-sm text-sky-600' : 'text-slate-600 dark:text-slate-300'
                    }`}
                    title="Quadrado Base 1:1"
                  >
                    1:1
                  </button>
                </div>
              </div>
              <div
                className={`p-4 flex-1 flex flex-col items-center justify-center min-h-[260px] relative transition-colors ${
                  isDark ? 'bg-slate-950' : 'bg-slate-100'
                }`}
              >
                <div
                  className={`w-32 h-32 relative flex items-center justify-center shadow-lg transition-all ${
                    iconMask === 'circle'
                      ? 'rounded-full'
                      : iconMask === 'squircle'
                      ? 'rounded-[28px]'
                      : 'rounded-xl'
                  } ${isDark ? 'bg-[#0f172a] border-2 border-slate-700' : 'bg-white border-2 border-slate-200'}`}
                >
                  <VivaLogo variant="app-icon" size="custom" className="w-full h-full !border-none !shadow-none !bg-transparent" theme={previewTheme} />
                  {showSafeArea && (
                    <div
                      className="absolute inset-2.5 rounded-full border border-dashed border-red-500/60 pointer-events-none flex items-center justify-center"
                      title="Margem interna de segurança (Safe Area)"
                    >
                      <span className="text-[9px] font-black text-red-500/80 -mt-20 bg-white/80 dark:bg-slate-900/80 px-1 rounded">
                        Área Segura
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <input
                    type="checkbox"
                    id="safeAreaCheck"
                    checked={showSafeArea}
                    onChange={(e) => setShowSafeArea(e.target.checked)}
                    className="w-3.5 h-3.5 text-sky-600 rounded"
                  />
                  <label htmlFor="safeAreaCheck" className="text-[11px] font-semibold text-slate-500 cursor-pointer">
                    Mostrar margem de segurança (Safe Area)
                  </label>
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <p className="line-clamp-2">
                  Formato quadrado, sem palavras. Margens generosas evitam cortes em máscaras circulares ou arredondadas.
                </p>
                <button
                  onClick={() =>
                    downloadAsset(
                      `viva_icone_app_${previewTheme}.svg`,
                      `/assets/brand/viva_icone_app_${previewTheme}.svg`
                    )
                  }
                  className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Ícone SVG 512x512</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. SIMULAÇÃO EM TAMANHO REAL */}
        <section className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              2. Simulação em Tamanho Real de Smartphone
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Escala 1:1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CABEÇALHO DO CELULAR */}
            <div className="rounded-3xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layout className="w-4 h-4 text-sky-600" />
                  Simulação 1: Logo no Cabeçalho de Celular
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  100% Legível
                </span>
              </div>
              <div className="max-w-[360px] mx-auto rounded-3xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-900">
                <div className="bg-slate-900 text-white px-4 py-1 flex items-center justify-between text-[11px] font-bold tracking-tight">
                  <span>09:41</span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span>5G</span>
                    <div className="w-4 h-2 border border-white rounded-xs p-0.5 flex items-center">
                      <div className="w-2.5 h-full bg-white rounded-2xs" />
                    </div>
                  </div>
                </div>
                <div className="w-full bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between gap-1 shadow-sm">
                  <div className="flex items-center">
                    <VivaLogo variant="header" size="md" theme={previewTheme} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700 px-2 py-1 rounded-xl text-xs font-bold">
                      Entrar
                    </span>
                    <span className="bg-red-600 text-white px-2 py-1 rounded-xl text-xs font-black shadow-xs">
                      SOS
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-500 space-y-1 text-center">
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    O nome “VIVA+” permanece perfeitamente legível.
                  </p>
                </div>
              </div>
            </div>

            {/* ÍCONE NA TELA INICIAL */}
            <div className="rounded-3xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layout className="w-4 h-4 text-emerald-600" />
                  Simulação 2: Ícone na Tela Inicial do Celular
                </span>
                <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full">
                  Sem Cortes
                </span>
              </div>
              <div className="max-w-[360px] mx-auto rounded-3xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-lg bg-gradient-to-b from-sky-900 via-indigo-950 to-slate-950 text-white p-3 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold px-1 opacity-80">
                  <span>09:41</span>
                  <span>100%</span>
                </div>
                <div className="text-center py-1">
                  <div className="text-3xl font-light tracking-tight">09:41</div>
                  <div className="text-[11px] text-sky-200 font-medium">Quinta-feira, 24 de setembro</div>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-2 pb-1 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-13 h-13 rounded-[18px] bg-emerald-500 text-white flex items-center justify-center shadow-md">
                      <Phone className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-200">Telefone</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-13 h-13 rounded-[18px] bg-sky-500 text-white flex items-center justify-center shadow-md">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-200">Mensagens</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-13 h-13 rounded-[18px] bg-slate-600 text-white flex items-center justify-center shadow-md">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-200">Câmera</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-13 h-13 flex items-center justify-center shadow-xl border border-white/20 transition-all ${
                        iconMask === 'circle'
                          ? 'rounded-full'
                          : iconMask === 'squircle'
                          ? 'rounded-[18px]'
                          : 'rounded-xl'
                      } ${isDark ? 'bg-slate-900' : 'bg-white'}`}
                    >
                      <VivaLogo
                        variant="app-icon"
                        size="custom"
                        className="w-full h-full !border-none !shadow-none !bg-transparent"
                        theme={previewTheme}
                      />
                    </div>
                    <span className="text-[10px] font-black text-white bg-black/40 px-1.5 py-0.5 rounded-full">
                      VIVA+
                    </span>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 text-[11px] text-sky-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    O símbolo preserva <strong>pessoa, visão, cuidado e saúde</strong> sem nenhum corte de margem.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CONFERÊNCIA RIGOROSA */}
        <section className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
          <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Conferência Rigorosa da Grafia Oficial
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Nome da Marca</span>
              <strong className="text-sky-700 dark:text-sky-300 text-sm">VIVA+</strong>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Apresentação</span>
              <strong className="text-slate-800 dark:text-slate-200">Tecnologia que entende você</strong>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Lema dos Pilares</span>
              <strong className="text-emerald-700 dark:text-emerald-300">Enxergue • Entenda • Decida • Viva.</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
