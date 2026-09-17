import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Layers,
  Calculator,
  Info
} from 'lucide-react';
import { SerieTreino, RegistroTQR, WearablesSemanal } from '../types';
import {
  calcularCargaDiaria,
  volumePorGrupo,
  semanasComTreino,
  progressaoExercicio,
  recordes,
  descritiva,
  correlacao,
  fmtBR
} from '../utils/calculations';

interface AnalysisViewProps {
  series: SerieTreino[];
  tqrList: RegistroTQR[];
  wearables: WearablesSemanal[];
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ series, tqrList, wearables }) => {
  const [subTab, setSubTab] = useState<'acwr' | 'volume' | 'progressao' | 'stats'>('acwr');

  // Preparar dados
  const tqrMapa: Record<string, number> = {};
  tqrList.forEach((t) => {
    tqrMapa[t.data] = t.valor;
  });

  const cargaDiaria = calcularCargaDiaria(series, tqrMapa);
  const ultimaCarga = cargaDiaria.length > 0 ? cargaDiaria[cargaDiaria.length - 1] : null;

  // Semanas para volume
  const semanas = semanasComTreino(series);
  const [semanaSel, setSemanaSel] = useState<string>(semanas[0] || '');
  const volumeGrupo = semanaSel ? volumePorGrupo(series, semanaSel).filter((g) => g.seriesEfetivas > 0) : [];

  // Exercícios para progressão
  const exerciciosComTreino = [...new Set(series.map((s) => s.exercicio))].sort();
  const [exercicioSel, setExercicioSel] = useState<string>(exerciciosComTreino[0] || '');
  const progresso = exercicioSel ? progressaoExercicio(series, exercicioSel) : [];
  const recordesPessoais = recordes(series);

  return (
    <div className="space-y-4">
      {/* Subtabs de Navegação */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-200/80 dark:bg-[#151D18] rounded-xl overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setSubTab('acwr')}
          className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            subTab === 'acwr'
              ? 'bg-white dark:bg-[#1F2B24] text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Carga & ACWR</span>
        </button>

        <button
          onClick={() => setSubTab('volume')}
          className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            subTab === 'volume'
              ? 'bg-white dark:bg-[#1F2B24] text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Volume Semanal</span>
        </button>

        <button
          onClick={() => setSubTab('progressao')}
          className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            subTab === 'progressao'
              ? 'bg-white dark:bg-[#1F2B24] text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Progressão</span>
        </button>

        <button
          onClick={() => setSubTab('stats')}
          className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            subTab === 'stats'
              ? 'bg-white dark:bg-[#1F2B24] text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Estatísticas</span>
        </button>
      </div>

      {/* Subtab: ACWR */}
      {subTab === 'acwr' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#1A231E] p-4 rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                ACWR (Dias de Treino)
              </span>
              <div className="font-serif text-2xl font-bold text-stone-900 dark:text-white">
                {ultimaCarga?.acwrDT ? ultimaCarga.acwrDT.toFixed(2) : '–'}
              </div>
              <span
                className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  ultimaCarga?.statusDT === 'Zona ótima'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : ultimaCarga?.statusDT === 'Atenção'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    : ultimaCarga?.statusDT === 'Risco alto'
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                    : 'bg-stone-100 dark:bg-[#232E27] text-stone-600 dark:text-stone-400'
                }`}
              >
                {ultimaCarga?.statusDT || 'Sem dados'}
              </span>
            </div>

            <div className="bg-white dark:bg-[#1A231E] p-4 rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                ACWR (Gabbett/Foster)
              </span>
              <div className="font-serif text-2xl font-bold text-stone-900 dark:text-white">
                {ultimaCarga?.acwrGF ? ultimaCarga.acwrGF.toFixed(2) : '–'}
              </div>
              <span
                className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  ultimaCarga?.statusGF === 'Zona ótima'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : ultimaCarga?.statusGF === 'Atenção'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    : ultimaCarga?.statusGF === 'Risco alto'
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                    : 'bg-stone-100 dark:bg-[#232E27] text-stone-600 dark:text-stone-400'
                }`}
              >
                {ultimaCarga?.statusGF || 'Sem dados'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/40 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-2.5 leading-relaxed">
            <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Zona segura validada cientificamente (0,80 a 1,30):</strong> O método Gabbett/Foster divide pelos dias de calendário (7 e 28 dias corridos, incluindo descanso). Acima de 1,50 indica salto brusco de carga e risco acentuado de lesão.
            </div>
          </div>

          {/* Gráfico SVG de Carga Aguda x Carga Crônica */}
          <div className="bg-white dark:bg-[#1A231E] p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs">
            <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200 mb-1">
              Carga Aguda vs. Crônica (Gabbett/Foster)
            </h4>
            <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400 mb-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500 inline-block" /> Aguda (7d)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-400 dark:bg-stone-600 inline-block" /> Crônica (28d)
              </span>
            </div>

            {cargaDiaria.length < 2 ? (
              <div className="h-40 flex items-center justify-center text-xs text-stone-400">
                Poucos dados para gerar o gráfico histórico.
              </div>
            ) : (
              <div className="h-48 w-full flex items-end gap-1 pt-4 pb-2 border-b border-stone-200 dark:border-[#2D3D34]">
                {cargaDiaria.slice(-24).map((d) => {
                  const maxVal = Math.max(
                    ...cargaDiaria.map((c) => Math.max(c.agudaGF || 0, c.cronicaGF || 0)),
                    1
                  );
                  const hAguda = ((d.agudaGF || 0) / maxVal) * 100;
                  const hCronica = ((d.cronicaGF || 0) / maxVal) * 100;

                  return (
                    <div key={d.data} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                      <div className="w-full flex items-end justify-center gap-0.5 h-36">
                        <div
                          style={{ height: `${Math.max(4, hAguda)}%` }}
                          className="w-1/2 bg-emerald-600 dark:bg-emerald-500 rounded-t-xs transition-all group-hover:bg-emerald-700"
                        />
                        <div
                          style={{ height: `${Math.max(4, hCronica)}%` }}
                          className="w-1/2 bg-stone-300 dark:bg-[#2C3B33] rounded-t-xs transition-all group-hover:bg-stone-400"
                        />
                      </div>
                      <span className="text-[9px] text-stone-400 dark:text-stone-500 truncate w-full text-center mt-1">
                        {fmtBR(d.data).slice(0, 5)}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-stone-900 dark:bg-stone-800 text-white text-[10px] p-2 rounded-md shadow whitespace-nowrap pointer-events-none">
                        <p className="font-bold">{fmtBR(d.data)}</p>
                        <p>Aguda: {Math.round(d.agudaGF || 0).toLocaleString('pt-BR')}</p>
                        <p>Crônica: {Math.round(d.cronicaGF || 0).toLocaleString('pt-BR')}</p>
                        {d.acwrGF && <p>ACWR: {d.acwrGF.toFixed(2)}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabela de Histórico Diário */}
          <div className="bg-white dark:bg-[#1A231E] rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 dark:border-[#2D3D34]">
              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">Histórico de Carga Diária</h4>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-[#151D18] text-stone-500 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-[#2D3D34] sticky top-0">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Volume</th>
                    <th className="p-3">PSE</th>
                    <th className="p-3">Carga Sessão</th>
                    <th className="p-3">ACWR GF</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-[#26352D] text-stone-700 dark:text-stone-300">
                  {[...cargaDiaria].reverse().map((d) => (
                    <tr key={d.data} className="hover:bg-stone-50 dark:hover:bg-[#232E27]">
                      <td className="p-3 font-medium">{fmtBR(d.data)}</td>
                      <td className="p-3">{d.volumeTotal.toLocaleString('pt-BR')} kg</td>
                      <td className="p-3">{d.pseMedio ? d.pseMedio.toFixed(1) : '–'}</td>
                      <td className="p-3 font-semibold">
                        {d.cargaSessao ? Math.round(d.cargaSessao).toLocaleString('pt-BR') : '–'}
                      </td>
                      <td className="p-3 font-serif font-bold text-stone-900 dark:text-white">
                        {d.acwrGF ? d.acwrGF.toFixed(2) : '–'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.statusGF === 'Zona ótima'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : d.statusGF === 'Atenção'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : d.statusGF === 'Risco alto'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                              : 'bg-stone-100 dark:bg-[#232E27] text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          {d.statusGF}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab: Volume Semanal (Schoenfeld) */}
      {subTab === 'volume' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1A231E] p-4 rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs">
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
              Selecione a Semana de Referência
            </label>
            <select
              value={semanaSel}
              onChange={(e) => setSemanaSel(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-800 dark:text-stone-200 text-sm font-semibold"
            >
              {semanas.map((s) => (
                <option key={s} value={s} className="bg-white dark:bg-[#151D18] text-stone-900 dark:text-white">
                  Semana de {fmtBR(s)}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-[#151D18] border border-stone-200 dark:border-[#2D3D34] text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
            <strong>Referência de Zonas de Hipertrofia (Schoenfeld et al., 2017):</strong> 10 a 20 séries efetivas semanais por grupo muscular é o volume ótimo para a ampla maioria das pessoas treinadas. Séries de aquecimento não são computadas.
          </div>

          <div className="bg-white dark:bg-[#1A231E] rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs p-4 sm:p-5">
            <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200 mb-3">
              Volume por Grupo Muscular (Semana de {fmtBR(semanaSel)})
            </h4>

            {volumeGrupo.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">
                Nenhuma série efetiva nesta semana.
              </p>
            ) : (
              <div className="space-y-3">
                {volumeGrupo.map((g) => {
                  const pct = Math.min(100, (g.seriesEfetivas / 20) * 100);
                  const isOtima = g.zona === 'Zona ótima';
                  const isAlto = g.zona === 'Volume alto';

                  return (
                    <div key={g.grupo} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-800 dark:text-stone-200">{g.grupo}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-600 dark:text-stone-400">
                            {g.seriesEfetivas} séries ({g.volumeKg.toLocaleString('pt-BR')} kg)
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOtima
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : isAlto
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                : 'bg-stone-200 dark:bg-[#2C3B33] text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            {g.zona}
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-2 bg-stone-100 dark:bg-[#151D18] rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all ${
                            isOtima
                              ? 'bg-emerald-600'
                              : isAlto
                              ? 'bg-amber-500'
                              : 'bg-stone-400 dark:bg-stone-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab: Progressão de Carga */}
      {subTab === 'progressao' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1A231E] p-4 rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs">
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
              Selecione o Exercício
            </label>
            <select
              value={exercicioSel}
              onChange={(e) => setExercicioSel(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-800 dark:text-stone-200 text-sm font-semibold"
            >
              {exerciciosComTreino.map((ex) => (
                <option key={ex} value={ex} className="bg-white dark:bg-[#151D18] text-stone-900 dark:text-white">
                  {ex}
                </option>
              ))}
            </select>
          </div>

          {/* Gráfico de Progressão */}
          <div className="bg-white dark:bg-[#1A231E] p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs">
            <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200 mb-3">
              Evolução da Carga Máxima (kg) — {exercicioSel}
            </h4>

            {progresso.length < 2 ? (
              <p className="text-xs text-stone-400 py-8 text-center">
                Dados insuficientes para desenhar curva de evolução.
              </p>
            ) : (
              <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 border-b border-stone-200 dark:border-[#2D3D34]">
                {progresso.map((p) => {
                  const maxCarga = Math.max(...progresso.map((x) => x.carga), 1);
                  const h = (p.carga / maxCarga) * 100;
                  return (
                    <div key={p.data} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        style={{ height: `${Math.max(10, h)}%` }}
                        className="w-full bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 dark:hover:bg-emerald-500 rounded-t-xs transition-all"
                      />
                      <span className="text-[9px] text-stone-500 dark:text-stone-400 truncate w-full text-center">
                        {fmtBR(p.data).slice(0, 5)}
                      </span>
                      <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-stone-900 dark:bg-stone-800 text-white text-[10px] p-1.5 rounded-md shadow whitespace-nowrap pointer-events-none">
                        {p.carga} kg em {fmtBR(p.data)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabela de Recordes Pessoais */}
          <div className="bg-white dark:bg-[#1A231E] rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 dark:border-[#2D3D34]">
              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">Melhores Cargas Registradas (PRs)</h4>
            </div>
            <div className="divide-y divide-stone-100 dark:divide-[#26352D]">
              {recordesPessoais.map((r) => (
                <div key={r.exercicio} className="p-3.5 flex items-center justify-between text-xs hover:bg-stone-50 dark:hover:bg-[#232E27]">
                  <div>
                    <p className="font-bold text-stone-900 dark:text-white">{r.exercicio}</p>
                    <p className="text-stone-500 dark:text-stone-400 text-[11px]">{r.grupo} · Batido em {fmtBR(r.data)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif font-bold text-base text-emerald-800 dark:text-emerald-400">{r.carga} kg</p>
                    {r.reps && <p className="text-[11px] text-stone-500 dark:text-stone-400">{r.reps} reps</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab: Estatísticas & Correlações */}
      {subTab === 'stats' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1A231E] rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs overflow-hidden p-4 sm:p-5">
            <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200 mb-3">Estatísticas Descritivas</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-[#151D18] text-stone-500 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-[#2D3D34]">
                  <tr>
                    <th className="p-2.5">Métrica</th>
                    <th className="p-2.5">n</th>
                    <th className="p-2.5">Média</th>
                    <th className="p-2.5">DP</th>
                    <th className="p-2.5">Mín</th>
                    <th className="p-2.5">Máx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-[#26352D] text-stone-700 dark:text-stone-300">
                  {[
                    ['Volume por sessão (kg)', descritiva(cargaDiaria.map((c) => c.volumeTotal))],
                    ['PSE médio', descritiva(cargaDiaria.map((c) => c.pseMedio))],
                    ['Carga da sessão', descritiva(cargaDiaria.map((c) => c.cargaSessao))],
                    ['ACWR (Gabbett/Foster)', descritiva(cargaDiaria.map((c) => c.acwrGF))],
                    ['TQR (recuperação)', descritiva(cargaDiaria.map((c) => c.tqr))],
                    ['FC de repouso (bpm)', descritiva(wearables.map((w) => w.fcRepouso))]
                  ]
                    .filter(([, stat]) => stat !== null)
                    .map(([nome, stat]: any) => (
                      <tr key={nome} className="hover:bg-stone-50 dark:hover:bg-[#232E27]">
                        <td className="p-2.5 font-medium text-stone-900 dark:text-white">{nome}</td>
                        <td className="p-2.5">{stat.n}</td>
                        <td className="p-2.5 font-semibold">{stat.media.toFixed(1)}</td>
                        <td className="p-2.5 text-stone-500 dark:text-stone-400">±{stat.dp.toFixed(1)}</td>
                        <td className="p-2.5">{stat.min.toFixed(1)}</td>
                        <td className="p-2.5">{stat.max.toFixed(1)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Correlações de Pearson */}
          <div className="bg-white dark:bg-[#1A231E] rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs overflow-hidden p-4 sm:p-5">
            <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200 mb-1">
              Correlações Relevantes (Pearson r)
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-3">
              Mostra se existe relação linear entre variáveis monitoradas no seu treinamento.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-[#151D18] text-stone-500 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-[#2D3D34]">
                  <tr>
                    <th className="p-2.5">Variáveis Pareadas</th>
                    <th className="p-2.5">n</th>
                    <th className="p-2.5">r de Pearson</th>
                    <th className="p-2.5">Interpretação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-[#26352D] text-stone-700 dark:text-stone-300">
                  {[
                    [
                      'PSE médio × Volume da Sessão',
                      correlacao(
                        cargaDiaria.map((c) => c.pseMedio),
                        cargaDiaria.map((c) => c.volumeTotal)
                      )
                    ],
                    [
                      'ACWR × TQR (Recuperação)',
                      correlacao(
                        cargaDiaria.map((c) => c.acwrGF),
                        cargaDiaria.map((c) => c.tqr)
                      )
                    ],
                    [
                      'FC Repouso × Pressão Sistólica',
                      correlacao(
                        wearables.map((w) => w.fcRepouso),
                        wearables.map((w) => w.paSis)
                      )
                    ],
                    [
                      'Qualidade de Sono × Quantidade',
                      correlacao(
                        wearables.map((w) => w.qualSono),
                        wearables.map((w) => w.quantSono)
                      )
                    ]
                  ].map(([label, corr]: any) => (
                    <tr key={label} className="hover:bg-stone-50 dark:hover:bg-[#232E27]">
                      <td className="p-2.5 font-medium text-stone-900 dark:text-white">{label}</td>
                      <td className="p-2.5">{corr.n}</td>
                      <td className="p-2.5 font-serif font-bold text-stone-900 dark:text-white">
                        {corr.r !== null ? corr.r.toFixed(2) : '–'}
                      </td>
                      <td className="p-2.5 text-stone-600 dark:text-stone-400">{corr.forca}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
