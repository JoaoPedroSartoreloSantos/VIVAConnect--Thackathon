import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Volume2,
  Copy,
  Check,
  ExternalLink,
  HeartPulse,
  Users,
  Target,
  Layers,
  FileText,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { speakText, stopSpeaking } from '../utils/speech';

interface ProjectPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectPresentationModal: React.FC<ProjectPresentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'problema' | 'dados' | 'ods' | 'funcionalidades' | 'saude' | 'referencias'
  >('problema');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySummary = () => {
    const textToCopy = `VIVA+ — Tecnologia que entende você

1. Apresentação e Problema:
Aplicativo de tecnologia assistiva e saúde para idosos e pessoas com deficiência (baixa visão, dificuldades de leitura ou digitais). Enfrenta as barreiras de letras pequenas, textos complexos e interfaces pouco acessíveis para consultar remédios, registrar medições e pedir ajuda. Proposta: interface simples, botões grandes, letras ajustáveis e apoio por áudio.

2. Dados que Fundamentam (Censo 2022 & OMS):
- Brasil (IBGE Censo 2022): ~32,1 milhões de pessoas com 60 anos ou mais.
- Brasil (IBGE Censo 2022): 14,4 milhões de pessoas com deficiência (7,3% da população com 2 anos ou mais).
- Mundo (OMS & UNICEF 2022): Mais de 2,5 bilhões de pessoas necessitam de produtos assistivos.

3. ODS que Fundamentam o Projeto:
- ODS 3 — Saúde e Bem-Estar (Principal): Meta 3.8 (acesso a serviços essenciais e medicamentos).
- ODS 10 — Redução das Desigualdades (Complementar): Meta 10.2 (inclusão de todos independente de idade ou deficiência).

4. As 5 Áreas do VIVA+:
- Início: Enxergue • Entenda • Decida • Viva.
- Ler e ouvir: Leitura assistida de textos, receitas e bulas com áudio.
- Minha Saúde: Registro de medições, histórico e remédios com lembrete pontual.
- Ajuda Perto: Localização de postos de saúde, farmácias e emergências.
- Pedir Ajuda: Contato de confiança e acionamento direto do SAMU 192.

5. Detalhamento de "Minha Saúde":
Registra valores obtidos em aparelhos próprios de medição (o celular não mede pressão arterial nem glicemia). Não substitui consultas nem altera doses. Baseado nos Protocolos Clínicos do Ministério da Saúde.

6. Referências Oficiais:
- IBGE Censo Demográfico 2022 (População idosa e Pessoas com deficiência)
- OMS e UNICEF (Relatório Mundial sobre Tecnologia Assistiva, 2022)
- Ministério da Saúde (PCDT Hipertensão 2025, PCDT Diabetes 2026, Caderneta da Pessoa Idosa)
- Anvisa (Bulário Eletrônico)
- ONU Brasil (ODS 3 e ODS 10)`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    speakText('Resumo completo do projeto VIVA+ copiado para a área de transferência.');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleHearSection = (title: string, content: string) => {
    stopSpeaking();
    speakText(`${title}. ${content}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-presentation-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-emerald-500 overflow-hidden text-slate-900 dark:text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-presentation-title" className="text-lg sm:text-xl font-black leading-tight">
                  VIVA+ — Apresentação, ODS e Dados
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                  Slide & Fontes
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Tecnologia que entende você • Enxergue • Entenda • Decida • Viva.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="btn-contrast-solid bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 sm:px-3 sm:py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
              title="Copiar texto resumido para os slides"
              aria-label="Copiar resumo para slides"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar p/ Slides'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition cursor-pointer"
              aria-label="Fechar apresentação"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 gap-1.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('problema')}
            className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'problema'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>1. Projeto & Problema</span>
          </button>
          <button
            onClick={() => setActiveTab('dados')}
            className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'dados'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Dados IBGE & OMS</span>
          </button>
          <button
            onClick={() => setActiveTab('ods')}
            className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'ods'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>3. ODS 3 & ODS 10</span>
          </button>
          <button
            onClick={() => setActiveTab('funcionalidades')}
            className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'funcionalidades'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4. As 5 Áreas</span>
          </button>
          <button
            onClick={() => setActiveTab('saude')}
            className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'saude'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>5. Minha Saúde & SOS</span>
          </button>
          <button
            onClick={() => setActiveTab('referencias')}
            className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'referencias'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>6. Referências & Links</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm leading-relaxed">
          {/* TAB 1: Projeto e Problema */}
          {activeTab === 'problema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-black text-sky-700 dark:text-sky-300 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  1. Apresentação do Projeto e do Problema
                </h3>
                <button
                  onClick={() =>
                    handleHearSection(
                      'Apresentação do Projeto e do Problema',
                      'O projeto se chama VIVA+: Tecnologia que entende você. É uma proposta de aplicativo de tecnologia assistiva e saúde voltado principalmente a idosos e pessoas com deficiência. O problema é a barreira de letras pequenas, textos complexos e interfaces pouco acessíveis para ler remédios, anotar saúde e pedir ajuda.'
                    )
                  }
                  className="text-xs font-bold text-sky-600 flex items-center gap-1 p-1 hover:underline"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Ouvir</span>
                </button>
              </div>

              <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800 space-y-2">
                <p className="font-bold text-slate-900 dark:text-white">
                  O projeto se chama <strong>VIVA+ — Tecnologia que entende você</strong>.
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  É uma proposta de aplicativo de tecnologia assistiva e saúde, voltado principalmente a
                  idosos e pessoas com deficiência, incluindo pessoas com baixa visão e dificuldades de
                  leitura ou de uso de ferramentas digitais.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-wider">
                  O Problema que Queremos Enfrentar:
                </h4>
                <p className="text-slate-700 dark:text-slate-300">
                  A dificuldade de acessar e compreender informações e organizar os cuidados do dia a dia.
                  Letras pequenas, textos complexos e interfaces pouco acessíveis podem criar barreiras para:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 font-medium pl-1">
                  <li>Consultar informações sobre medicamentos e receitas médicas;</li>
                  <li>Registrar medições rotineiras de saúde (pressão e glicemia);</li>
                  <li>Pedir ajuda e acionar pessoas de confiança com rapidez e clareza.</li>
                </ul>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                <h4 className="font-black text-emerald-900 dark:text-emerald-200 uppercase text-xs">
                  A Proposta de Solução do VIVA+:
                </h4>
                <p className="text-emerald-950 dark:text-emerald-100 font-medium">
                  Reunir esses recursos em uma interface simples, com botões grandes e espaçados para não
                  gerar cliques acidentais, letras ajustáveis e apoio por áudio em voz alta, buscando ampliar
                  a autonomia e o bem-estar dos usuários.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Dados que Fundamentam */}
          {activeTab === 'dados' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-black text-sky-700 dark:text-sky-300 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  2. Dados que Fundamentam a Escolha do Público
                </h3>
                <button
                  onClick={() =>
                    handleHearSection(
                      'Dados que Fundamentam a Escolha do Público',
                      'Segundo o Censo 2022 do IBGE, o Brasil tinha aproximadamente 32,1 milhões de pessoas com 60 anos ou mais, e 14,4 milhões de pessoas com deficiência. Internacionalmente, OMS e UNICEF apontam que mais de 2,5 bilhões de pessoas no mundo precisam de produtos assistivos.'
                    )
                  }
                  className="text-xs font-bold text-sky-600 flex items-center gap-1 p-1 hover:underline"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Ouvir</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300">
                    Censo 2022 - IBGE (Brasil)
                  </span>
                  <div className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-1">
                    32,1 milhões
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">
                    Pessoas com 60 anos ou mais no Brasil, com rápido envelhecimento populacional.
                  </p>
                  <span className="text-[10px] text-slate-500 block mt-2">Fonte: IBGE, Censo 2022</span>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
                    Pessoas com Deficiência (Brasil)
                  </span>
                  <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
                    14,4 milhões
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">
                    Equivalentes a 7,3% da população com dois anos ou mais com alguma deficiência.
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold block mt-2">Fonte: IBGE, Censo 2022</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-700 space-y-1.5 text-amber-950 dark:text-amber-200">
                <h4 className="font-black text-xs uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Rigor Metodológico para a Apresentação:
                </h4>
                <p className="text-xs leading-relaxed">
                  <strong>Não devemos somar os dois números</strong> (32,1 mi + 14,4 mi), porque uma pessoa
                  pode ser idosa e simultaneamente ter deficiência. Além disso, não significa que todas
                  essas pessoas enfrentem as mesmas dificuldades; a tecnologia assistiva oferece recursos
                  flexíveis para diferentes necessidades.
                </p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800">
                <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300">
                  Referência Internacional (OMS & UNICEF, 2022)
                </span>
                <div className="text-xl font-black text-purple-900 dark:text-purple-100 mt-1">
                  Mais de 2,5 bilhões de pessoas
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">
                  No mundo precisam de um ou mais produtos assistivos, abrangendo recursos que apoiam a
                  comunicação e a cognição. Esse dado fundamenta a importância global do tema, mas não é
                  uma estimativa direta de usuários do VIVA+.
                </p>
                <span className="text-[10px] text-slate-500 font-bold block mt-2">
                  Fonte: OMS e UNICEF, 2022
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: ODS */}
          {activeTab === 'ods' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-black text-sky-700 dark:text-sky-300 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  3. Objetivos de Desenvolvimento Sustentável (ODS)
                </h3>
                <button
                  onClick={() =>
                    handleHearSection(
                      'Objetivos de Desenvolvimento Sustentável',
                      'O VIVA+ alinha-se ao ODS 3: Saúde e Bem-Estar como principal, com foco na meta 3.8 de acesso a serviços e medicamentos. E ao ODS 10: Redução das Desigualdades como complementar, com a meta 10.2 de inclusão de idosos e pessoas com deficiência.'
                    )
                  }
                  className="text-xs font-bold text-sky-600 flex items-center gap-1 p-1 hover:underline"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Ouvir</span>
                </button>
              </div>

              {/* ODS 3 */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border-2 border-emerald-400 dark:border-emerald-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-1.5">
                    ODS 3 — Saúde e Bem-Estar (Principal)
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                    Meta 3.8
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  O ODS 3 relaciona-se diretamente à proposta de apoiar a organização dos cuidados, o
                  registro de informações de pressão/glicemia e a compreensão de conteúdos de saúde.
                </p>
                <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                  <strong>Meta 3.8:</strong> Trata do acesso a serviços essenciais de saúde e medicamentos
                  essenciais. O VIVA+ busca contribuir facilitando a compreensão de receitas, dosagens e
                  apoiando a adesão aos tratamentos.
                </p>
              </div>

              {/* ODS 10 */}
              <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border-2 border-sky-400 dark:border-sky-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sky-900 dark:text-sky-200 text-sm flex items-center gap-1.5">
                    ODS 10 — Redução das Desigualdades (Complementar)
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-600 text-white">
                    Meta 10.2
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  O aplicativo atua para reduzir a exclusão digital e comunicacional enfrentada por
                  pessoas com baixa visão, dificuldades cognitivas e idosos.
                </p>
                <p className="text-xs font-semibold text-sky-900 dark:text-sky-300">
                  <strong>Meta 10.2:</strong> Trata da inclusão social, econômica e política de todos,
                  independentemente da idade ou deficiência. O VIVA+ materializa isso por botões grandes,
                  letras ajustáveis, voz assistida e preservação da autonomia do cidadão.
                </p>
              </div>

              <p className="text-xs text-slate-500 italic p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                Nota de apresentação: Essa relação representa o alinhamento da proposta aos ODS da ONU. Não
                há ainda ensaios clínicos ou testes em larga escala publicados que comprovem o impacto
                epidemiológico.
              </p>
            </div>
          )}

          {/* TAB 4: As 5 Áreas */}
          {activeTab === 'funcionalidades' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-black text-sky-700 dark:text-sky-300 flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  4. Interface e as 5 Áreas do VIVA+
                </h3>
                <button
                  onClick={() =>
                    handleHearSection(
                      'As 5 Áreas do VIVA+',
                      'Na tela inicial, a frase: Enxergue, Entenda, Decida e Viva. As cinco áreas são: Início, Ler e ouvir, Minha Saúde, Ajuda Perto e Pedir Ajuda. Na demonstração, destacamos o que já está funcionando e o que depende de internet.'
                    )
                  }
                  className="text-xs font-bold text-sky-600 flex items-center gap-1 p-1 hover:underline"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Ouvir</span>
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                  <strong className="text-emerald-700 dark:text-emerald-300">1. Início:</strong>
                  <span className="text-slate-700 dark:text-slate-300 ml-1">
                    Apresentação, saudação amigável e acesso direto a todos os recursos.
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                  <strong className="text-teal-700 dark:text-teal-300">2. Ler e ouvir:</strong>
                  <span className="text-slate-700 dark:text-slate-300 ml-1">
                    Leitura assistida de fotos de caixas de remédios, receitas e bulas com áudio e
                    explicação simples.
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                  <strong className="text-sky-700 dark:text-sky-300">3. Minha Saúde:</strong>
                  <span className="text-slate-700 dark:text-slate-300 ml-1">
                    Registro de valores obtidos em aparelhos de pressão e glicemia, histórico, remédios com
                    alarme sonoro e Resumo Médico.
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                  <strong className="text-indigo-700 dark:text-indigo-300">4. Ajuda Perto:</strong>
                  <span className="text-slate-700 dark:text-slate-300 ml-1">
                    Localização de postos de saúde (UBS), Farmácia Popular e hospitais mais próximos.
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                  <strong className="text-red-700 dark:text-red-300">5. Pedir Ajuda:</strong>
                  <span className="text-slate-700 dark:text-slate-300 ml-1">
                    Contato com pessoa de confiança via WhatsApp/ligação e atalho telefônico para SAMU 192.
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl space-y-2">
                <h4 className="font-black text-xs uppercase text-slate-800 dark:text-slate-200">
                  Transparência para a Demonstração nos Slides:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <strong className="text-emerald-600 block mb-1">✓ Funcionando 100% no Aparelho:</strong>
                    <span>Interface de alto contraste, controles A+/A-, áudio por voz natural, registro manual de medições, histórico, alarmes locais com vibração e download do executável .exe.</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <strong className="text-sky-600 block mb-1">🌐 Requerem Conexão com Internet:</strong>
                    <span>Reconhecimento avançado de fotos de bulas via IA em nuvem e geolocalização dinâmica de postos de saúde.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Minha Saúde e SOS */}
          {activeTab === 'saude' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-black text-sky-700 dark:text-sky-300 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5" />
                  5. Detalhamento de "Minha Saúde" e Revisão Clínica
                </h3>
                <button
                  onClick={() =>
                    handleHearSection(
                      'Detalhamento de Minha Saúde',
                      'O aplicativo registra valores obtidos em aparelhos próprios de medição. O celular não mede pressão arterial nem glicemia. Não faz diagnósticos e não altera doses. O SOS disca para o SAMU 192 e avisa o contato de confiança.'
                    )
                  }
                  className="text-xs font-bold text-sky-600 flex items-center gap-1 p-1 hover:underline"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Ouvir</span>
                </button>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border-2 border-amber-300 dark:border-amber-700 space-y-2 text-amber-950 dark:text-amber-200">
                <h4 className="font-black text-xs uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Ponto Crucial da Apresentação: O Celular Não Mede
                </h4>
                <p className="text-xs leading-relaxed">
                  É fundamental explicar com clareza: <strong>a proposta é registrar valores obtidos em aparelhos próprios de medição</strong> (aparelho de pressão digital/braçadeira e glicosímetro com tiras). O smartphone não afere pressão nem glicemia por si só.
                </p>
                <p className="text-xs font-bold">
                  O VIVA+ informa expressamente que <strong>não faz diagnósticos e não altera doses de medicamentos</strong>, orientando sempre o usuário a consultar sua equipe da Unidade Básica de Saúde.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-black text-xs uppercase text-slate-800 dark:text-slate-200">
                  Revisão dos Atalhos e Armazenamento:
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  • <strong>Entrada Real:</strong> Foi revisada a solicitação dos valores realmente obtidos no aparelho (sistólica e diastólica), com data e horário reais da medição.
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  • <strong>Privacidade e Dados:</strong> Os registros são guardados na memória local do navegador/aparelho do paciente, evitando que dados de saúde circulem desnecessariamente na internet.
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  • <strong>SOS Realista:</strong> Aciona a discagem telefônica direta para o SAMU 192 e envia mensagem via WhatsApp/celular para o contato cadastrado, com transparência total de que a ligação depende da rede de telefonia.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: Referências & Links */}
          {activeTab === 'referencias' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-black text-sky-700 dark:text-sky-300 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  6. Referências e Links para o Último Slide
                </h3>
                <button
                  onClick={() =>
                    handleHearSection(
                      'Referências Oficiais',
                      'Fontes oficiais: IBGE Censo 2022, OMS e UNICEF 2022, Ministério da Saúde PCDT de Hipertensão e Diabetes, Caderneta da Pessoa Idosa, Anvisa Bulário Eletrônico e ONU Brasil ODS 3 e 10.'
                    )
                  }
                  className="text-xs font-bold text-sky-600 flex items-center gap-1 p-1 hover:underline"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Ouvir</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block text-xs">
                    IBGE. Censo Demográfico 2022: população por idade e sexo — 60 anos ou mais
                  </strong>
                  <a
                    href="https://www.ibge.gov.br/biblioteca/visualizacao/livros/liv102038.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 dark:text-sky-400 hover:underline text-xs flex items-center gap-1 mt-1 break-all"
                  >
                    <span>https://www.ibge.gov.br/biblioteca/visualizacao/livros/liv102038.pdf</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block text-xs">
                    IBGE. Censo 2022: 7,3% da população com 2 anos ou mais tinha alguma deficiência
                  </strong>
                  <a
                    href="https://educa.ibge.gov.br/jovens/materias-especiais/22695-censo-2022-7-3-da-populacao-com-2-anos-ou-mais-tinha-alguma-deficiencia.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 dark:text-sky-400 hover:underline text-xs flex items-center gap-1 mt-1 break-all"
                  >
                    <span>https://educa.ibge.gov.br/.../22695-censo-2022-7-3-da-populacao...</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block text-xs">
                    OMS; UNICEF. Global report on assistive technology. 2022
                  </strong>
                  <a
                    href="https://www.who.int/southeastasia/publications/i/item/9789240049451"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 dark:text-sky-400 hover:underline text-xs flex items-center gap-1 mt-1 break-all"
                  >
                    <span>https://www.who.int/.../9789240049451</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block text-xs">
                    BRASIL. Ministério da Saúde. PCDT Hipertensão Arterial Sistêmica. 2025
                  </strong>
                  <a
                    href="https://www.gov.br/conitec/pt-br/midias/protocolos/pcdt-hipertensao-arterial-sistemica.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 dark:text-sky-400 hover:underline text-xs flex items-center gap-1 mt-1 break-all"
                  >
                    <span>https://www.gov.br/.../pcdt-hipertensao-arterial-sistemica.pdf</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block text-xs">
                    BRASIL. Ministério da Saúde. PCDT Diabete Melito Tipo 2. 2026
                  </strong>
                  <a
                    href="https://www.gov.br/saude/pt-br/assuntos/pcdt/d/diabete-melito-tipo-2.pdf/view"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 dark:text-sky-400 hover:underline text-xs flex items-center gap-1 mt-1 break-all"
                  >
                    <span>https://www.gov.br/.../diabete-melito-tipo-2.pdf</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block text-xs">
                    BRASIL. Ministério da Saúde. Caderneta Brasileira da Pessoa Idosa
                  </strong>
                  <a
                    href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-pessoa-idosa/caderneta-de-saude/caderneta-de-saude"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 dark:text-sky-400 hover:underline text-xs flex items-center gap-1 mt-1 break-all"
                  >
                    <span>https://www.gov.br/.../caderneta-de-saude</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block text-xs">
                    ANVISA. Bulário Eletrônico Oficial
                  </strong>
                  <a
                    href="https://www.gov.br/anvisa/pt-br/sistemas/bulario-eletronico"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 dark:text-sky-400 hover:underline text-xs flex items-center gap-1 mt-1 break-all"
                  >
                    <span>https://www.gov.br/anvisa/pt-br/sistemas/bulario-eletronico</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block text-xs">
                    ONU BRASIL. ODS 3 (Saúde e Bem-Estar) & ODS 10 (Redução das Desigualdades)
                  </strong>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <a
                      href="https://brasil.un.org/pt-br/sdgs/3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:underline text-xs flex items-center gap-1"
                    >
                      <span>brasil.un.org/sdgs/3</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://brasil.un.org/pt-br/sdgs/10"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:underline text-xs flex items-center gap-1"
                    >
                      <span>brasil.un.org/sdgs/10</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                <strong>Ideia Central:</strong> O VIVA+ busca tornar a informação e a organização dos cuidados de saúde mais acessíveis, apoiando a autonomia de idosos e pessoas com deficiência.
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 font-medium">
            Fonte no rodapé dos slides: "Fonte: IBGE, Censo 2022" ou "Fonte: OMS e UNICEF, 2022"
          </span>
          <button
            onClick={onClose}
            className="btn-contrast-solid bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
