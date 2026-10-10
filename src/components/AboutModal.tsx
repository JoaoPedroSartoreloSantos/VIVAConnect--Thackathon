import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Award,
  Lock,
  Eye,
  Sparkles,
  HeartPulse,
  Users,
  ExternalLink,
  BookOpen,
  MapPin,
  FileCheck2,
} from 'lucide-react';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-sky-600" />
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Sobre o VIVA+ • ODS & Dados Oficiais
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition cursor-pointer"
              aria-label="Fechar janela sobre o projeto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <VivaLogo variant="full" size="sm" />

          {/* Botão de Destaque: Sistema de Identidade Visual e Logos */}
          <button
            onClick={() => setIsBrandModalOpen(true)}
            className="w-full bg-gradient-to-r from-sky-50 to-emerald-50 dark:from-sky-950/60 dark:to-emerald-950/60 hover:from-sky-100 hover:to-emerald-100 border-2 border-sky-300 dark:border-sky-700 p-3 rounded-2xl flex items-center justify-between text-left transition group shadow-xs cursor-pointer"
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

          <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {/* 1. Proposta de Valor e Acessibilidade */}
            <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800">
              <h4 className="font-extrabold text-sky-900 dark:text-sky-200 mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
                <Eye className="w-4 h-4 text-sky-600" />
                Proposta de Valor e Acessibilidade Assistiva
              </h4>
              <p>
                O <strong>VIVA+</strong> foi desenvolvido especialmente para idosos e pessoas com dificuldades visuais, motoras ou de leitura. Seu lema é <em>“Enxergue. Entenda. Decida. Viva.”</em>, combinando tecnologia assistiva (alto contraste WCAG AAA, aumento de letra, leitura em voz alta ao tocar nos botões, botão de SOS com discagem direta) e inteligência artificial responsável para autonomia, segurança e saúde no dia a dia.
              </p>
            </div>

            {/* 2. Objetivos de Desenvolvimento Sustentável (ODS) da ONU */}
            <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 dark:from-emerald-950/50 dark:via-slate-900 dark:to-sky-950/50 rounded-2xl border-2 border-emerald-400 dark:border-emerald-700 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                  ODS
                </div>
                <div>
                  <h4 className="font-black text-emerald-950 dark:text-emerald-200 text-xs sm:text-sm leading-tight">
                    Objetivos de Desenvolvimento Sustentável (ODS) da ONU
                  </h4>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                    Fundamentação e alinhamento à Agenda 2030 das Nações Unidas
                  </p>
                </div>
              </div>

              {/* ODS 3 */}
              <div className="p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-black text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                    ODS 3 — Saúde e Bem-Estar (Principal)
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                    Meta 3.8
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                  <strong>Meta 3.8 da ONU:</strong> Atingir a cobertura universal de saúde, incluindo o acesso a serviços de saúde essenciais de qualidade e o acesso a medicamentos e vacinas essenciais seguros, eficazes e de qualidade a preços acessíveis para todos.
                </p>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-[10px] text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed">
                  <strong>Como o VIVA+ cumpre este objetivo:</strong> Fortalece a atenção primária à saúde, organizando horários de medicamentos para evitar esquecimentos e erros de dosagem, registrando medições reais de pressão arterial e glicemia (alinhado aos PCDT do Ministério da Saúde) e localizando imediatamente Unidades Básicas de Saúde (UBS), UPAs 24h e postos do Farmácia Popular do SUS.
                </div>
                <a
                  href="https://brasil.un.org/pt-br/sdgs/3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1 mt-1"
                >
                  Conheça a Meta 3.8 na ONU Brasil <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              {/* ODS 10 */}
              <div className="p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-sky-300 dark:border-sky-800 space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-black text-xs text-sky-900 dark:text-sky-200 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    ODS 10 — Redução das Desigualdades (Complementar)
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300">
                    Meta 10.2
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                  <strong>Meta 10.2 da ONU:</strong> Empoderar e promover a inclusão social, econômica e política de todos, independentemente da idade, deficiência, gênero, raça, etnia, origem, religião ou condição socioeconômica.
                </p>
                <div className="p-2 bg-sky-50 dark:bg-sky-950/40 rounded-lg text-[10px] text-sky-900 dark:text-sky-200 font-medium leading-relaxed">
                  <strong>Como o VIVA+ cumpre este objetivo:</strong> Quebra barreiras de exclusão digital e analfabetismo funcional enfrentadas por 32 milhões de idosos e 14,4 milhões de pessoas com deficiência no Brasil, fornecendo leitura falada em voz alta ao tocar em cada botão, modo alto contraste WCAG AAA, textos simplificados e detector de golpes financeiros (Pix, falso parente) que vitimam idosos diariamente.
                </div>
                <a
                  href="https://brasil.un.org/pt-br/sdgs/10"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-sky-700 dark:text-sky-400 font-bold hover:underline inline-flex items-center gap-1 mt-1"
                >
                  Conheça a Meta 10.2 na ONU Brasil <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            {/* 3. Fontes de Dados Oficiais e Seguros */}
            <div className="p-4 bg-sky-50 dark:bg-sky-950/60 rounded-2xl border-2 border-sky-400 dark:border-sky-700 space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-sky-600 shrink-0" />
                <div>
                  <h4 className="font-black text-sky-950 dark:text-sky-100 text-xs sm:text-sm leading-tight">
                    Fontes Oficiais e Evidências Seguras
                  </h4>
                  <p className="text-[11px] text-sky-800 dark:text-sky-300">
                    De onde tiramos os dados de o que é seguro e os parâmetros do app
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {/* IBGE */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 dark:text-white font-black text-xs">
                      1. IBGE — Censo Demográfico 2022
                    </strong>
                    <span className="text-[9px] font-bold text-sky-600 uppercase">Dados Oficiais BR</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                    7,3% da população com 2 anos ou mais possui alguma deficiência (14,4 milhões de pessoas) e ~32,1 milhões de pessoas idosas (60+ anos) no Brasil.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] mt-1.5">
                    <a
                      href="https://www.ibge.gov.br/biblioteca/visualizacao/livros/liv102038.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
                    >
                      Censo 2022 (Relatório Oficial PDF) ↗
                    </a>
                    <a
                      href="https://educa.ibge.gov.br/jovens/materias-especiais/22695-censo-2022-7-3-da-populacao-com-2-anos-ou-mais-tinha-alguma-deficiencia.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
                    >
                      Educa IBGE Deficiência ↗
                    </a>
                  </div>
                  <span className="text-[9px] text-slate-400 italic block mt-1">
                    Citação oficial: “Fonte: IBGE, Censo 2022”
                  </span>
                </div>

                {/* OMS e UNICEF */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 dark:text-white font-black text-xs">
                      2. OMS & UNICEF — Relatório Mundial 2022
                    </strong>
                    <span className="text-[9px] font-bold text-sky-600 uppercase">Referência Global</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                    <em>Global Report on Assistive Technology:</em> mais de 2,5 bilhões de pessoas necessitam de tecnologia assistiva no mundo, enfrentando barreiras de acesso e custo.
                  </p>
                  <a
                    href="https://www.who.int/southeastasia/publications/i/item/9789240049451"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 dark:text-sky-400 hover:underline text-[10px] block mt-1"
                  >
                    who.int/publications/9789240049451 ↗
                  </a>
                  <span className="text-[9px] text-slate-400 italic block mt-0.5">
                    Citação oficial: “Fonte: OMS e UNICEF, 2022”
                  </span>
                </div>

                {/* Ministério da Saúde */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 dark:text-white font-black text-xs">
                      3. Ministério da Saúde — PCDT & Caderneta do Idoso
                    </strong>
                    <span className="text-[9px] font-bold text-sky-600 uppercase">SUS Brasil</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                    Protocolos Clínicos e Diretrizes Terapêuticas (PCDT) de Hipertensão Arterial Sistêmica (2025) e Diabete Melito Tipo 2 (Atualização 2026), e a Caderneta de Saúde da Pessoa Idosa do SUS para parâmetros seguros.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] mt-1.5">
                    <a
                      href="https://www.gov.br/conitec/pt-br/midias/protocolos/pcdt-hipertensao-arterial-sistemica.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      PCDT Hipertensão 2025 ↗
                    </a>
                    <a
                      href="https://www.gov.br/saude/pt-br/assuntos/pcdt/d/diabete-melito-tipo-2.pdf/view"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      PCDT Diabetes 2026 ↗
                    </a>
                    <a
                      href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-pessoa-idosa/caderneta-de-saude/caderneta-de-saude"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Caderneta da Pessoa Idosa SUS ↗
                    </a>
                  </div>
                </div>

                {/* ANVISA & CNES */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 dark:text-white font-black text-xs">
                      4. ANVISA & CNES/SUS — Remédios e Unidades
                    </strong>
                    <span className="text-[9px] font-bold text-sky-600 uppercase">Bases Nacionais</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                    Bulário Eletrônico da ANVISA para identificação de remédios, e Cadastro Nacional de Estabelecimentos de Saúde (CNES) integrado ao OpenStreetMap para localização de UBS, UPAs e Farmácias Populares em qualquer município do Brasil.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] mt-1.5">
                    <a
                      href="https://www.gov.br/anvisa/pt-br/sistemas/bulario-eletronico"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Bulário Eletrônico ANVISA ↗
                    </a>
                    <a
                      href="https://cnes.datasus.gov.br/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Base CNES / DataSUS ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Privacidade e Proteção de Dados (LGPD) */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <h4 className="font-extrabold text-emerald-900 dark:text-emerald-200 mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
                <Lock className="w-4 h-4 text-emerald-600" />
                Privacidade e Proteção de Dados (LGPD)
              </h4>
              <ul className="space-y-1 list-disc list-inside text-xs">
                <li><strong>Armazenamento Local Seguro:</strong> Suas medições de saúde, remédios e telefone de confiança ficam salvos na memória do seu aparelho.</li>
                <li><strong>Sem cadastros invasivos:</strong> Não solicitamos CPF, senhas bancárias ou dados pessoais sensíveis.</li>
                <li><strong>IA Segura:</strong> Ao analisar mensagens suspeitas ou receitas, os dados são processados com isolamento sem salvar histórico em bancos de terceiros. Nenhum link suspeito é aberto.</li>
              </ul>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold py-3 rounded-2xl transition cursor-pointer text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      <BrandShowcaseModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
      />
    </>
  );
};
