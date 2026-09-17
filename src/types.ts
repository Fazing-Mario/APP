export type GrupoMuscular =
  | 'Peito'
  | 'Costas'
  | 'Ombro'
  | 'Bíceps'
  | 'Tríceps'
  | 'Perna'
  | 'Glúteo'
  | 'Abdômen'
  | 'Cardio'
  | 'Outro';

export const GRUPOS_MUSCULARES: GrupoMuscular[] = [
  'Peito',
  'Costas',
  'Ombro',
  'Bíceps',
  'Tríceps',
  'Perna',
  'Glúteo',
  'Abdômen',
  'Cardio',
  'Outro'
];

export interface Exercicio {
  id: string;
  nome: string;
  grupo: GrupoMuscular;
  obs?: string;
}

export interface SerieTreino {
  id: string;
  data: string; // YYYY-MM-DD
  exercicio: string;
  grupo: GrupoMuscular;
  serieNum: number;
  carga?: number | null;
  reps?: number | null;
  pse?: number | null; // RPE 0-10
  rir?: number | null; // Repetições em reserva
  vas?: number | null; // Dor 0-10
  obs?: string;
  aquecimento?: boolean;
  criadoEm?: number;
}

export type StatusCarga =
  | 'Aguardando 28 dias'
  | 'Baixa carga'
  | 'Zona ótima'
  | 'Atenção'
  | 'Risco alto';

export interface CargaDiaria {
  data: string;
  seriesTotais: number;
  seriesEfetivas: number;
  volumeTotal: number;
  pseMedio: number | null;
  cargaSessao: number | null;
  // Dias de treino
  agudaDT: number | null;
  cronicaDT: number | null;
  acwrDT: number | null;
  statusDT: StatusCarga;
  // Gabbett/Foster (dias corridos de calendário: 7 e 28)
  agudaGF: number | null;
  cronicaGF: number | null;
  acwrGF: number | null;
  statusGF: StatusCarga;
  tqr?: number | null;
  tqrClasse?: string;
}

export type ZonaHipertrofia = 'Sem dados' | 'Volume baixo' | 'Zona ótima' | 'Volume alto';

export interface VolumeGrupo {
  grupo: GrupoMuscular;
  seriesEfetivas: number;
  volumeKg: number;
  zona: ZonaHipertrofia;
}

export interface RegistroPeso {
  id: string;
  data: string;
  peso: number;
  obs?: string;
}

export interface MedidasCorporais {
  id: string;
  data: string;
  busto?: number | null;
  ombros?: number | null;
  braco?: number | null;
  antebraco?: number | null;
  coxa?: number | null;
  panturrilha?: number | null;
  obs?: string;
}

export interface WearablesSemanal {
  id: string;
  semana: string; // Segunda-feira ISO
  fcRepouso?: number | null;
  qualSono?: number | null; // %
  quantSono?: number | null; // %
  paSis?: number | null;
  paDia?: number | null;
  obs?: string;
}

export interface RegistroPSQI {
  id: string;
  mes: string; // YYYY-MM
  horaDeitar?: string;
  horaAcordar?: string;
  latenciaMin?: number | null;
  horasDormidas?: number | null;
  p5aLatencia?: number | null;
  p5biSoma?: number | null;
  p6Qualidade?: number | null;
  p7Medicacao?: number | null;
  p89Disfuncao?: number | null;
  global?: number | null;
  classificacao?: string;
}

export interface RegistroESS {
  id: string;
  mes: string; // YYYY-MM
  itens: (number | null)[];
  total?: number | null;
  classificacao?: string;
}

export interface RegistroTQR {
  id: string;
  data: string;
  valor: number; // 6 a 20
}

export interface ConfigApp {
  altura: number; // em metros (ex: 1.75)
  descansoPadrao: number; // em segundos (ex: 90)
  somAtivo: boolean;
  vibrarAtivo: boolean;
  volumeSom: number;
  avisoFaltando: number;
  sincronizacaoUrl?: string;
  googleSpreadsheetId?: string;
  googleSpreadsheetName?: string;
  googleAutoSync?: boolean;
  googleLastSync?: string;
  googleClientId?: string;
  temaEscuro?: boolean;
}

export interface MensagemIA {
  id: string;
  remetente: 'user' | 'assistant';
  conteudo: string;
  dataHora: number;
  tipo?: 'geral' | 'adaptacao' | 'prontidao' | 'recuperacao';
}

