import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { isoHoje, classificaTQR } from '../utils/calculations';

interface TqrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: string, valor: number) => void;
  valorAtual?: number;
}

export const TqrModal: React.FC<TqrModalProps> = ({
  isOpen,
  onClose,
  onSave,
  valorAtual = 15
}) => {
  const [data, setData] = useState<string>(isoHoje());
  const [valor, setValor] = useState<number>(valorAtual);

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
            className="bg-white dark:bg-[#1A231E] border border-stone-200 dark:border-[#2D3D34] w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, y: 35, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 35, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-[#2D3D34]">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-white">TQR — Recuperação</h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Total Quality Recovery (Kenttä &amp; Hassmén, 1998)</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#232E27] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">Data</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-800 dark:text-white text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                    Como você se sente recuperado hoje? (Escala 6 a 20)
                  </label>
                  <span className="font-serif font-bold text-lg text-emerald-800 dark:text-emerald-400">{valor}</span>
                </div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-3 py-1.5 rounded-lg">
                  {classificaTQR(valor)}
                </p>

                {/* Grid de opções 6 a 20 */}
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: 15 }, (_, i) => i + 6).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setValor(v)}
                      className={`py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                        valor === v
                          ? 'bg-emerald-800 dark:bg-emerald-600 text-white shadow-sm scale-105'
                          : 'bg-stone-100 dark:bg-[#26352D] hover:bg-stone-200 dark:hover:bg-[#304238] text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-[#151D18] p-3 rounded-xl border border-stone-200 dark:border-[#2D3D34]">
                <strong>Referência:</strong> 6–8: Muito baixa | 9–11: Baixa | 12–14: Moderada | 15–17: Boa | 18–20: Total.
                Cruzar o TQR com o ACWR ajuda a prevenir lesões e overreaching.
              </div>

              <button
                onClick={() => {
                  onSave(data, valor);
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar TQR</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
