import React from 'react';
import { Plus, Trash2, Calendar, Activity, Zap, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
import { SerieTreino, RegistroTQR } from '../types';
import { volumeSerie, serieEfetiva, isoHoje, fmtBR, classificaTQR } from '../utils/calculations';

interface WorkoutViewProps {
  series: SerieTreino[];
  tqrList: RegistroTQR[];
  onOpenNewSeries: () => void;
  onOpenTqr: () => void;
  onDeleteSeries: (id: string) => void;
  onOpenCoach?: () => void;
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  series,
  tqrList,
  onOpenNewSeries,
  onOpenTqr,
  onDeleteSeries,
  onOpenCoach
}) => {
  const hoje = isoHoje();
  const doDia = series.filter((s) => s.data === hoje);

  const volumeTotal = doDia.reduce((acc, s) => acc + volumeSerie(s), 0);
  const efetivas = doDia.filter(serieEfetiva);
  const pses = efetivas
    .map((s) => s.pse)
    .filter((v): v is number => v !== null && v !== undefined && v > 0);
  const pseMedio = pses.length ? pses.reduce((a, b) => a + b, 0) / pses.length : null;
  const cargaSessao = pseMedio !== null ? volumeTotal * pseMedio : null;

  // Agrupamento por exercício
  const porEx = new Map<string, SerieTreino[]>();
  doDia.forEach((s) => {
    if (!porEx.has(s.exercicio)) porEx.set(s.exercicio, []);
    porEx.get(s.exercicio)!.push(s);
  });

  const tqrHoje = tqrList.find((t) => t.data === hoje);

  return (
    <div className="space-y-4">
      {/* Resumo Rápido da Sessão de Hoje */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-[#1A231E] p-4 rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-600 dark:bg-emerald-500" />
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">
            <span>Volume Hoje</span>
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="font-serif text-2xl font-bold text-stone-900 dark:text-white">
            {volumeTotal.toLocaleString('pt-BR')} <span className="text-sm font-sans font-normal text-stone-500 dark:text-stone-400">kg</span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            {efetivas.length} série{efetivas.length === 1 ? '' : 's'} efetiva{efetivas.length === 1 ? '' : 's'}
            {doDia.length > efetivas.length ? ` · ${doDia.length - efetivas.length} aq.` : ''}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A231E] p-4 rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-orange-600" />
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">
            <span>Carga da Sessão</span>
            <Zap className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="font-serif text-2xl font-bold text-stone-900 dark:text-white">
            {cargaSessao !== null ? Math.round(cargaSessao).toLocaleString('pt-BR') : '–'}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            {pseMedio !== null ? `PSE médio ${pseMedio.toFixed(1)}` : 'PSE médio –'}
          </div>
        </div>
      </div>

      {/* TQR - Como você chegou hoje */}
      <div className="bg-white dark:bg-[#1A231E] p-4 rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200">TQR de Hoje (Recuperação)</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {tqrHoje ? `${tqrHoje.valor}/20 · ${classificaTQR(tqrHoje.valor)}` : 'Não registrado hoje'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenTqr}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 dark:border-[#2D3D34] hover:bg-stone-50 dark:hover:bg-[#232E27] text-stone-700 dark:text-stone-300 active:scale-95 transition-all cursor-pointer"
          >
            {tqrHoje ? 'Editar' : 'Avaliar'}
          </button>
        </div>
      </div>

      {/* Card de Acesso Rápido ao Coach IA para adaptações */}
      {onOpenCoach && (
        <div
          onClick={onOpenCoach}
          className="bg-gradient-to-r from-emerald-900/15 via-emerald-800/10 to-teal-900/15 dark:from-emerald-950/70 dark:via-[#1A2520] dark:to-teal-950/50 p-3.5 rounded-2xl border border-emerald-600/30 dark:border-emerald-700/40 flex items-center justify-between cursor-pointer hover:border-emerald-500 active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Dúvida ou Adaptação no Treino?
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-200 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 font-bold uppercase">
                  IA
                </span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5">
                Peça análise de fadiga, substituição de exercício ou ajuste de volume em tempo real.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-700 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
        </div>
      )}

      {/* Lista de Exercícios e Séries de Hoje */}
      <div className="bg-white dark:bg-[#1A231E] rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Sessão de Hoje ({fmtBR(hoje)})</span>
          </div>

          <button
            onClick={onOpenNewSeries}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Série</span>
          </button>
        </div>

        {doDia.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-stone-200 dark:border-[#2D3D34] rounded-xl">
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">Nenhuma série registrada hoje</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto mb-4">
              Toque em "Nova Série" para registrar a carga, repetições e iniciar o descanso cronometrado.
            </p>
            <button
              onClick={onOpenNewSeries}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primeira Série</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {[...porEx.entries()].map(([nomeEx, sets]) => {
              sets.sort((a, b) => a.serieNum - b.serieNum);
              const volEx = sets.reduce((acc, s) => acc + volumeSerie(s), 0);
              const grupo = sets[0].grupo;

              return (
                <div key={nomeEx} className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-[#151D18] border border-stone-200/80 dark:border-[#26352D]">
                  <div className="flex items-baseline justify-between mb-2 pb-1.5 border-b border-stone-200 dark:border-[#26352D]">
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white">{nomeEx}</h4>
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                      {grupo} {volEx > 0 ? `· ${volEx.toLocaleString('pt-BR')} kg` : ''}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {sets.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-xs py-1 px-1.5 hover:bg-white dark:hover:bg-[#1F2B24] rounded-md transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              s.aquecimento
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {s.aquecimento ? 'AQ' : s.serieNum}
                          </span>

                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {s.grupo === 'Cardio'
                              ? s.obs || 'Cardio'
                              : `${s.carga ?? 0} kg × ${s.reps ?? 0} reps`}
                          </span>

                          {s.pse && (
                            <span className="text-[11px] text-stone-500 dark:text-stone-400">· PSE {s.pse}</span>
                          )}
                          {s.rir !== null && s.rir !== undefined && (
                            <span className="text-[11px] text-stone-500 dark:text-stone-400">· RIR {s.rir}</span>
                          )}
                          {s.vas && (
                            <span className="text-[11px] text-rose-600 dark:text-rose-400">· dor {s.vas}</span>
                          )}
                        </div>

                        <button
                          onClick={() => onDeleteSeries(s.id)}
                          className="p-1 text-stone-300 dark:text-stone-600 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Excluir série"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
