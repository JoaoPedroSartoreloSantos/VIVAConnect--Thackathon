import React, { useState } from 'react';
import { X, ShieldCheck, Heart, Award, Lock, Eye, Sparkles } from 'lucide-react';
import { VivaLogo } from './VivaLogo';
import { BrandShowcaseModal } from './BrandShowcaseModal';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-sky-600" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Sobre o Projeto VIVA+
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl"
              aria-label="Fechar janela sobre o projeto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <VivaLogo variant="full" size="sm" />

          {/* Botão de Destaque: Sistema de Identidade Visual e Logos */}
          <button
            onClick={() => setIsBrandModalOpen(true)}
            className="w-full bg-gradient-to-r from-sky-50 to-emerald-50 dark:from-sky-950/60 dark:to-emerald-950/60 hover:from-sky-100 hover:to-emerald-100 border-2 border-sky-300 dark:border-sky-700 p-3 rounded-2xl flex items-center justify-between text-left transition group shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                  Identidade Visual & Logos Coordenadas
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Ver Logo Completa, Logo de Cabeçalho e Ícone do App
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-sky-700 dark:text-sky-300 group-hover:translate-x-0.5 transition">
              Abrir →
            </span>
          </button>

          <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800">
              <h4 className="font-extrabold text-sky-900 dark:text-sky-200 mb-1 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-sky-600" />
                Proposta de Valor e Acessibilidade
              </h4>
              <p>
                O <strong>VIVA+</strong> foi desenvolvido especialmente para idosos e pessoas com dificuldades visuais, motoras ou de leitura. Seu lema é <em>“Enxergue. Entenda. Decida. Viva.”</em>, combinando tecnologia assistiva (alto contraste, aumento de fonte, leitura em voz alta, botão de SOS com acionamento em pop-up rápido e transparente) e inteligência artificial para autonomia e segurança no dia a dia.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <h4 className="font-extrabold text-emerald-900 dark:text-emerald-200 mb-1 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-600" />
                Privacidade e Proteção de Dados (LGPD)
              </h4>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Armazenamento Local:</strong> Suas medições de saúde, remédios e telefone de confiança ficam salvos na memória do seu aparelho.</li>
                <li><strong>Sem cadastros desnecessários:</strong> Não solicitamos CPF, senhas bancárias ou dados pessoais invasivos.</li>
                <li><strong>IA Segura:</strong> Ao analisar mensagens suspeitas ou receitas, os dados são processados com segurança sem salvar histórico em bancos de terceiros. Nenhum link suspeito é aberto.</li>
              </ul>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800">
              <h4 className="font-extrabold text-amber-900 dark:text-amber-200 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Diferenciais VIVA+
              </h4>
              <ul className="space-y-1 mt-1 list-disc list-inside">
                <li>Botão SOS disponível como pop-up flutuante permanente na tela e nos cabeçalhos, com confirmação anti-discagem acidental.</li>
                <li>Acionamento real do discador do celular e mensagens de socorro preparadas com GPS opcional.</li>
                <li>Inteligência artificial real para análise contextual de fraudes e transcrição de receitas/rótulos.</li>
                <li>Adesão rigorosa às diretrizes de acessibilidade WCAG 2.2 AA/AAA.</li>
              </ul>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-3 rounded-2xl shadow transition"
          >
            Fechar
          </button>
        </div>
      </div>

      <BrandShowcaseModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
      />
    </>
  );
};
