import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Activity,
  HeartPulse,
  Dumbbell,
  Clock,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SerieTreino,
  RegistroTQR,
  Exercicio,
  ConfigApp,
  MensagemIA
} from '../types';
import {
  isoHoje,
  calcularCargaDiaria,
  fmtBR,
  classificaTQR
} from '../utils/calculations';
import { getLocal, setLocal } from '../utils/storage';

interface AiCoachViewProps {
  series: SerieTreino[];
  tqrList: RegistroTQR[];
  exercicios: Exercicio[];
  config: ConfigApp;
  onOpenNewSeries?: () => void;
  onOpenTqr?: () => void;
}

const SUGESTOES_RAPIDAS = [
  {
    titulo: '🧠 Avaliar Prontidão Hoje',
    texto: 'Analise meu estado fisiológico de hoje cruzando meu ACWR, TQR de recuperação e séries recentes. Devo treinar pesado, moderado ou focar em recuperação?'
  },
  {
    titulo: '🩹 Adaptação por Dor / Desconforto',
    texto: 'Estou sentindo um incômodo durante o treino. Como adaptar os exercícios de hoje para não agravar a dor e manter o estímulo hipertrófico seguro?'
  },
  {
    titulo: '⚡ Treino Rápido (Pouco Tempo)',
    texto: 'Tenho apenas 30 a 40 minutos hoje. Como adaptar o volume e os exercícios para manter a máxima intensidade e eficiência sem perder resultados?'
  },
  {
    titulo: '📈 Progressão de Carga Segura',
    texto: 'Como saber a hora certa de subir a carga baseado nas repetições em reserva (RIR) e PSE das minhas últimas séries?'
  },
  {
    titulo: '🥱 Recuperação & Fadiga Excessiva',
    texto: 'Meu TQR de recuperação está baixo e sinto peso no corpo. O que isso significa fisiologicamente e quais ajustes devo fazer no sono, alimentação e treino?'
  }
];

