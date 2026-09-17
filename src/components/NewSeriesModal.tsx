import React, { useState, useEffect } from 'react';
import { X, Flame } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Exercicio, SerieTreino } from '../types';
import { isoHoje } from '../utils/calculations';

interface NewSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercicios: Exercicio[];
  seriesExistentes: SerieTreino[];
  onSave: (novaSerie: Omit<SerieTreino, 'id'>, iniciarTimer: boolean) => void;
  dataSessao?: string;
}

export const NewSeriesModal: React.FC<NewSeriesModalProps> = ({
  isOpen,
  onClose,
  exercicios,
  seriesExistentes,
  onSave,
  dataSessao
}) => {
  const [data, setData] = useState<string>(dataSessao || isoHoje());
  const [exercicioNome, setExercicioNome] = useState<string>('');
  const [serieNum, setSerieNum] = useState<number>(1);
  const [carga, setCarga] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [pse, setPse] = useState<string>('7');
  const [rir, setRir] = useState<string>('');
  const [vas, setVas] = useState<string>('');
  const [obs, setObs] = useState<string>('');
  const [aquecimento, setAquecimento] = useState<boolean>(false);
  const [dicaUltima, setDicaUltima] = useState<string>('');

  useEffect(() => {
    if (exercicios.length > 0 && !exercicioNome) {
      setExercicioNome(exercicios[0].nome);
    }
  }, [exercicios, exercicioNome]);

  // Atualiza número da série e dica do histórico do exercício selecionado
  useEffect(() => {
    if (!exercicioNome) return;
    const doDia = seriesExistentes.filter(
      (s) => s.data === data && s.exercicio === exercicioNome
    );
    setSerieNum(doDia.length + 1);

    // Encontrar último treino desse exercício
    const historico = seriesExistentes
      .filter((s) => s.exercicio === exercicioNome && !s.aquecimento && (s.carga ?? 0) > 0)
      .sort((a, b) => b.data.localeCompare(a.data));

    if (historico.length > 0) {
      const u = historico[0];
      setDicaUltima(`Última vez: ${u.carga} kg × ${u.reps} reps (${u.data})`);
      if (!carga) {
        setCarga(String(u.carga));
      }
      if (!reps && u.reps) {
        setReps(String(u.reps));
      }
    } else {
      setDicaUltima('Primeiro registro deste exercício.');
    }
  }, [exercicioNome, data, seriesExistentes]);

  const handleSubmit = (iniciarDescanso: boolean) => {
    const exObj = exercicios.find((e) => e.nome === exercicioNome);
    const grupo = exObj ? exObj.grupo : 'Outro';

    const nova: Omit<SerieTreino, 'id'> = {
      data,
      exercicio: exercicioNome,
      grupo,
      serieNum: Number(serieNum) || 1,
      carga: carga !== '' ? Number(carga) : null,
      reps: reps !== '' ? Number(reps) : null,
      pse: pse !== '' ? Number(pse) : null,
      rir: rir !== '' ? Number(rir) : null,
      vas: vas !== '' ? Number(vas) : null,
      obs: obs.trim(),
      aquecimento,
      criadoEm: Date.now()
    };

    onSave(nova, iniciarDescanso);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-[#1A231E] border border-stone-200 dark:border-[#2D3D34] w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, y: 35, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 35, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-[#2D3D34]">
          <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-white">Registrar Série</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#232E27] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 pt-4">
          {/* Data */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">Data da Sessão</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>

          {/* Exercício */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">Exercício</label>
            <select
              value={exercicioNome}
              onChange={(e) => setExercicioNome(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            >
              {exercicios.map((ex) => (
                <option key={ex.id} value={ex.nome} className="bg-white dark:bg-[#1A231E]">
                  {ex.nome} ({ex.grupo})
                </option>
              ))}
            </select>
            {dicaUltima && (
              <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium mt-1">{dicaUltima}</p>
            )}
          </div>

          {/* Aquecimento Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-[#151D18] border border-stone-200 dark:border-[#2D3D34]">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>Série de Aquecimento</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Não entra no volume total nem no cálculo do ACWR
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={aquecimento}
                onChange={(e) => setAquecimento(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-stone-300 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Carga, Reps, Série Num */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">Série nº</label>
              <input
                type="number"
                min="1"
                value={serieNum}
                onChange={(e) => setSerieNum(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-800 dark:text-white text-sm font-semibold text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">Carga (kg)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="0"
                value={carga}
                onChange={(e) => setCarga(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-800 dark:text-white text-sm font-semibold text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">Repetições</label>
              <input
                type="number"
                min="1"
                placeholder="0"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-800 dark:text-white text-sm font-semibold text-center"
              />
            </div>
          </div>

          {/* RPE / PSE, RIR, Dor */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                PSE (0-10)
              </label>
              <select
                value={pse}
                onChange={(e) => setPse(e.target.value)}
                className="w-full px-2 py-2 rounded-lg border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-800 dark:text-white text-xs font-medium"
              >
                <option value="">–</option>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                  <option key={v} value={v}>
                    {v} {v === 10 ? '(Max)' : v === 7 ? '(Forte)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                RIR (Reserva)
              </label>
              <select
                value={rir}
                onChange={(e) => setRir(e.target.value)}
                className="w-full px-2 py-2 rounded-lg border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-800 dark:text-white text-xs font-medium"
              >
                <option value="">–</option>
                {[0, 1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    {v} {v === 0 ? '(Falha)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Dor (VAS 0-10)
              </label>
              <select
                value={vas}
                onChange={(e) => setVas(e.target.value)}
                className="w-full px-2 py-2 rounded-lg border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-800 dark:text-white text-xs font-medium"
              >
                <option value="">0 (Sem dor)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">Observações</label>
            <input
              type="text"
              placeholder="Ex: pegada aberta, velocidade, etc."
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-800 dark:text-white text-sm"
            />
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => handleSubmit(true)}
              className="w-full py-3 px-4 rounded-xl bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Salvar e Iniciar Descanso</span>
            </button>

            <button
              onClick={() => handleSubmit(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-[#26352D] hover:bg-stone-200 dark:hover:bg-[#304238] text-stone-800 dark:text-stone-200 font-semibold text-sm transition-all active:scale-98 cursor-pointer"
            >
              Salvar Série Apenas
            </button>
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
