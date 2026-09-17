import React, { useState } from 'react';
import { Moon, Bed, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { RegistroPSQI, RegistroESS } from '../types';
import { calcPSQI, calcESS, fmtMesAno, isoHoje } from '../utils/calculations';

interface SleepViewProps {
  psqiList: RegistroPSQI[];
  essList: RegistroESS[];
  onAddPSQI: (p: Omit<RegistroPSQI, 'id'>) => void;
  onDeletePSQI: (id: string) => void;
  onAddESS: (e: Omit<RegistroESS, 'id'>) => void;
  onDeleteESS: (id: string) => void;
}

const ESS_SITUACOES = [
  'Sentado e lendo',
  'Assistindo à TV',
  'Sentado, quieto, em lugar público (cinema, reunião)',
  'Como passageiro em carro por 1 hora sem parar',
  'Deitado à tarde para descansar, quando as circunstâncias permitem',
  'Sentado conversando com alguém',
  'Sentado calmamente após o almoço (sem álcool)',
  'No carro, parado alguns minutos no trânsito'
];

export const SleepView: React.FC<SleepViewProps> = ({
  psqiList,
  essList,
  onAddPSQI,
  onDeletePSQI,
  onAddESS,
  onDeleteESS
}) => {
  const [subTab, setSubTab] = useState<'psqi' | 'ess'>('psqi');
  const [showPsqiModal, setShowPsqiModal] = useState<boolean>(false);
  const [showEssModal, setShowEssModal] = useState<boolean>(false);

  // PSQI Form
  const [mesPsqi, setMesPsqi] = useState<string>(isoHoje().slice(0, 7));
  const [horaDeitar, setHoraDeitar] = useState<string>('23:00');
  const [horaAcordar, setHoraAcordar] = useState<string>('07:00');
  const [latenciaMin, setLatenciaMin] = useState<string>('15');
  const [horasDormidas, setHorasDormidas] = useState<string>('7.5');
  const [p5a, setP5a] = useState<string>('0');
  const [p5bi, setP5bi] = useState<string>('2');
  const [p6, setP6] = useState<string>('1');
  const [p7, setP7] = useState<string>('0');
  const [p89, setP89] = useState<string>('1');

  // ESS Form
  const [mesEss, setMesEss] = useState<string>(isoHoje().slice(0, 7));
  const [essItens, setEssItens] = useState<number[]>([0, 1, 0, 1, 1, 0, 1, 0]);

  const ultimoPsqi = psqiList.length > 0 ? psqiList[psqiList.length - 1] : null;
  const ultimoEss = essList.length > 0 ? essList[essList.length - 1] : null;

  const handleSalvarPSQI = (e: React.FormEvent) => {
    e.preventDefault();
    const dados = {
      mes: mesPsqi,
      horaDeitar,
      horaAcordar,
      latenciaMin: latenciaMin ? parseInt(latenciaMin) : null,
      horasDormidas: horasDormidas ? parseFloat(horasDormidas) : null,
      p5aLatencia: p5a ? parseInt(p5a) : null,
      p5biSoma: p5bi ? parseInt(p5bi) : null,
      p6Qualidade: p6 ? parseInt(p6) : null,
      p7Medicacao: p7 ? parseInt(p7) : null,
      p89Disfuncao: p89 ? parseInt(p89) : null
    };
    const res = calcPSQI(dados);
    onAddPSQI({
      ...dados,
      global: res.global,
      classificacao: res.classificacao
    });
    setShowPsqiModal(false);
  };

  const handleSalvarESS = (e: React.FormEvent) => {
    e.preventDefault();
    const res = calcESS(essItens);
    onAddESS({
      mes: mesEss,
      itens: essItens,
      total: res.total,
      classificacao: res.classificacao
    });
    setShowEssModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Subtabs */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-200/80 dark:bg-[#151D18] rounded-xl overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setSubTab('psqi')}
          className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            subTab === 'psqi'
              ? 'bg-white dark:bg-[#1F2B24] text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <Bed className="w-3.5 h-3.5" />
          <span>PSQI (Qualidade de Sono)</span>
        </button>

        <button
          onClick={() => setSubTab('ess')}
          className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            subTab === 'ess'
              ? 'bg-white dark:bg-[#1F2B24] text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Epworth (Sonolência Diurna)</span>
        </button>
      </div>

      {/* Subtab PSQI */}
      {subTab === 'psqi' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1A231E] p-4 rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block mb-1">
              Score Global PSQI Mais Recente
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-stone-900 dark:text-white">
                {ultimoPsqi?.global !== null && ultimoPsqi?.global !== undefined
                  ? ultimoPsqi.global
                  : '–'}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">/ 21 pontos</span>
            </div>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 mt-2">
              {ultimoPsqi?.classificacao || 'Nenhum questionário respondido'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-[#151D18] border border-stone-200 dark:border-[#2D3D34] text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
            <strong>Pittsburgh Sleep Quality Index (Buysse et al., 1989):</strong> Avalia a qualidade subjetiva, latência, duração, eficiência e perturbações no último mês. Score acima de 5 sugere qualidade de sono ruim.
          </div>

          <div className="bg-white dark:bg-[#1A231E] rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">Histórico de Avaliações PSQI</h4>
              <button
                onClick={() => setShowPsqiModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Responder Mês</span>
              </button>
            </div>

            {psqiList.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">Nenhum PSQI registrado.</p>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-[#26352D]">
                {[...psqiList].reverse().map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs hover:bg-stone-50 dark:hover:bg-[#232E27] px-2 rounded-lg">
                    <div>
                      <p className="font-semibold text-stone-900 dark:text-white">{fmtMesAno(p.mes)}</p>
                      <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                        Score: {p.global ?? '–'} · {p.classificacao}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif font-bold text-base text-stone-800 dark:text-stone-200">{p.global}</span>
                      <button
                        onClick={() => onDeletePSQI(p.id)}
                        className="text-stone-300 dark:text-stone-600 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab ESS */}
      {subTab === 'ess' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1A231E] p-4 rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block mb-1">
              Score Epworth Mais Recente
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-stone-900 dark:text-white">
                {ultimoEss?.total !== null && ultimoEss?.total !== undefined ? ultimoEss.total : '–'}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">/ 24 pontos</span>
            </div>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 mt-2">
              {ultimoEss?.classificacao || 'Nenhum questionário respondido'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-[#151D18] border border-stone-200 dark:border-[#2D3D34] text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
            <strong>Escala de Sonolência de Epworth (Johns, 1991):</strong> Avalia a chance de cochilar (0 a 3) em 8 situações cotidianas. Score acima de 10 sugere sonolência excessiva.
          </div>

          <div className="bg-white dark:bg-[#1A231E] rounded-2xl border border-stone-200 dark:border-[#2D3D34] shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">Histórico de Avaliações Epworth</h4>
              <button
                onClick={() => setShowEssModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Responder Mês</span>
              </button>
            </div>

            {essList.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">Nenhum questionário ESS registrado.</p>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-[#26352D]">
                {[...essList].reverse().map((e) => (
                  <div key={e.id} className="py-3 flex items-center justify-between text-xs hover:bg-stone-50 dark:hover:bg-[#232E27] px-2 rounded-lg">
                    <div>
                      <p className="font-semibold text-stone-900 dark:text-white">{fmtMesAno(e.mes)}</p>
                      <p className="text-stone-500 dark:text-stone-400 text-[11px]">{e.classificacao}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif font-bold text-base text-stone-800 dark:text-stone-200">{e.total}</span>
                      <button
                        onClick={() => onDeleteESS(e.id)}
                        className="text-stone-300 dark:text-stone-600 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal PSQI */}
      {showPsqiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A231E] border border-stone-200 dark:border-[#2D3D34] w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white mb-2">Questionário PSQI</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">Referente aos hábitos do último mês</p>

            <form onSubmit={handleSalvarPSQI} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300">Mês de Referência</label>
                <input
                  type="month"
                  value={mesPsqi}
                  onChange={(e) => setMesPsqi(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-900 dark:text-white rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300">Hora de Deitar (P1)</label>
                  <input
                    type="time"
                    value={horaDeitar}
                    onChange={(e) => setHoraDeitar(e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300">Hora de Acordar (P3)</label>
                  <input
                    type="time"
                    value={horaAcordar}
                    onChange={(e) => setHoraAcordar(e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300">Latência (min) (P2)</label>
                  <input
                    type="number"
                    value={latenciaMin}
                    onChange={(e) => setLatenciaMin(e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-900 dark:text-white rounded-lg"
                    placeholder="Minutos para dormir"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300">Horas Dormidas (P4)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={horasDormidas}
                    onChange={(e) => setHorasDormidas(e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-900 dark:text-white rounded-lg"
                    placeholder="Ex: 7.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300">Qualidade Subjetiva do Sono (P6)</label>
                <select
                  value={p6}
                  onChange={(e) => setP6(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-900 dark:text-white rounded-lg"
                >
                  <option value="0">0 — Muito boa</option>
                  <option value="1">1 — Boa</option>
                  <option value="2">2 — Ruim</option>
                  <option value="3">3 — Muito ruim</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPsqiModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-[#26352D] hover:bg-stone-200 dark:hover:bg-[#304238] font-semibold text-stone-700 dark:text-stone-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white font-bold cursor-pointer"
                >
                  Calcular e Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ESS */}
      {showEssModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A231E] border border-stone-200 dark:border-[#2D3D34] w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white mb-1">Escala de Epworth</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Chance de cochilar: 0 = nenhuma, 1 = pequena, 2 = média, 3 = alta
            </p>

            <form onSubmit={handleSalvarESS} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300">Mês de Referência</label>
                <input
                  type="month"
                  value={mesEss}
                  onChange={(e) => setMesEss(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-900 dark:text-white rounded-lg text-xs"
                  required
                />
              </div>

              {ESS_SITUACOES.map((sit, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#151D18] border border-stone-200 dark:border-[#2D3D34]">
                  <label className="font-semibold text-stone-800 dark:text-stone-200 block mb-1">
                    {idx + 1}. {sit}
                  </label>
                  <select
                    value={essItens[idx]}
                    onChange={(e) => {
                      const novo = [...essItens];
                      novo[idx] = parseInt(e.target.value);
                      setEssItens(novo);
                    }}
                    className="w-full p-1.5 border border-stone-300 dark:border-[#2D3D34] rounded-lg bg-white dark:bg-[#1E2922] text-stone-900 dark:text-white"
                  >
                    <option value={0}>0 — Nenhuma chance de cochilar</option>
                    <option value={1}>1 — Pequena chance</option>
                    <option value={2}>2 — Média chance</option>
                    <option value={3}>3 — Alta chance de cochilar</option>
                  </select>
                </div>
              ))}

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEssModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-[#26352D] hover:bg-stone-200 dark:hover:bg-[#304238] font-semibold text-stone-700 dark:text-stone-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white font-bold cursor-pointer"
                >
                  Salvar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
