import { SerieTreino, CargaDiaria, RegistroPeso, MedidasCorporais, RegistroPSQI, RegistroESS, WearablesSemanal } from '../types';
import { calcIMC } from '../utils/calculations';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

const STORAGE_KEY_TOKEN = 'ts_google_access_token';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Regex para capturar ID de URL do Google Sheets: /d/([a-zA-Z0-9-_]+)
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export function getStoredAccessToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
}

export function setStoredAccessToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
    } else {
      sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  } catch {
    // Ignore storage issues
  }
}

export function requestGoogleAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('A biblioteca Google Identity Services ainda está carregando. Tente novamente em alguns segundos.'));
      return;
    }

    if (!clientId) {
      reject(new Error('Google Client ID não configurado.'));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            setStoredAccessToken(response.access_token);
            resolve(response.access_token);
          } else {
            reject(new Error('Nenhum token de acesso foi retornado pelo Google.'));
          }
        },
        error_callback: (err) => {
          reject(new Error(err?.message || 'Erro ao autenticar com a Conta Google.'));
        }
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

// Cria uma nova planilha estruturada no Google Drive do usuário
export async function createSpreadsheet(
  token: string,
  title = 'Treino & Saúde - Registro Completo'
): Promise<{ id: string; url: string; title: string }> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title
      },
      sheets: [
        {
          properties: {
            title: 'Registro de Treino',
            gridProperties: { frozenRowCount: 1 }
          }
        },
        {
          properties: {
            title: 'Carga Diária & ACWR',
            gridProperties: { frozenRowCount: 1 }
          }
        },
        {
          properties: {
            title: 'Peso Corporal',
            gridProperties: { frozenRowCount: 1 }
          }
        },
        {
          properties: {
            title: 'Medidas Corporais',
            gridProperties: { frozenRowCount: 1 }
          }
        },
        {
          properties: {
            title: 'Wearables & Sono',
            gridProperties: { frozenRowCount: 1 }
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Falha ao criar planilha: HTTP ${response.status}`);
  }

  const data = await response.json();
  const id = data.spreadsheetId;
  const url = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${id}/edit`;
  return { id, url, title: data.properties?.title || title };
}

// Verifica se a planilha é válida e existe
export async function verifySpreadsheetAccess(
  token: string,
  spreadsheetId: string
): Promise<{ title: string; sheets: string[] }> {
  const id = extractSpreadsheetId(spreadsheetId);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}?fields=properties.title,sheets.properties.title`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      setStoredAccessToken(null);
      throw new Error('Sessão expirada. Conecte sua Conta Google novamente.');
    }
    if (response.status === 404) {
      throw new Error('Planilha não encontrada. Verifique o ID ou Link fornecido.');
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Erro ao acessar planilha: HTTP ${response.status}`);
  }

  const data = await response.json();
  const title = data.properties?.title || 'Planilha Sem Título';
  const sheets = (data.sheets || []).map((s: any) => s.properties?.title as string);
  return { title, sheets };
}

export interface SyncPayload {
  series: SerieTreino[];
  cargas: CargaDiaria[];
  pesoList: RegistroPeso[];
  altura: number;
  medidasList: MedidasCorporais[];
  wearablesList: WearablesSemanal[];
  psqiList: RegistroPSQI[];
  essList: RegistroESS[];
}

