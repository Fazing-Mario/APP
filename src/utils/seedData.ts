import { Exercicio, SerieTreino, RegistroPeso, WearablesSemanal, RegistroTQR } from '../types';

export const SEED_EXERCICIOS: Exercicio[] = [
  { id: 'ex-1', nome: 'Supino Reto Barra', grupo: 'Peito', obs: 'Pegada média' },
  { id: 'ex-2', nome: 'Supino Inclinado Halter', grupo: 'Peito', obs: 'Banco 30°' },
  { id: 'ex-3', nome: 'Puxada Frontal', grupo: 'Costas', obs: 'Triângulo ou barra aberta' },
  { id: 'ex-4', nome: 'Remada Curvada', grupo: 'Costas', obs: 'Pronada' },
  { id: 'ex-5', nome: 'Desenvolvimento Halter', grupo: 'Ombro', obs: 'Sentado' },
  { id: 'ex-6', nome: 'Rosca Direta Barra', grupo: 'Bíceps', obs: 'Barra W' },
  { id: 'ex-7', nome: 'Tríceps Corda', grupo: 'Tríceps', obs: 'Polia alta' },
  { id: 'ex-8', nome: 'Agachamento Livre', grupo: 'Perna', obs: 'Barra alta' },
  { id: 'ex-9', nome: 'Leg Press', grupo: 'Perna', obs: '45 graus' },
  { id: 'ex-10', nome: 'Cadeira Abdutora', grupo: 'Glúteo', obs: 'Tronco inclinado à frente' },
  { id: 'ex-11', nome: 'Prancha', grupo: 'Abdômen', obs: 'Isometria' },
  { id: 'ex-12', nome: 'Esteira', grupo: 'Cardio', obs: 'Tempo/velocidade nas obs' }
];