export const AiCoachView: React.FC<AiCoachViewProps> = ({
  series,
  tqrList,
  exercicios,
  config,
  onOpenNewSeries,
  onOpenTqr
}) => {
  const hoje = isoHoje();

  // Histórico de mensagens persistido no storage
  const [mensagens, setMensagens] = useState<MensagemIA[]>(() => {
    return getLocal<MensagemIA[]>('mensagens_ia', [
      {
        id: 'msg-welcome',
        remetente: 'assistant',
        conteudo: `Olá! Sou o seu **Coach IA & Fisiologista do Exercício** pessoal no **Treino & Saúde**.
        
Estou aqui para **facilitar sua rotina**, ajudar em **adaptações imediatas** (quando sentir dor, falta de tempo ou cansaço) e te explicar a ciência por trás do que você está sentindo no corpo (fadiga, recuperação TQR, dores articulares e carga interna ACWR).

Você pode clicar em uma das sugestões rápidas abaixo ou me perguntar qualquer coisa sobre o seu treino de hoje!`,
        dataHora: Date.now()
      }
    ]);
  });

  const [inputTexto, setInputTexto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Modo de adaptação rápida de exercício
  const [modoAdaptacao, setModoAdaptacao] = useState(false);
  const [exercicioSelecionado, setExercicioSelecionado] = useState(exercicios[0]?.nome || 'Supino Reto');
  const [desconfortoSelecionado, setDesconfortoSelecionado] = useState('Dor ou pinçamento no ombro');

  const fimChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocal('mensagens_ia', mensagens);
  }, [mensagens]);

  useEffect(() => {
    fimChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, carregando]);

  // Cálculos do estado fisiológico atual
  const tqrMap = Object.fromEntries(tqrList.map((t) => [t.data, t.valor]));
  const cargasDiarias = calcularCargaDiaria(series, tqrMap);
  const ultimaCarga = cargasDiarias.length > 0 ? cargasDiarias[cargasDiarias.length - 1] : null;

  const tqrHojeObj = tqrList.find((t) => t.data === hoje);
  const tqrValorHoje = tqrHojeObj?.valor ?? null;

  const seriesHoje = series.filter((s) => s.data === hoje);
  const seriesComDor = series.filter((s) => (s.vas ?? 0) >= 3);
  const ultimaDor = seriesComDor.length > 0 ? seriesComDor[seriesComDor.length - 1] : null;

  // Montar contexto estruturado para enviar ao backend
  const montarContextoUsuario = () => {
    const ultimasSeries = series.slice(-15).map((s) => ({
      data: s.data,
      exercicio: s.exercicio,
      grupo: s.grupo,
      carga: s.carga,
      reps: s.reps,
      pse: s.pse,
      rir: s.rir,
      vas: s.vas,
      aquecimento: s.aquecimento
    }));

    return {
      dataHoje: hoje,
      altura: config.altura,
      acwrGabbett: ultimaCarga
        ? {
            acwr: ultimaCarga.acwrGF ? Number(ultimaCarga.acwrGF.toFixed(2)) : null,
            status: ultimaCarga.statusGF,
            aguda7dias: ultimaCarga.agudaGF ? Math.round(ultimaCarga.agudaGF) : null,
            cronica28dias: ultimaCarga.cronicaGF ? Math.round(ultimaCarga.cronicaGF) : null
          }
        : null,
      tqrHoje: tqrValorHoje
        ? {
            valor: tqrValorHoje,
            classificacao: classificaTQR(tqrValorHoje)
          }
        : null,
      seriesHojeQtd: seriesHoje.length,
      seriesHojeResumo: seriesHoje.map((s) => `${s.exercicio}: ${s.carga}kg x ${s.reps} (PSE ${s.pse}, RIR ${s.rir})`),
      ultimoAlertaDor: ultimaDor
        ? {
            exercicio: ultimaDor.exercicio,
            data: ultimaDor.data,
            escalaVAS: ultimaDor.vas,
            obs: ultimaDor.obs
          }
        : null,
      amostraHistoricoRecente: ultimasSeries
    };
  };

  const enviarMensagem = async (textoParaEnviar?: string) => {
    const texto = (textoParaEnviar || inputTexto).trim();
    if (!texto || carregando) return;

    setErroApi(null);

    const novaMensagemUsuario: MensagemIA = {
      id: 'usr-' + Date.now(),
      remetente: 'user',
      conteudo: texto,
      dataHora: Date.now()
    };

    const novoHistorico = [...mensagens, novaMensagemUsuario];
    setMensagens(novoHistorico);
    setInputTexto('');
    setCarregando(true);

    try {
      // Monta histórico recente para dar continuidade na conversa
      const historyPayload = novoHistorico.slice(-8).map((m) => ({
        role: m.remetente === 'user' ? ('user' as const) : ('model' as const),
        text: m.conteudo
      }));

      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: texto,
          context: montarContextoUsuario(),
          history: historyPayload.slice(0, -1) // histórico anterior à pergunta atual
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao se comunicar com o Coach IA.');
      }

      const novaMensagemCoach: MensagemIA = {
        id: 'coach-' + Date.now(),
        remetente: 'assistant',
        conteudo: data.text || 'Entendido. Como mais posso te auxiliar no seu treino?',
        dataHora: Date.now()
      };

      setMensagens((prev) => [...prev, novaMensagemCoach]);
    } catch (err: any) {
      console.error('Erro na resposta do Coach IA:', err);
      setErroApi(err.message || 'Não foi possível obter a resposta do Coach. Verifique sua conexão.');
    } finally {
      setCarregando(false);
    }
  };

  const handleCopiarMensagem = (id: string, conteudo: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(conteudo);
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2500);
    }
  };

  const limparConversa = () => {
    if (window.confirm('Deseja reiniciar a conversa com o Coach IA?')) {
      const inicial: MensagemIA[] = [
        {
          id: 'msg-welcome-' + Date.now(),
          remetente: 'assistant',
          conteudo: 'Conversa reiniciada! Como posso te ajudar no seu treino hoje?',
          dataHora: Date.now()
        }
      ];
      setMensagens(inicial);
      setLocal('mensagens_ia', inicial);
    }
  };

  const solicitarAdaptacaoExercicio = () => {
    const promptAdaptacao = `Preciso de uma adaptação imediata para o exercício: **${exercicioSelecionado}**.
O motivo/sintoma é: **${desconfortoSelecionado}**.
Por favor:
1. Explique brevemente o que essa sensação física ou dor geralmente indica na biomecânica desse movimento.
2. Forneça 2 a 3 opções de exercícios substitutos seguros que mantenham o estímulo no grupo muscular alvo.
3. Indique as recomendações exatas de ajuste de carga (% ou RIR) e volume para a sessão de hoje.`;

    setModoAdaptacao(false);
    enviarMensagem(promptAdaptacao);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Card Superior: Diagnóstico Fisiológico ao Vivo */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-[#1B3528] text-white shadow-lg border border-emerald-700/40 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Sparkles className="w-28 h-28 text-emerald-300" />
        </div>

        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 backdrop-blur-xs border border-emerald-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-white leading-tight">
                Coach IA &amp; Fisiologia
              </h2>
              <p className="text-xs text-emerald-200/80">Adaptado aos seus dados em tempo real</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setModoAdaptacao(!modoAdaptacao)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-emerald-700/60 hover:bg-emerald-600/70 text-emerald-100 border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Adaptar um exercício imediatamente"
            >
              <Dumbbell className="w-3.5 h-3.5 text-emerald-300" />
              <span>Adaptar Exercício</span>
            </button>
            <button
              onClick={limparConversa}
              className="p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300/80 hover:text-white transition-all cursor-pointer"
              title="Limpar histórico da conversa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3 Métricas Rápidas do Atleta */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-800/60">
          <div className="bg-emerald-950/40 rounded-xl p-2.5 border border-emerald-700/30">
            <span className="text-[10px] text-emerald-300/90 font-medium block">ACWR (Gabbett)</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-lg font-bold">
                {ultimaCarga?.acwrGF ? ultimaCarga.acwrGF.toFixed(2) : '--'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-200/80 truncate block">
              {ultimaCarga?.statusGF || 'Sem dados'}
            </span>
          </div>

          <div className="bg-emerald-950/40 rounded-xl p-2.5 border border-emerald-700/30">
            <span className="text-[10px] text-emerald-300/90 font-medium block">TQR Recuperação</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-lg font-bold">
                {tqrValorHoje ? `${tqrValorHoje}/20` : '--'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-200/80 truncate block">
              {tqrValorHoje ? classificaTQR(tqrValorHoje) : 'Não avaliado'}
            </span>
          </div>

          <div className="bg-emerald-950/40 rounded-xl p-2.5 border border-emerald-700/30">
            <span className="text-[10px] text-emerald-300/90 font-medium block">Séries Hoje</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-lg font-bold">{seriesHoje.length}</span>
              <span className="text-[10px] text-emerald-300/80">feitas</span>
            </div>
            <span className="text-[10px] text-emerald-200/80 truncate block">
              {seriesHoje.length > 0 ? `${seriesHoje.reduce((a, b) => a + (b.carga || 0), 0)} kg total` : 'Treino aberto'}
            </span>
          </div>
        </div>

        {/* Alerta de dor recente se houver */}
        {ultimaDor && (
          <div className="mt-2.5 flex items-center gap-2 p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="truncate">
              Aviso: Dor VAS {ultimaDor.vas}/10 anotada em {ultimaDor.exercicio} ({fmtBR(ultimaDor.data)}). Peça adaptação!
            </span>
          </div>
        )}
      </motion.div>

      {/* Painel Expansível de Adaptação Imediata de Exercício */}
      <AnimatePresence>
        {modoAdaptacao && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 rounded-2xl bg-white dark:bg-[#1A231E] border border-stone-200 dark:border-[#2D3D34] shadow-sm space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                Adaptador Biomecânico Rápido
              </h3>
              <button
                onClick={() => setModoAdaptacao(false)}
                className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Qual exercício você quer adaptar?
                </label>
                <select
                  value={exercicioSelecionado}
                  onChange={(e) => setExercicioSelecionado(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-[#2D3D34] bg-stone-50 dark:bg-[#151D18] text-stone-800 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {exercicios.map((ex) => (
                    <option key={ex.id} value={ex.nome}>
                      {ex.nome} ({ex.grupo})
                    </option>
                  ))}
                  {exercicios.length === 0 && (
                    <>
                      <option value="Supino Reto">Supino Reto</option>
                      <option value="Agachamento Livre">Agachamento Livre</option>
                      <option value="Puxada Alta">Puxada Alta</option>
                      <option value="Desenvolvimento Ombros">Desenvolvimento Ombros</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  O que está sentindo ou acontecendo?
                </label>
                <select
                  value={desconfortoSelecionado}
                  onChange={(e) => setDesconfortoSelecionado(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-[#2D3D34] bg-stone-50 dark:bg-[#151D18] text-stone-800 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Dor ou pinçamento articular no ombro">Dor ou pinçamento no ombro</option>
                  <option value="Desconforto ou sobrecarga na lombar">Desconforto ou sobrecarga na lombar</option>
                  <option value="Dor ou estalo no joelho durante o movimento">Dor ou estalo no joelho</option>
                  <option value="Dor no cotovelo ou punho (epicondilite)">Dor no cotovelo ou punho</option>
                  <option value="Fadiga extrema / Músculo sem recuperação">Fadiga extrema no músculo</option>
                  <option value="Aparelho ou barra ocupada na academia">Aparelho/barra ocupado na academia</option>
                  <option value="Pouco tempo para terminar a sessão">Pouco tempo restante na sessão</option>
                </select>
              </div>
            </div>

            <button
              onClick={solicitarAdaptacaoExercicio}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Gerar Adaptação Imediata com IA</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chips de Sugestão Rápida */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
          <span className="text-xs font-bold text-stone-600 dark:text-stone-300">Sugestões de Análise Rápida</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SUGESTOES_RAPIDAS.map((sugestao, idx) => (
            <button
              key={idx}
              onClick={() => enviarMensagem(sugestao.texto)}
              disabled={carregando}
              className="whitespace-nowrap px-3 py-2 rounded-xl bg-stone-100 dark:bg-[#1A231E] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-stone-700 dark:text-stone-200 hover:text-emerald-900 dark:hover:text-emerald-300 text-xs font-semibold border border-stone-200 dark:border-[#2D3D34] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {sugestao.titulo}
            </button>
          ))}
        </div>
      </div>

      {/* Área da Conversa / Feed de Mensagens */}
      <div className="space-y-3 min-h-[300px] bg-stone-50/50 dark:bg-[#121815]/50 p-3 sm:p-4 rounded-2xl border border-stone-200/80 dark:border-[#232E27]">
        <AnimatePresence initial={false}>
          {mensagens.map((msg) => {
            const isUser = msg.remetente === 'user';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-800 text-emerald-200 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs relative group ${
                    isUser
                      ? 'bg-emerald-800 text-white rounded-br-xs'
                      : 'bg-white dark:bg-[#1A231E] text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-[#2D3D34] rounded-bl-xs'
                  }`}
                >
                  {/* Conteúdo com suporte básico a markdown */}
                  <div className="whitespace-pre-wrap font-sans space-y-1.5">
                    {msg.conteudo.split('\n\n').map((paragrafo, pIdx) => {
                      // Processar destaques em negrito (**texto**)
                      const partes = paragrafo.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={pIdx}>
                          {partes.map((parte, idx) => {
                            if (parte.startsWith('**') && parte.endsWith('**')) {
                              return (
                                <strong key={idx} className="font-bold text-emerald-900 dark:text-emerald-300">
                                  {parte.slice(2, -2)}
                                </strong>
                              );
                            }
                            return parte;
                          })}
                        </p>
                      );
                    })}
                  </div>

                  {/* Rodapé da mensagem */}
                  <div className={`flex items-center justify-between gap-2 mt-2 pt-1 text-[10px] ${isUser ? 'text-emerald-200/80' : 'text-stone-400'}`}>
                    <span>
                      {new Date(msg.dataHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopiarMensagem(msg.id, msg.conteudo)}
                        className="hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-0.5 cursor-pointer flex items-center gap-1"
                        title="Copiar texto"
                      >
                        {copiadoId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Indicador de Digitação / Pensamento da IA */}
        {carregando && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2.5 items-center text-xs text-stone-500 dark:text-stone-400 pt-2"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-800 text-emerald-200 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-[#1A231E] border border-stone-200 dark:border-[#2D3D34] flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700 dark:text-emerald-400" />
              <span>O Coach está analisando sua fisiologia e preparando as melhores adaptações...</span>
            </div>
          </motion.div>
        )}

        {/* Mensagem de Erro com botão de tentar novamente */}
        {erroApi && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{erroApi}</p>
              <p className="text-[11px] mt-1 text-rose-700 dark:text-rose-400">
                Dica: Certifique-se de que a GEMINI_API_KEY está configurada no painel Secrets do AI Studio.
              </p>
            </div>
          </div>
        )}

        <div ref={fimChatRef} />
      </div>

      {/* Caixa de Entrada de Texto do Usuário */}
      <div className="sticky bottom-16 sm:bottom-20 bg-white/95 dark:bg-[#121815]/95 backdrop-blur-md p-2 rounded-2xl border border-stone-300 dark:border-[#2D3D34] shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviarMensagem();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            rows={2}
            value={inputTexto}
            onChange={(e) => setInputTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviarMensagem();
              }
            }}
            placeholder="Pergunte ao Coach... (ex: sinto dor no cotovelo, devo treinar hoje?)"
            className="flex-1 px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1A231E] border border-stone-200 dark:border-[#2D3D34] text-stone-800 dark:text-stone-100 text-xs sm:text-sm placeholder:text-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500"
          />

          <button
            type="submit"
            disabled={!inputTexto.trim() || carregando}
            className="h-11 px-4 rounded-xl bg-emerald-800 dark:bg-emerald-600 hover:bg-emerald-900 dark:hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
            title="Enviar mensagem para o Coach"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