// Envia e atualiza todos os dados na planilha de forma estruturada via batchUpdate
export async function syncAllDataToSheets(
  token: string,
  spreadsheetId: string,
  payload: SyncPayload
): Promise<{ updatedSheets: number }> {
  const id = extractSpreadsheetId(spreadsheetId);

  // 1. Garantir que as abas existem na planilha
  const verifyRes = await verifySpreadsheetAccess(token, id);
  const abasExistentes = verifyRes.sheets;

  const abasDesejadas = [
    'Registro de Treino',
    'Carga Diária & ACWR',
    'Peso Corporal',
    'Medidas Corporais',
    'Wearables & Sono'
  ];

  const abasParaCriar = abasDesejadas.filter((a) => !abasExistentes.includes(a));
  if (abasParaCriar.length > 0) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: abasParaCriar.map((title) => ({
          addSheet: {
            properties: {
              title,
              gridProperties: { frozenRowCount: 1 }
            }
          }
        }))
      })
    });
  }

  // 2. Montar matriz de linhas para 'Registro de Treino'
  const cabecalhoSeries = [
    'Data',
    'Exercício',
    'Grupo Muscular',
    'Série',
    'Carga (kg)',
    'Reps',
    'RPE / PSE',
    'RIR',
    'VAS Dor',
    'Aquecimento?',
    'Observações'
  ];

  const linhasSeries = payload.series.map((s) => [
    s.data,
    s.exercicio,
    s.grupo,
    s.serieNum,
    s.carga ?? '',
    s.reps ?? '',
    s.pse ?? '',
    s.rir ?? '',
    s.vas ?? '',
    s.aquecimento ? 'SIM' : 'NÃO',
    s.obs ?? ''
  ]);

  // 3. Montar matriz de linhas para 'Carga Diária & ACWR'
  const cabecalhoCarga = [
    'Data',
    'Séries Totais',
    'Séries Efetivas',
    'Volume (kg)',
    'PSE Médio',
    'Carga Sessão (Foster)',
    'Aguda 7d (DT)',
    'Crônica 28d (DT)',
    'ACWR (DT)',
    'Status (DT)',
    'Aguda 7d (Gabbett)',
    'Crônica 28d (Gabbett)',
    'ACWR (Gabbett)',
    'Status (Gabbett)',
    'TQR'
  ];

  const linhasCarga = payload.cargas.map((c) => [
    c.data,
    c.seriesTotais,
    c.seriesEfetivas,
    c.volumeTotal,
    c.pseMedio ?? '',
    c.cargaSessao ?? '',
    c.agudaDT ?? '',
    c.cronicaDT ?? '',
    c.acwrDT ?? '',
    c.statusDT ?? '',
    c.agudaGF ?? '',
    c.cronicaGF ?? '',
    c.acwrGF ?? '',
    c.statusGF ?? '',
    c.tqr ?? ''
  ]);

  // 4. Montar matriz de linhas para 'Peso Corporal'
  const cabecalhoPeso = ['Data', 'Peso (kg)', 'Altura (m)', 'IMC', 'Observações'];
  const linhasPeso = payload.pesoList.map((p) => {
    const imc = calcIMC(p.peso, payload.altura);
    return [p.data, p.peso, payload.altura, imc ?? '', p.obs ?? ''];
  });

  // 5. Montar matriz de linhas para 'Medidas Corporais'
  const cabecalhoMedidas = [
    'Data',
    'Busto (cm)',
    'Ombros (cm)',
    'Braço (cm)',
    'Antebraço (cm)',
    'Coxa (cm)',
    'Panturrilha (cm)',
    'Observações'
  ];
  const linhasMedidas = payload.medidasList.map((m) => [
    m.data,
    m.busto ?? '',
    m.ombros ?? '',
    m.braco ?? '',
    m.antebraco ?? '',
    m.coxa ?? '',
    m.panturrilha ?? '',
    m.obs ?? ''
  ]);

  // 6. Montar matriz de linhas para 'Wearables & Sono'
  const cabecalhoWearables = [
    'Registro / Data',
    'Tipo',
    'Métrica Principal',
    'Detalhe 1',
    'Detalhe 2',
    'Classificação / Obs'
  ];
  const linhasWearables: any[][] = [];

  payload.wearablesList.forEach((w) => {
    linhasWearables.push([
      w.semana,
      'Wearable Semanal',
      `FC Repouso: ${w.fcRepouso ?? '–'} bpm`,
      `Sono: ${w.quantSono ?? '–'}% quant / ${w.qualSono ?? '–'}% qual`,
      `PA: ${w.paSis ?? '–'}/${w.paDia ?? '–'} mmHg`,
      w.obs ?? ''
    ]);
  });

  payload.psqiList.forEach((p) => {
    linhasWearables.push([
      p.mes,
      'PSQI (Qualidade de Sono)',
      `Score Global: ${p.global ?? '–'}/21`,
      `Horas dormidas: ${p.horasDormidas ?? '–'}h`,
      `Latência: ${p.latenciaMin ?? '–'} min`,
      p.classificacao ?? ''
    ]);
  });

  payload.essList.forEach((e) => {
    linhasWearables.push([
      e.mes,
      'Epworth (Sonolência Diurna)',
      `Score Total: ${e.total ?? '–'}/24`,
      '',
      '',
      e.classificacao ?? ''
    ]);
  });

  // 7. Disparar batchUpdate com USER_ENTERED
  const updateData = [
    {
      range: "'Registro de Treino'!A1:K",
      values: [cabecalhoSeries, ...linhasSeries]
    },
    {
      range: "'Carga Diária & ACWR'!A1:O",
      values: [cabecalhoCarga, ...linhasCarga]
    },
    {
      range: "'Peso Corporal'!A1:E",
      values: [cabecalhoPeso, ...linhasPeso]
    },
    {
      range: "'Medidas Corporais'!A1:H",
      values: [cabecalhoMedidas, ...linhasMedidas]
    },
    {
      range: "'Wearables & Sono'!A1:F",
      values: [cabecalhoWearables, ...linhasWearables]
    }
  ];

  // Limpar dados anteriores e gravar atualizados para manter total consistência
  const clearPromises = updateData.map((d) => {
    const sheetName = d.range.split('!')[0];
    return fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${sheetName}!A1:Z1000:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  });
  await Promise.all(clearPromises);

  const batchResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: updateData
      })
    }
  );

  if (!batchResponse.ok) {
    const errorBody = await batchResponse.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Erro ao salvar na planilha: HTTP ${batchResponse.status}`);
  }

  return { updatedSheets: updateData.length };
}

// Insere uma única série diretamente ao final da aba 'Registro de Treino'
export async function appendSingleSeries(
  token: string,
  spreadsheetId: string,
  serie: SerieTreino
): Promise<boolean> {
  const id = extractSpreadsheetId(spreadsheetId);
  const row = [
    serie.data,
    serie.exercicio,
    serie.grupo,
    serie.serieNum,
    serie.carga ?? '',
    serie.reps ?? '',
    serie.pse ?? '',
    serie.rir ?? '',
    serie.vas ?? '',
    serie.aquecimento ? 'SIM' : 'NÃO',
    serie.obs ?? ''
  ];

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/'Registro de Treino'!A:K:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [row]
        })
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
