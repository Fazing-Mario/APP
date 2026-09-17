import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Plus, Minus, Bell, Sliders } from 'lucide-react';
import {
  destravarAudio,
  tocarAvisoPrevio,
  tocarContagemFinal,
  tocarFimDescanso,
  formatarTempo
} from '../utils/audioTimer';
import { ConfigApp } from '../types';

interface TimerCardProps {
  config: ConfigApp;
  onOpenSettings: () => void;
  externalTrigger?: number; // timestamp to trigger start
}

const PRESETS = [45, 60, 90, 120, 180];

export const TimerCard: React.FC<TimerCardProps> = ({ config, onOpenSettings, externalTrigger }) => {
  const [duracao, setDuracao] = useState<number>(config.descansoPadrao || 90);
  const [restante, setRestante] = useState<number>(config.descansoPadrao || 90);
  const [rodando, setRodando] = useState<boolean>(false);
  const [terminado, setTerminado] = useState<boolean>(false);

  const fimEmRef = useRef<number | null>(null);
  const avisoDadoRef = useRef<boolean>(false);
  const tiquesDadosRef = useRef<Set<number>>(new Set());
  const wakeLockRef = useRef<any>(null);

  // When externalTrigger changes, start timer immediately (e.g. after logging a set)
  useEffect(() => {
    if (externalTrigger && externalTrigger > 0) {
      iniciar(duracao);
    }
  }, [externalTrigger]);

  const pedirWakeLock = async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (e) {
        // Silently continue
      }
    }
  };

  const liberarWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch (e) {
        // Silently continue
      }
      wakeLockRef.current = null;
    }
  };

  const iniciar = (segundos: number) => {
    destravarAudio();
    pedirWakeLock();
    const agora = Date.now();
    fimEmRef.current = agora + segundos * 1000;
    setDuracao(segundos);
    setRestante(segundos);
    setRodando(true);
    setTerminado(false);
    avisoDadoRef.current = false;
    tiquesDadosRef.current = new Set();
  };

  const parar = () => {
    setRodando(false);
    fimEmRef.current = null;
    liberarWakeLock();
    setRestante(duracao);
  };

  const ajustar = (delta: number) => {
    destravarAudio();
    if (rodando && fimEmRef.current) {
      fimEmRef.current += delta * 1000;
      const novoRestante = Math.max(5, Math.ceil((fimEmRef.current - Date.now()) / 1000));
      setRestante(novoRestante);
    } else {
      const novaDur = Math.max(15, duracao + delta);
      setDuracao(novaDur);
      setRestante(novaDur);
    }
  };

  // Main countdown loop
  useEffect(() => {
    if (!rodando) return;

    const interval = setInterval(() => {
      if (!fimEmRef.current) return;
      const msRestantes = fimEmRef.current - Date.now();
      const segs = Math.max(0, Math.ceil(msRestantes / 1000));
      setRestante(segs);

      // Aviso prévio (ex: 10 segundos antes)
      if (
        config.somAtivo &&
        !avisoDadoRef.current &&
        segs <= config.avisoFaltando &&
        segs > 3
      ) {
        avisoDadoRef.current = true;
        tocarAvisoPrevio(config.volumeSom);
      }

      // Contagem 3, 2, 1
      if (config.somAtivo && segs <= 3 && segs > 0 && !tiquesDadosRef.current.has(segs)) {
        tiquesDadosRef.current.add(segs);
        tocarContagemFinal(config.volumeSom);
      }

      // Fim
      if (msRestantes <= 0) {
        clearInterval(interval);
        setRodando(false);
        setRestante(0);
        setTerminado(true);
        liberarWakeLock();
        if (config.somAtivo) {
          tocarFimDescanso(config.volumeSom);
        }
        setTimeout(() => setTerminado(false), 5000);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [rodando, config]);

  const progresso = duracao > 0 ? (restante / duracao) * 100 : 0;
  const emAlerta = rodando && restante <= config.avisoFaltando && restante > 0;

  return (
    <div
      id="timer-card-container"
      className={`relative overflow-hidden rounded-2xl p-5 text-white transition-all duration-300 shadow-md ${
        terminado
          ? 'bg-amber-600'
          : emAlerta
          ? 'bg-rose-800'
          : 'bg-[#2A4B39]'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 opacity-80" />
          <span className="text-xs font-semibold uppercase tracking-wider opacity-85">
            Descanso entre Séries
          </span>
        </div>
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
        >
          <Sliders className="w-3 h-3" />
          <span>Ajustes</span>
        </button>
      </div>

      {/* Mostrador principal */}
      <div className="my-1 text-center font-serif text-6xl tracking-tight font-bold tabular-nums">
        {formatarTempo(restante)}
      </div>

      {/* Barra de progresso */}
      <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden my-3">
        <div
          className="h-full bg-white/90 rounded-full transition-all duration-200"
          style={{ width: `${progresso}%` }}
        />
      </div>

      {/* Controles */}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => ajustar(-15)}
          className="flex-1 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold border border-white/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
          <span>15s</span>
        </button>

        <button
          onClick={() => (rodando ? parar() : iniciar(duracao))}
          className={`flex-[2] py-2.5 rounded-lg text-sm font-bold shadow transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
            rodando
              ? 'bg-rose-500 hover:bg-rose-600 text-white'
              : 'bg-white hover:bg-emerald-50 text-[#1F2A24]'
          }`}
        >
          {rodando ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>Parar</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Iniciar ({formatarTempo(duracao)})</span>
            </>
          )}
        </button>

        <button
          onClick={() => ajustar(15)}
          className="flex-1 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold border border-white/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>15s</span>
        </button>
      </div>

      {/* Presets rápidos */}
      <div className="flex items-center justify-between gap-1.5 mt-3 pt-2 border-t border-white/15">
        {PRESETS.map((s) => (
          <button
            key={s}
            onClick={() => {
              if (rodando) parar();
              setDuracao(s);
              setRestante(s);
            }}
            className={`flex-1 py-1 px-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              duracao === s
                ? 'bg-white text-[#2A4B39] shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-white/90'
            }`}
          >
            {formatarTempo(s)}
          </button>
        ))}
      </div>
    </div>
  );
};
