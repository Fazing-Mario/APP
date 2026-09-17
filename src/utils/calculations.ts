import {
  SerieTreino,
  CargaDiaria,
  VolumeGrupo,
  GrupoMuscular,
  GRUPOS_MUSCULARES,
  StatusCarga,
  ZonaHipertrofia,
  RegistroPSQI,
  RegistroESS
} from '../types';

export function isoHoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function diffDias(isoA: string, isoB: string): number {
  return Math.round((parseISO(isoA).getTime() - parseISO(isoB).getTime()) / 86400000);
}

export function segundaDaSemana(iso: string): string {
  const d = parseISO(iso);
  const dow = d.getDay(); // 0 = domingo
  const delta = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fmtBR(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return iso;
}

export function fmtMesAno(iso: string): string {
  if (!iso) return '';
  const d = parseISO(iso.length === 7 ? `${iso}-01` : iso);
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

export function volumeSerie(s: SerieTreino): number {
  if (s.aquecimento) return 0;
  if (s.grupo === 'Cardio') return 0;
  const carga = Number(s.carga) || 0;
  const reps = Number(s.reps) || 0;
  return carga * reps;
}

export function serieEfetiva(s: SerieTreino): boolean {
  return !s.aquecimento;
}

export function statusACWR(acwr: number | null, maduro: boolean): StatusCarga {
  if (acwr === null || acwr === undefined) return 'Aguardando 28 dias';
  if (!maduro) return 'Aguardando 28 dias';
  if (acwr < 0.8) return 'Baixa carga';
  if (acwr <= 1.3) return 'Zona ótima';
  if (acwr <= 1.5) return 'Atenção';
  return 'Risco alto';
}

export function classificaTQR(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return '';
  if (v <= 8) return 'Recuperação muito baixa';
  if (v <= 11) return 'Recuperação baixa';
  if (v <= 14) return 'Recuperação moderada';
  if (v <= 17) return 'Boa recuperação';
  return 'Recuperação total';
}

export function calcularCargaDiaria(
  series: SerieTreino[],
  tqrPorData: Record<string, number> = {}
): CargaDiaria[] {
  if (series.length === 0) return [];

  // Agrupar por data
  const mapa = new Map<string, SerieTreino[]>();
  series.forEach((s) => {
    if (!mapa.has(s.data)) mapa.set(s.data, []);
    mapa.get(s.data)!.push(s);
  });

  const datas = [...mapa.keys()].sort();
  const sessoes = datas.map((data) => {
    const doDia = mapa.get(data)!;
    const efetivas = doDia.filter(serieEfetiva);
    const volumeTotal = doDia.reduce((acc, s) => acc + volumeSerie(s), 0);

    const pses = efetivas
      .map((s) => Number(s.pse))
      .filter((v) => !isNaN(v) && v !== null && v !== undefined && v > 0);
    const pseMedio = pses.length ? pses.reduce((a, b) => a + b, 0) / pses.length : null;
    const cargaSessao = pseMedio === null ? null : volumeTotal * pseMedio;

    return {
      data,
      seriesTotais: doDia.length,
      seriesEfetivas: efetivas.length,
      volumeTotal,
      pseMedio,
      cargaSessao
    };
  });

  const primeiraData = sessoes[0].data;

  return sessoes.map((sess) => {
    const hoje = sess.data;
    const maduro = diffDias(hoje, primeiraData) >= 27;

    // Método 1: Média dos dias treinados
    const janela = (dias: number) =>
      sessoes.filter(
        (s) =>
          diffDias(hoje, s.data) >= 0 &&
          diffDias(hoje, s.data) <= dias - 1 &&
          s.cargaSessao !== null
      );

    const j7 = janela(7);
    const j28 = janela(28);

    const agudaDT = j7.length
      ? j7.reduce((a, s) => a + (s.cargaSessao || 0), 0) / j7.length
      : null;
    const cronicaDT = j28.length
      ? j28.reduce((a, s) => a + (s.cargaSessao || 0), 0) / j28.length
      : null;
    const acwrDT = agudaDT !== null && cronicaDT && cronicaDT > 0 ? agudaDT / cronicaDT : null;

    // Método 2: Gabbett / Foster (dias corridos de calendário: 7 e 28)
    const somaJanela = (dias: number) =>
      sessoes
        .filter(
          (s) =>
            diffDias(hoje, s.data) >= 0 &&
            diffDias(hoje, s.data) <= dias - 1 &&
            s.cargaSessao !== null
        )
        .reduce((a, s) => a + (s.cargaSessao || 0), 0);

    const agudaGF = somaJanela(7) / 7;
    const cronicaGF = somaJanela(28) / 28;
    const acwrGF = maduro && cronicaGF > 0 ? agudaGF / cronicaGF : null;

    const tqr = tqrPorData[hoje] ?? null;

    return {
      data: hoje,
      seriesTotais: sess.seriesTotais,
      seriesEfetivas: sess.seriesEfetivas,
      volumeTotal: sess.volumeTotal,
      pseMedio: sess.pseMedio,
      cargaSessao: sess.cargaSessao,
      agudaDT,
      cronicaDT,
      acwrDT,
      statusDT: statusACWR(acwrDT, maduro),
      agudaGF,
      cronicaGF,
      acwrGF,
      statusGF: statusACWR(acwrGF, maduro),
      tqr,
      tqrClasse: classificaTQR(tqr)
    };
  });
}

export function zonaHipertrofia(seriesEfetivas: number): ZonaHipertrofia {
  if (seriesEfetivas === 0) return 'Sem dados';
  if (seriesEfetivas < 10) return 'Volume baixo';
  if (seriesEfetivas <= 20) return 'Zona ótima';
  return 'Volume alto';
}

export function volumePorGrupo(series: SerieTreino[], semanaISO: string): VolumeGrupo[] {
  const daSemana = series.filter(
    (s) => segundaDaSemana(s.data) === semanaISO && serieEfetiva(s)
  );

  return GRUPOS_MUSCULARES.map((grupo) => {
    const doGrupo = daSemana.filter((s) => s.grupo === grupo);
    const seriesEfetivas = doGrupo.length;
    const volumeKg = doGrupo.reduce((acc, s) => acc + volumeSerie(s), 0);
    return {
      grupo,
      seriesEfetivas,
      volumeKg,
      zona: zonaHipertrofia(seriesEfetivas)
    };
  });
}

export function semanasComTreino(series: SerieTreino[]): string[] {
  const set = new Set(series.map((s) => segundaDaSemana(s.data)));
  return [...set].sort().reverse();
}

export function calcIMC(pesoKg: number, alturaM: number): number | null {
  if (!pesoKg || !alturaM || alturaM <= 0) return null;
  return pesoKg / (alturaM * alturaM);
}

export function classificaIMC(imc: number | null): string {
  if (!imc) return '';
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade grau I';
  if (imc < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

export function classificaPA(sis: number | null | undefined, dia: number | null | undefined): string {
  if (!sis || !dia) return '';
  if (sis >= 180 || dia >= 120) return 'Crise hipertensiva';
  if (sis >= 140 || dia >= 90) return 'Hipertensão estágio 2';
  if (sis >= 130 || dia >= 80) return 'Hipertensão estágio 1';
  if (sis >= 120) return 'Pressão elevada';
  return 'Normal';
}

export function calcPSQI(d: Partial<RegistroPSQI>): {
  global: number | null;
  classificacao: string;
} {
  const num = (v: any) => (v === '' || v === null || v === undefined ? null : Number(v));

  const latencia = num(d.latenciaMin);
  const horas = num(d.horasDormidas);
  const p5a = num(d.p5aLatencia);
  const p5bi = num(d.p5biSoma);
  const p6 = num(d.p6Qualidade);
  const p7 = num(d.p7Medicacao);
  const p89 = num(d.p89Disfuncao);

  // Componente 1: Qualidade subjetiva
  const c1 = p6;

  // Componente 2: Latência
  let c2: number | null = null;
  if (latencia !== null && p5a !== null) {
    const ptsLat = latencia <= 15 ? 0 : latencia <= 30 ? 1 : latencia <= 60 ? 2 : 3;
    const soma = ptsLat + p5a;
    c2 = soma === 0 ? 0 : soma <= 2 ? 1 : soma <= 4 ? 2 : 3;
  }

  // Componente 3: Duração
  let c3: number | null = null;
  if (horas !== null) {
    c3 = horas >= 7 ? 0 : horas >= 6 ? 1 : horas >= 5 ? 2 : 3;
  }

  // Componente 4: Eficiência
  let c4: number | null = null;
  if (horas !== null && d.horaDeitar && d.horaAcordar) {
    const [hd, md] = d.horaDeitar.split(':').map(Number);
    const [ha, ma] = d.horaAcordar.split(':').map(Number);
    let mins = ha * 60 + ma - (hd * 60 + md);
    if (mins <= 0) mins += 24 * 60;
    const horasNaCama = mins / 60;
    if (horasNaCama > 0) {
      const ef = (horas / horasNaCama) * 100;
      c4 = ef >= 85 ? 0 : ef >= 75 ? 1 : ef >= 65 ? 2 : 3;
    }
  }

  // Componente 5: Perturbações (0 a 27 recodificado 0 a 3)
  let c5: number | null = null;
  if (p5bi !== null) {
    c5 = p5bi === 0 ? 0 : p5bi <= 9 ? 1 : p5bi <= 18 ? 2 : 3;
  }

  // Componente 6: Medicação
  const c6 = p7;

  // Componente 7: Disfunção diurna
  let c7: number | null = null;
  if (p89 !== null) {
    c7 = p89 === 0 ? 0 : p89 <= 2 ? 1 : p89 <= 4 ? 2 : 3;
  }

  const comps = [c1, c2, c3, c4, c5, c6, c7];
  if (comps.some((c) => c === null)) {
    return { global: null, classificacao: 'Incompleto' };
  }

  const global = comps.reduce((acc: number, c) => acc + (c as number), 0);
  return {
    global,
    classificacao: global > 5 ? 'Qualidade de sono ruim' : 'Boa qualidade de sono'
  };
}

export function calcESS(itens: (number | null | string)[]): {
  total: number | null;
  classificacao: string;
} {
  const vals = itens.map((v) => (v === '' || v === null || v === undefined ? null : Number(v)));
  if (vals.some((v) => v === null)) {
    return { total: null, classificacao: 'Incompleto' };
  }
  const total = vals.reduce((a: number, b) => a + (b as number), 0);
  return {
    total,
    classificacao: total > 10 ? 'Sonolência diurna excessiva' : 'Sonolência diurna normal'
  };
}

export function descritiva(valores: (number | null | undefined)[]): {
  n: number;
  media: number;
  dp: number;
  min: number;
  max: number;
} | null {
  const v = valores.filter((x): x is number => typeof x === 'number' && !isNaN(x));
  if (v.length === 0) return null;
  const media = v.reduce((a, b) => a + b, 0) / v.length;
  const variancia =
    v.length > 1 ? v.reduce((a, b) => a + (b - media) ** 2, 0) / (v.length - 1) : 0;
  return {
    n: v.length,
    media,
    dp: Math.sqrt(variancia),
    min: Math.min(...v),
    max: Math.max(...v)
  };
}

export function correlacao(
  paresX: (number | null | undefined)[],
  paresY: (number | null | undefined)[]
): { r: number | null; n: number; forca: string } {
  const pares: [number, number][] = [];
  for (let i = 0; i < Math.min(paresX.length, paresY.length); i++) {
    const x = paresX[i];
    const y = paresY[i];
    if (typeof x === 'number' && !isNaN(x) && typeof y === 'number' && !isNaN(y)) {
      pares.push([x, y]);
    }
  }
  if (pares.length < 3) return { r: null, n: pares.length, forca: 'Dados insuficientes' };

  const n = pares.length;
  const mx = pares.reduce((a, p) => a + p[0], 0) / n;
  const my = pares.reduce((a, p) => a + p[1], 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;

  pares.forEach(([x, y]) => {
    num += (x - mx) * (y - my);
    dx += (x - mx) ** 2;
    dy += (y - my) ** 2;
  });

  const den = Math.sqrt(dx * dy);
  if (den === 0) return { r: null, n, forca: 'Sem variação' };

  const r = num / den;
  const a = Math.abs(r);
  const dir = r >= 0 ? 'positiva' : 'negativa';
  let forca = 'Desprezível';
  if (a >= 0.7) forca = `Muito forte ${dir}`;
  else if (a >= 0.5) forca = `Forte ${dir}`;
  else if (a >= 0.3) forca = `Moderada ${dir}`;
  else if (a >= 0.1) forca = `Fraca ${dir}`;

  return { r, n, forca };
}

export function progressaoExercicio(
  series: SerieTreino[],
  nomeExercicio: string
): { data: string; carga: number }[] {
  const doExercicio = series.filter(
    (s) => s.exercicio === nomeExercicio && serieEfetiva(s) && (s.carga ?? 0) > 0
  );
  const porData = new Map<string, number>();
  doExercicio.forEach((s) => {
    const carga = Number(s.carga) || 0;
    if (!porData.has(s.data) || carga > porData.get(s.data)!) {
      porData.set(s.data, carga);
    }
  });

  return [...porData.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([data, carga]) => ({ data, carga }));
}

export function recordes(series: SerieTreino[]): {
  exercicio: string;
  grupo: GrupoMuscular;
  carga: number;
  reps: number | null;
  data: string;
}[] {
  const mapa = new Map<
    string,
    { exercicio: string; grupo: GrupoMuscular; carga: number; reps: number | null; data: string }
  >();

  series.filter(serieEfetiva).forEach((s) => {
    const carga = Number(s.carga) || 0;
    const atual = mapa.get(s.exercicio);
    if (!atual || carga > atual.carga) {
      mapa.set(s.exercicio, {
        exercicio: s.exercicio,
        grupo: s.grupo,
        carga,
        reps: s.reps ?? null,
        data: s.data
      });
    }
  });

  return [...mapa.values()].sort((a, b) => b.carga - a.carga);
}
