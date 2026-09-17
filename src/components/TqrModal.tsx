import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">TQR — Recuperação</h2>
            <p className="text-xs text-stone-500">Total Quality Recovery (Kenttä & Hassmén, 1998)</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-stone-800 text-sm"
            />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="text-xs font-semibold text-stone-600">
                Como você se sente recuperado hoje? (Escala 6 a 20)
              </label>
              <span className="font-serif font-bold text-lg text-emerald-800">{valor}</span>
            </div>
            <p className="text-xs font-semibold text-emerald-700 mb-3 bg-emerald-50 px-3 py-1.5 rounded-lg">
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
                      ? 'bg-emerald-800 text-white shadow-sm scale-105'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-200">
            <strong>Referência:</strong> 6–8: Muito baixa | 9–11: Baixa | 12–14: Moderada | 15–17: Boa | 18–20: Total.
            Cruzar o TQR com o ACWR ajuda a prevenir lesões e overreaching.
          </div>

          <button
            onClick={() => {
              onSave(data, valor);
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar TQR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
