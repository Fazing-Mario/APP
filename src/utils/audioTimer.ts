let audioCtx: AudioContext | null = null;

export function garantirAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function destravarAudio(): void {
  const ctx = garantirAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0;
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.01);
  } catch (e) {
    // Ignore unlock errors
  }
}

interface BipeOptions {
  freq?: number;
  duracao?: number;
  volume?: number;
  tipo?: OscillatorType;
  atraso?: number;
}

export function tocarBipe({
  freq = 880,
  duracao = 0.18,
  volume = 0.5,
  tipo = 'sine',
  atraso = 0
}: BipeOptions = {}): void {
  const ctx = garantirAudio();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime + atraso;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t0);

    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.015);
    gain.gain.setValueAtTime(volume, t0 + duracao - 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracao);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duracao + 0.02);
  } catch (e) {
    // Silently fall through if browser blocks audio
  }
}

export function vibrar(padrao: number | number[]): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(padrao);
    } catch (e) {
      // Ignore
    }
  }
}

export function tocarAvisoPrevio(volume = 0.5): void {
  tocarBipe({ freq: 660, duracao: 0.12, volume: volume * 0.7, atraso: 0 });
  tocarBipe({ freq: 660, duracao: 0.12, volume: volume * 0.7, atraso: 0.22 });
  vibrar(120);
}

export function tocarContagemFinal(volume = 0.5): void {
  tocarBipe({ freq: 520, duracao: 0.08, volume: volume * 0.5, tipo: 'triangle' });
  vibrar(60);
}

export function tocarFimDescanso(volume = 0.5): void {
  tocarBipe({ freq: 784, duracao: 0.16, volume, atraso: 0 });
  tocarBipe({ freq: 988, duracao: 0.16, volume, atraso: 0.2 });
  tocarBipe({ freq: 1319, duracao: 0.4, volume, atraso: 0.4 });
  vibrar([200, 100, 200, 100, 400]);
}

export function formatarTempo(segundos: number): string {
  const m = Math.floor(Math.max(0, segundos) / 60);
  const s = Math.floor(Math.max(0, segundos) % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
