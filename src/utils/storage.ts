import {
  Exercicio,
  SerieTreino,
  RegistroPeso,
  MedidasCorporais,
  WearablesSemanal,
  RegistroPSQI,
  RegistroESS,
  RegistroTQR,
  ConfigApp
} from '../types';
import { SEED_EXERCICIOS, SEED_SERIES, SEED_PESO, SEED_WEARABLES, SEED_TQR } from './seedData';
import { volumeSerie, calcularCargaDiaria } from './calculations';

const PREFIX = 'treino_saude_';

export const CONFIG_PADRAO: ConfigApp = {
  altura: 1.75,
  descansoPadrao: 90,
  somAtivo: true,
  vibrarAtivo: true,
  volumeSom: 0.6,
  avisoFaltando: 10
};

export function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn(`Erro ao ler localStorage (${key}):`, e);
    return defaultValue;
  }
}

export function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Erro ao gravar localStorage (${key}):`, e);
  }
}

export function inicializarStorage() {
  const ex = getLocal<Exercicio[]>('exercicios', []);
  if (ex.length === 0) {
    setLocal('exercicios', SEED_EXERCICIOS);
  }

  const series = getLocal<SerieTreino[]>('series', []);
  if (series.length === 0) {
    setLocal('series', SEED_SERIES);
  }

  const peso = getLocal<RegistroPeso[]>('peso', []);
  if (peso.length === 0) {
    setLocal('peso', SEED_PESO);
  }

  const wearables = getLocal<WearablesSemanal[]>('wearables', []);
  if (wearables.length === 0) {
    setLocal('wearables', SEED_WEARABLES);
  }

  const tqr = getLocal<RegistroTQR[]>('tqr', []);
  if (tqr.length === 0) {
    setLocal('tqr', SEED_TQR);
  }

  const cfg = getLocal<ConfigApp>('config', CONFIG_PADRAO);
  if (!cfg.descansoPadrao) {
    setLocal('config', CONFIG_PADRAO);
  }
}

export function exportarBackupCompleto(): string {
  const data = {
    app: 'Treino & Saúde',
    versao: '2.0.0',
    exportadoEm: new Date().toISOString(),
    dados: {
      exercicios: getLocal<Exercicio[]>('exercicios', []),
      series: getLocal<SerieTreino[]>('series', []),
      peso: getLocal<RegistroPeso[]>('peso', []),
      medidas: getLocal<MedidasCorporais[]>('medidas', []),
      wearables: getLocal<WearablesSemanal[]>('wearables', []),
      psqi: getLocal<RegistroPSQI[]>('psqi', []),
      ess: getLocal<RegistroESS[]>('ess', []),
      tqr: getLocal<RegistroTQR[]>('tqr', []),
      config: getLocal<ConfigApp>('config', CONFIG_PADRAO)
    }
  };
  return JSON.stringify(data, null, 2);
}

export function baixarArquivo(nome: string, conteudo: string, mimeType = 'application/json'): void {
  const blob = new Blob([conteudo], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscapar(v: any): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[";\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function paraCSV(linhas: (string | number)[][], cabecalho: string[]): string {
  const sep = ';'; // Padrão Brasil / Excel PT-BR
  const out = [cabecalho.join(sep)];
  linhas.forEach((l) => out.push(l.map(csvEscapar).join(sep)));
  return '\uFEFF' + out.join('\r\n'); // BOM para acentuação perfeita no Excel
}

export function gerarCSVSeries(): string {
  const series = getLocal<SerieTreino[]>('series', []);
  const ordenadas = [...series].sort((a, b) =>
    (a.data + String(a.serieNum).padStart(3, '0')).localeCompare(
      b.data + String(b.serieNum).padStart(3, '0')
    )
  );

  const linhas = ordenadas.map((s) => [
    s.data,
    s.exercicio,
    s.grupo,
    s.serieNum,
    s.carga ?? '',
    s.reps ?? '',
    volumeSerie(s),
    s.pse ?? '',
    s.rir ?? '',
    s.vas ?? '',
    (s.aquecimento ? '[AQ] ' : '') + (s.obs || '')
  ]);

  return paraCSV(linhas, [
    'Data',
    'Exercício',
    'Grupo Muscular',
    'Série nº',
    'Carga (kg)',
    'Repetições',
    'Volume da série (kg)',
    'PSE/RPE (0-10)',
    'RIR',
    'VAS Dor (0-10)',
    'Observações'
  ]);
}

export function gerarCSVCargaDiaria(): string {
  const series = getLocal<SerieTreino[]>('series', []);
  const tqrs = getLocal<RegistroTQR[]>('tqr', []);
  const tqrMapa: Record<string, number> = {};
  tqrs.forEach((t) => {
    tqrMapa[t.data] = t.valor;
  });

  const dias = calcularCargaDiaria(series, tqrMapa);
  const arred = (v: any, casas: number) =>
    v === null || v === undefined || isNaN(v) ? '' : Number(v).toFixed(casas).replace('.', ',');

  const linhas = dias.map((d) => [
    d.data,
    arred(d.volumeTotal, 1),
    arred(d.pseMedio, 2),
    arred(d.cargaSessao, 1),
    arred(d.agudaDT, 1),
    arred(d.cronicaDT, 1),
    arred(d.acwrDT, 3),
    d.statusDT,
    d.tqr ?? '',
    d.tqrClasse || '',
    arred(d.agudaGF, 1),
    arred(d.cronicaGF, 1),
    arred(d.acwrGF, 3),
    d.statusGF
  ]);

  return paraCSV(linhas, [
    'Data',
    'Volume Total (kg)',
    'PSE Médio',
    'Carga da Sessão',
    'Carga Aguda (média 7 dias)',
    'Carga Crônica (média 28 dias)',
    'ACWR (dias de treino)',
    'Status ACWR DT',
    'TQR (6-20)',
    'Classificação TQR',
    'Carga Aguda GF',
    'Carga Crônica GF',
    'ACWR Gabbett/Foster',
    'Status GF'
  ]);
}

export function restaurarBackup(jsonString: string, modo: 'substituir' | 'mesclar' = 'substituir'): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.dados) return false;

    const keys = ['exercicios', 'series', 'peso', 'medidas', 'wearables', 'psqi', 'ess', 'tqr', 'config'];

    keys.forEach((k) => {
      const novos = parsed.dados[k];
      if (Array.isArray(novos)) {
        if (modo === 'substituir') {
          setLocal(k, novos);
        } else {
          const existentes = getLocal<any[]>(k, []);
          const ids = new Set(existentes.map((item) => item.id));
          const paraInserir = novos.filter((item) => !ids.has(item.id));
          setLocal(k, [...existentes, ...paraInserir]);
        }
      } else if (k === 'config' && novos) {
        setLocal(k, novos);
      }
    });

    return true;
  } catch (e) {
    console.error('Erro ao restaurar backup:', e);
    return false;
  }
}
