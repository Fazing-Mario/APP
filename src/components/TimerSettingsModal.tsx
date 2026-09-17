import React, { useState } from 'react';
import { X, Volume2, Smartphone, Clock } from 'lucide-react';
import { ConfigApp } from '../types';
import { destravarAudio, tocarFimDescanso, formatarTempo } from '../utils/audioTimer';

interface TimerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConfigApp;
  onSave: (newConfig: Partial<ConfigApp>) => void;
}

export const TimerSettingsModal: React.FC<TimerSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave
}) => {
  const [somAtivo, setSomAtivo] = useState<boolean>(config.somAtivo);
  const [vibrarAtivo, setVibrarAtivo] = useState<boolean>(config.vibrarAtivo);
  const [volumeSom, setVolumeSom] = useState<number>(config.volumeSom);
  const [avisoFaltando, setAvisoFaltando] = useState<number>(config.avisoFaltando);
  const [descansoPadrao, setDescansoPadrao] = useState<number>(config.descansoPadrao);

  if (!isOpen) return null;

  const testarAlarme = () => {
    destravarAudio();
    tocarFimDescanso(volumeSom);
  };

  const handleSalvar = () => {
    onSave({
      somAtivo,
      vibrarAtivo,
      volumeSom,
      avisoFaltando,
      descansoPadrao
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <h2 className="text-xl font-serif font-bold text-stone-900">Ajustes do Descanso</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 pt-4">
          {/* Som Ativo */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-emerald-800" />
              <div>
                <p className="text-xs font-bold text-stone-800">Alarme Sonoro</p>
                <p className="text-[11px] text-stone-500">
                  Bipes no aviso prévio e melodia no fim
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={somAtivo}
                onChange={(e) => setSomAtivo(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-800"></div>
            </label>
          </div>

          {/* Vibração */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-emerald-800" />
              <div>
                <p className="text-xs font-bold text-stone-800">Vibração no Celular</p>
                <p className="text-[11px] text-stone-500">
                  Excelente no Poco X5 quando estiver ouvindo música
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={vibrarAtivo}
                onChange={(e) => setVibrarAtivo(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-800"></div>
            </label>
          </div>

          {/* Volume */}
          {somAtivo && (
            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-600 mb-1">
                <span>Volume do Som</span>
                <span>{Math.round(volumeSom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={volumeSom}
                onChange={(e) => setVolumeSom(parseFloat(e.target.value))}
                className="w-full accent-emerald-800"
              />
            </div>
          )}

          {/* Aviso Prévio */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Aviso Prévio (segundos antes do fim)
            </label>
            <select
              value={avisoFaltando}
              onChange={(e) => setAvisoFaltando(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm"
            >
              <option value="0">Sem aviso prévio</option>
              <option value="5">5 segundos antes</option>
              <option value="10">10 segundos antes (recomendado)</option>
              <option value="15">15 segundos antes</option>
            </select>
          </div>

          {/* Descanso Padrão */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Descanso Padrão ao Abrir o App
            </label>
            <select
              value={descansoPadrao}
              onChange={(e) => setDescansoPadrao(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm"
            >
              {[30, 45, 60, 90, 120, 150, 180, 240].map((s) => (
                <option key={s} value={s}>
                  {formatarTempo(s)} ({s} segundos)
                </option>
              ))}
            </select>
          </div>

          {/* Testar */}
          <button
            type="button"
            onClick={testarAlarme}
            className="w-full py-2.5 px-3 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Ouvir e Testar Alarme</span>
          </button>

          {/* Salvar */}
          <button
            type="button"
            onClick={handleSalvar}
            className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};