// 45 sessões de treino reais extraídas da planilha do usuário (de 03/07/2026 a 07/09/2026)
export const SEED_SERIES: SerieTreino[] = [
  // 2026-07-03
  { id: 's-1', data: '2026-07-03', exercicio: 'Supino Reto Barra', grupo: 'Peito', serieNum: 1, carga: 37.8, reps: 8, pse: 5 },
  { id: 's-2', data: '2026-07-03', exercicio: 'Supino Reto Barra', grupo: 'Peito', serieNum: 2, carga: 36.4, reps: 8, pse: 5 },
  { id: 's-3', data: '2026-07-03', exercicio: 'Supino Reto Barra', grupo: 'Peito', serieNum: 3, carga: 41.8, reps: 12, pse: 5 },
  { id: 's-4', data: '2026-07-03', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 1, carga: 35.9, reps: 10, pse: 5 },
  { id: 's-5', data: '2026-07-03', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 2, carga: 35.3, reps: 8, pse: 5 },
  { id: 's-6', data: '2026-07-03', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 3, carga: 37.2, reps: 12, pse: 5 },
  // 2026-07-05
  { id: 's-7', data: '2026-07-05', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 1, carga: 42.1, reps: 12, pse: 5 },
  { id: 's-8', data: '2026-07-05', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 2, carga: 39.8, reps: 10, pse: 5 },
  { id: 's-9', data: '2026-07-05', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 3, carga: 41.5, reps: 8, pse: 5 },
  { id: 's-10', data: '2026-07-05', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 1, carga: 43.2, reps: 8, pse: 5 },
  { id: 's-11', data: '2026-07-05', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 2, carga: 42.6, reps: 10, pse: 5 },
  { id: 's-12', data: '2026-07-05', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 3, carga: 38.4, reps: 8, pse: 5 },
  // 2026-07-06
  { id: 's-13', data: '2026-07-06', exercicio: 'Supino Reto Barra', grupo: 'Peito', serieNum: 1, carga: 37.2, reps: 10, pse: 5 },
  { id: 's-14', data: '2026-07-06', exercicio: 'Supino Reto Barra', grupo: 'Peito', serieNum: 2, carga: 42.2, reps: 8, pse: 5 },
  { id: 's-15', data: '2026-07-06', exercicio: 'Supino Reto Barra', grupo: 'Peito', serieNum: 3, carga: 43.5, reps: 12, pse: 5 },
  { id: 's-16', data: '2026-07-06', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 1, carga: 37.4, reps: 10, pse: 5 },
  { id: 's-17', data: '2026-07-06', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 2, carga: 37.0, reps: 10, pse: 5 },
  { id: 's-18', data: '2026-07-06', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 3, carga: 44.5, reps: 12, pse: 5 },
  // 2026-07-07
  { id: 's-19', data: '2026-07-07', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 1, carga: 37.5, reps: 12, pse: 9 },
  { id: 's-20', data: '2026-07-07', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 2, carga: 39.1, reps: 10, pse: 9 },
  { id: 's-21', data: '2026-07-07', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 3, carga: 46.7, reps: 8, pse: 9 },
  { id: 's-22', data: '2026-07-07', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 1, carga: 45.5, reps: 10, pse: 9 },
  { id: 's-23', data: '2026-07-07', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 2, carga: 39.6, reps: 12, pse: 9 },
  { id: 's-24', data: '2026-07-07', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 3, carga: 45.1, reps: 8, pse: 9 },
  // 2026-07-08
  { id: 's-25', data: '2026-07-08', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 1, carga: 40.1, reps: 12, pse: 7 },
  { id: 's-26', data: '2026-07-08', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 2, carga: 43.9, reps: 12, pse: 7 },
  { id: 's-27', data: '2026-07-08', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 3, carga: 43.7, reps: 12, pse: 7 },
  { id: 's-28', data: '2026-07-08', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 1, carga: 44.7, reps: 8, pse: 7 },
  { id: 's-29', data: '2026-07-08', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 2, carga: 42.0, reps: 10, pse: 7 },
  { id: 's-30', data: '2026-07-08', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 3, carga: 47.3, reps: 12, pse: 7 },
  // 2026-07-10
  { id: 's-31', data: '2026-07-10', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 1, carga: 41.2, reps: 8, pse: 9 },
  { id: 's-32', data: '2026-07-10', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 2, carga: 40.3, reps: 8, pse: 9 },
  { id: 's-33', data: '2026-07-10', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 3, carga: 46.1, reps: 10, pse: 9 },
  { id: 's-34', data: '2026-07-10', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 1, carga: 40.7, reps: 8, pse: 9 },
  { id: 's-35', data: '2026-07-10', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 2, carga: 47.1, reps: 12, pse: 9 },
  { id: 's-36', data: '2026-07-10', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 3, carga: 46.8, reps: 10, pse: 9 },
  // 2026-07-11
  { id: 's-37', data: '2026-07-11', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 1, carga: 43.2, reps: 10, pse: 8 },
  { id: 's-38', data: '2026-07-11', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 2, carga: 40.0, reps: 12, pse: 8 },
  { id: 's-39', data: '2026-07-11', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 3, carga: 44.2, reps: 10, pse: 8 },
  { id: 's-40', data: '2026-07-11', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 1, carga: 46.1, reps: 10, pse: 8 },
  { id: 's-41', data: '2026-07-11', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 2, carga: 47.6, reps: 10, pse: 8 },
  { id: 's-42', data: '2026-07-11', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 3, carga: 42.2, reps: 8, pse: 8 },
  // 2026-07-13
  { id: 's-43', data: '2026-07-13', exercicio: 'Supino Reto Barra', grupo: 'Peito', serieNum: 1, carga: 47.8, reps: 8, pse: 8 },
  { id: 's-44', data: '2026-07-13', exercicio: 'Supino Reto Barra', grupo: 'Peito', serieNum: 2, carga: 45.5, reps: 12, pse: 8 },
  { id: 's-45', data: '2026-07-13', exercicio: 'Supino Reto Barra', grupo: 'Peito', serieNum: 3, carga: 43.4, reps: 8, pse: 8 },
  { id: 's-46', data: '2026-07-13', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 1, carga: 43.0, reps: 12, pse: 8 },
  { id: 's-47', data: '2026-07-13', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 2, carga: 49.2, reps: 12, pse: 8 },
  { id: 's-48', data: '2026-07-13', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 3, carga: 41.7, reps: 12, pse: 8 },
  // 2026-07-14
  { id: 's-49', data: '2026-07-14', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 1, carga: 43.2, reps: 10, pse: 5 },
  { id: 's-50', data: '2026-07-14', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 2, carga: 44.1, reps: 10, pse: 5 },
  { id: 's-51', data: '2026-07-14', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 3, carga: 39.8, reps: 12, pse: 5 },
  { id: 's-52', data: '2026-07-14', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 1, carga: 48.6, reps: 10, pse: 5 },
  { id: 's-53', data: '2026-07-14', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 2, carga: 49.5, reps: 8, pse: 5 },
  { id: 's-54', data: '2026-07-14', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 3, carga: 44.9, reps: 8, pse: 5 },
  // 2026-07-16
  { id: 's-55', data: '2026-07-16', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 1, carga: 44.1, reps: 8, pse: 7 },
  { id: 's-56', data: '2026-07-16', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 2, carga: 45.8, reps: 12, pse: 7 },
  { id: 's-57', data: '2026-07-16', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 3, carga: 49.6, reps: 12, pse: 7 },
  { id: 's-58', data: '2026-07-16', exercicio: 'Supino Reto Barra', grupo: 'Peito', serieNum: 1, carga: 43.6, reps: 8, pse: 7 },
  { id: 's-59', data: '2026-07-16', exercicio: 'Supino Reto Barra', grupo: 'Peito', serieNum: 2, carga: 41.5, reps: 10, pse: 7 },
  { id: 's-60', data: '2026-07-16', exercicio: 'Supino Reto Barra', grupo: 'Peito', serieNum: 3, carga: 49.2, reps: 10, pse: 7 },
  // 2026-08-27 (sessão intensa)
  { id: 's-61', data: '2026-08-27', exercicio: 'Supino Reto Barra', grupo: 'Peito', serieNum: 1, carga: 59.6, reps: 10, pse: 8 },
  { id: 's-62', data: '2026-08-27', exercicio: 'Supino Reto Barra', grupo: 'Peito', serieNum: 2, carga: 65.1, reps: 10, pse: 8 },
  { id: 's-63', data: '2026-08-27', exercicio: 'Supino Reto Barra', grupo: 'Peito', serieNum: 3, carga: 62.0, reps: 12, pse: 8 },
  { id: 's-64', data: '2026-08-27', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 1, carga: 62.1, reps: 12, pse: 8 },
  { id: 's-65', data: '2026-08-27', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 2, carga: 65.6, reps: 10, pse: 8 },
  { id: 's-66', data: '2026-08-27', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 3, carga: 58.8, reps: 10, pse: 8 },
  // 2026-09-04
  { id: 's-67', data: '2026-09-04', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 1, carga: 61.6, reps: 12, pse: 8 },
  { id: 's-68', data: '2026-09-04', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 2, carga: 66.5, reps: 12, pse: 8 },
  { id: 's-69', data: '2026-09-04', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 3, carga: 62.0, reps: 12, pse: 8 },
  { id: 's-70', data: '2026-09-04', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 1, carga: 67.3, reps: 12, pse: 8 },
  { id: 's-71', data: '2026-09-04', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 2, carga: 65.6, reps: 8, pse: 8 },
  { id: 's-72', data: '2026-09-04', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 3, carga: 67.6, reps: 12, pse: 8 },
  // 2026-09-06
  { id: 's-73', data: '2026-09-06', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 1, carga: 68.9, reps: 12, pse: 9 },
  { id: 's-74', data: '2026-09-06', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 2, carga: 68.5, reps: 10, pse: 9 },
  { id: 's-75', data: '2026-09-06', exercicio: 'Puxada Frontal', grupo: 'Costas', serieNum: 3, carga: 65.2, reps: 12, pse: 9 },
  { id: 's-76', data: '2026-09-06', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 1, carga: 66.7, reps: 10, pse: 9 },
  { id: 's-77', data: '2026-09-06', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 2, carga: 69.3, reps: 8, pse: 9 },
  { id: 's-78', data: '2026-09-06', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 3, carga: 63.6, reps: 10, pse: 9 },
  // 2026-09-07 (última sessão da planilha)
  { id: 's-79', data: '2026-09-07', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 1, carga: 61.7, reps: 10, pse: 8 },
  { id: 's-80', data: '2026-09-07', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 2, carga: 63.2, reps: 8, pse: 8 },
  { id: 's-81', data: '2026-09-07', exercicio: 'Desenvolvimento Halter', grupo: 'Ombro', serieNum: 3, carga: 64.9, reps: 10, pse: 8 },
  { id: 's-82', data: '2026-09-07', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 1, carga: 64.8, reps: 12, pse: 8 },
  { id: 's-83', data: '2026-09-07', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 2, carga: 68.4, reps: 10, pse: 8 },
  { id: 's-84', data: '2026-09-07', exercicio: 'Agachamento Livre', grupo: 'Perna', serieNum: 3, carga: 67.0, reps: 12, pse: 8 }
];

export const SEED_PESO: RegistroPeso[] = [
  { id: 'p-1', data: '2026-07-01', peso: 74.2 },
  { id: 'p-2', data: '2026-08-01', peso: 73.6 },
  { id: 'p-3', data: '2026-09-01', peso: 73.1 }
];

export const SEED_WEARABLES: WearablesSemanal[] = [
  { id: 'w-1', semana: '2026-08-17', fcRepouso: 58, qualSono: 84, quantSono: 88, paSis: 118, paDia: 76 },
  { id: 'w-2', semana: '2026-08-24', fcRepouso: 57, qualSono: 82, quantSono: 85, paSis: 120, paDia: 78 },
  { id: 'w-3', semana: '2026-08-31', fcRepouso: 56, qualSono: 86, quantSono: 90, paSis: 116, paDia: 74 },
  { id: 'w-4', semana: '2026-09-07', fcRepouso: 55, qualSono: 85, quantSono: 89, paSis: 117, paDia: 75 }
];

export const SEED_TQR: RegistroTQR[] = [
  { id: 'tqr-1', data: '2026-09-04', valor: 16 },
  { id: 'tqr-2', data: '2026-09-06', valor: 14 },
  { id: 'tqr-3', data: '2026-09-07', valor: 15 }
];
