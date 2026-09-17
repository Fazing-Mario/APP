import React, { useRef, useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Dumbbell,
  CheckCircle2,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  Link as LinkIcon,
  Check,
  AlertCircle,
  Sparkles,
  Settings
} from 'lucide-react';
import {
  Exercicio,
  ConfigApp,
  GrupoMuscular,
  GRUPOS_MUSCULARES,
  SerieTreino,
  RegistroPeso,
  MedidasCorporais,
  WearablesSemanal,
  RegistroPSQI,
  RegistroESS,
  RegistroTQR
} from '../types';
import {
  exportarBackupCompleto,
  gerarCSVSeries,
  gerarCSVCargaDiaria,
  baixarArquivo,
  restaurarBackup
} from '../utils/storage';
import { isoHoje, calcularCargaDiaria } from '../utils/calculations';
import {
  requestGoogleAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
  createSpreadsheet,
  verifySpreadsheetAccess,
  syncAllDataToSheets,
  extractSpreadsheetId
} from '../services/googleSheets';

interface DataSyncViewProps {
  config: ConfigApp;
  exercicios: Exercicio[];
  series: SerieTreino[];
  pesoList: RegistroPeso[];
  medidasList: MedidasCorporais[];
  wearablesList: WearablesSemanal[];
  psqiList: RegistroPSQI[];
  essList: RegistroESS[];
  tqrList: RegistroTQR[];
  onUpdateConfig: (patch: Partial<ConfigApp>) => void;
  onAddExercicio: (e: Omit<Exercicio, 'id'>) => void;
  onDeleteExercicio: (id: string) => void;
  onReloadAll: () => void;
}

export const DataSyncView: React.FC<DataSyncViewProps> = ({
  config,
  exercicios,
  series,
  pesoList,
  medidasList,
  wearablesList,
  psqiList,
  essList,
  tqrList,
  onUpdateConfig,
  onAddExercicio,
  onDeleteExercicio,
  onReloadAll
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados locais
  const [altura, setAltura] = useState<number>(config.altura || 1.75);
  const [novoExNome, setNovoExNome] = useState<string>('');
  const [novoExGrupo, setNovoExGrupo] = useState<GrupoMuscular>('Peito');
  const [novoExObs, setNovoExObs] = useState<string>('');
  const [msgSucesso, setMsgSucesso] = useState<string>('');
  const [msgErro, setMsgErro] = useState<string>('');

  // Estados do Google Sheets
  const [temToken, setTemToken] = useState<boolean>(false);
  const [inputPlanilhaId, setInputPlanilhaId] = useState<string>(config.googleSpreadsheetId || '');
  const [carregandoAuth, setCarregandoAuth] = useState<boolean>(false);
  const [carregandoSync, setCarregandoSync] = useState<boolean>(false);
  const [carregandoCriacao, setCarregandoCriacao] = useState<boolean>(false);
  const [mostrarConfigAvancada, setMostrarConfigAvancada] = useState<boolean>(false);
  const [customClientId, setCustomClientId] = useState<string>(config.googleClientId || '');

  // Detectar token inicial
  useEffect(() => {
    const token = getStoredAccessToken();
    setTemToken(!!token);
  }, []);

  const mostrarMensagem = (msg: string) => {
    setMsgSucesso(msg);
    setMsgErro('');
    setTimeout(() => setMsgSucesso(''), 4000);
  };

  const mostrarErro = (erro: string) => {
    setMsgErro(erro);
    setMsgSucesso('');
    setTimeout(() => setMsgErro(''), 5000);
  };

  const effectiveClientId =
    config.googleClientId ||
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
    '90018411759-client.apps.googleusercontent.com';

  // Autenticar com o Google
  const handleConectarGoogle = async () => {
    setCarregandoAuth(true);
    try {
      const token = await requestGoogleAccessToken(effectiveClientId);
      setTemToken(!!token);
      mostrarMensagem('Conectado à Conta Google com sucesso!');

      // Se já houver ID salvo, tenta validar o acesso
      if (config.googleSpreadsheetId) {
        try {
          const info = await verifySpreadsheetAccess(token, config.googleSpreadsheetId);
          onUpdateConfig({ googleSpreadsheetName: info.title });
        } catch {
          // Ignore
        }
      }
    } catch (err: any) {
      mostrarErro(err?.message || 'Falha ao conectar à Conta Google.');
    } finally {
      setCarregandoAuth(false);
    }
  };

  const handleDesconectarGoogle = () => {
    setStoredAccessToken(null);
    setTemToken(false);
    mostrarMensagem('Desconectado do Google.');
  };

  // Vincular planilha existente informada pelo usuário
  const handleVincularPlanilha = async () => {
    const rawId = extractSpreadsheetId(inputPlanilhaId);
    if (!rawId) {
      mostrarErro('Por favor, informe a URL completa ou o ID da sua planilha Google.');
      return;
    }

    let token = getStoredAccessToken();
    if (!token) {
      try {
        token = await requestGoogleAccessToken(effectiveClientId);
        setTemToken(true);
      } catch (err: any) {
        mostrarErro(err?.message || 'Conecte sua conta Google primeiro.');
        return;
      }
    }

    try {
      const info = await verifySpreadsheetAccess(token, rawId);
      onUpdateConfig({
        googleSpreadsheetId: rawId,
        googleSpreadsheetName: info.title
      });
      setInputPlanilhaId(rawId);
      mostrarMensagem(`Planilha "${info.title}" vinculada com sucesso!`);
    } catch (err: any) {
      mostrarErro(err?.message || 'Não foi possível acessar esta planilha. Verifique as permissões.');
    }
  };

  // Criar uma nova planilha completa no Google Drive do usuário
  const handleCriarNovaPlanilha = async () => {
    let token = getStoredAccessToken();
    if (!token) {
      try {
        token = await requestGoogleAccessToken(effectiveClientId);
        setTemToken(true);
      } catch (err: any) {
        mostrarErro(err?.message || 'Conecte sua conta Google primeiro.');
        return;
      }
    }

    setCarregandoCriacao(true);
    try {
      const nova = await createSpreadsheet(token, 'Treino & Saúde - Registro Completo');
      onUpdateConfig({
        googleSpreadsheetId: nova.id,
        googleSpreadsheetName: nova.title
      });
      setInputPlanilhaId(nova.id);
      mostrarMensagem(`Planilha criada com sucesso! Você já pode sincronizar seus dados.`);
    } catch (err: any) {
      mostrarErro(err?.message || 'Erro ao criar nova planilha no Google Drive.');
    } finally {
      setCarregandoCriacao(false);
    }
  };

  // Sincronizar todos os dados para a planilha vinculada
  const handleSincronizarAgora = async () => {
    const targetId = config.googleSpreadsheetId || extractSpreadsheetId(inputPlanilhaId);
    if (!targetId) {
      mostrarErro('Vincule ou crie uma planilha primeiro antes de sincronizar.');
      return;
    }

    let token = getStoredAccessToken();
    if (!token) {
      try {
        token = await requestGoogleAccessToken(effectiveClientId);
        setTemToken(true);
      } catch (err: any) {
        mostrarErro(err?.message || 'Conecte sua conta Google primeiro.');
        return;
      }
    }

    setCarregandoSync(true);
    try {
      const cargas = calcularCargaDiaria(series, tqrList);
      const res = await syncAllDataToSheets(token, targetId, {
        series,
        cargas,
        pesoList,
        altura: config.altura || 1.75,
        medidasList,
        wearablesList,
        psqiList,
        essList
      });

      const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const hoje = isoHoje();
      const timestamp = `${hoje} às ${agora}`;

      onUpdateConfig({
        googleSpreadsheetId: targetId,
        googleLastSync: timestamp
      });

      mostrarMensagem(`Sincronização concluída! ${res.updatedSheets} abas atualizadas no Google Sheets.`);
    } catch (err: any) {
      mostrarErro(err?.message || 'Falha ao sincronizar dados com a planilha.');
    } finally {
      setCarregandoSync(false);
    }
  };

  const handleSalvarClientId = () => {
    onUpdateConfig({ googleClientId: customClientId.trim() });
    mostrarMensagem('Client ID atualizado.');
    setMostrarConfigAvancada(false);
  };

  // Funções de backup local
  const handleBaixarBackup = () => {
    const json = exportarBackupCompleto();
    baixarArquivo(`treino-backup-${isoHoje()}.json`, json, 'application/json');
    mostrarMensagem('Backup JSON baixado com sucesso!');
  };

  const handleBaixarCSVSeries = () => {
    const csv = gerarCSVSeries();
    baixarArquivo(`treino-series-${isoHoje()}.csv`, csv, 'text/csv');
    mostrarMensagem('CSV de séries gerado!');
  };

  const handleBaixarCSVCarga = () => {
    const csv = gerarCSVCargaDiaria();
    baixarArquivo(`treino-carga-diaria-${isoHoje()}.csv`, csv, 'text/csv');
    mostrarMensagem('CSV de Carga Diária e ACWR gerado!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = restaurarBackup(content, 'substituir');
        if (ok) {
          onReloadAll();
          mostrarMensagem('Backup restaurado com sucesso!');
        } else {
          mostrarErro('Arquivo de backup inválido.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSalvarAltura = () => {
    if (altura > 0.5 && altura < 2.5) {
      onUpdateConfig({ altura });
      mostrarMensagem('Altura atualizada para o cálculo de IMC!');
    }
  };

  const handleCriarExercicio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoExNome.trim()) return;
    onAddExercicio({
      nome: novoExNome.trim(),
      grupo: novoExGrupo,
      obs: novoExObs.trim()
    });
    setNovoExNome('');
    setNovoExObs('');
    mostrarMensagem('Exercício cadastrado!');
  };

  const spreadsheetUrl = config.googleSpreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${config.googleSpreadsheetId}/edit`
    : null;

  return (
    <div className="space-y-4">
      {/* Mensagens de Sucesso e Erro */}
      {msgSucesso && (
        <div className="p-3.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
          <span>{msgSucesso}</span>
        </div>
      )}

      {msgErro && (
        <div className="p-3.5 rounded-xl bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-200" />
          <span>{msgErro}</span>
        </div>
      )}

      {/* Sincronização Direta com Google Sheets */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 leading-tight">
                Sincronização com Google Sheets
              </h3>
              <p className="text-xs text-stone-500">
                Envie suas séries, cargas e métricas direto para a sua planilha Google
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {temToken ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                <Check className="w-3.5 h-3.5" /> Google Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
                Desconectado
              </span>
            )}

            <button
              onClick={() => setMostrarConfigAvancada(!mostrarConfigAvancada)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              title="Configurações avançadas do Google"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Configuração Avançada (Client ID) */}
        {mostrarConfigAvancada && (
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
            <h5 className="font-bold text-stone-800">Configuração de Credenciais Google (OAuth)</h5>
            <p className="text-stone-500 leading-relaxed">
              O aplicativo usa o Client ID configurado via Google Workspace OAuth. Caso queira usar um Client ID específico do seu Google Cloud Console, insira abaixo:
            </p>
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customClientId}
                onChange={(e) => setCustomClientId(e.target.value)}
                placeholder="ex: 123456789-xxxxxx.apps.googleusercontent.com"
                className="flex-1 px-3 py-2 border rounded-xl bg-white text-xs"
              />
              <button
                onClick={handleSalvarClientId}
                className="px-3.5 py-2 rounded-xl bg-stone-800 text-white font-semibold cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        {/* Estado da Conexão com Google */}
        {!temToken ? (
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-emerald-950">Conecte sua Conta Google</p>
              <p className="text-emerald-900 mt-0.5">
                Autorize o acesso para ler e atualizar suas planilhas de treino sem sair do app.
              </p>
            </div>
            <button
              onClick={handleConectarGoogle}
              disabled={carregandoAuth}
              className="py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              {carregandoAuth ? 'Conectando...' : 'Conectar com Google'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
            <span className="text-stone-600">Sua sessão Google está ativa e pronta para sincronizar.</span>
            <button
              onClick={handleDesconectarGoogle}
              className="text-stone-500 hover:text-rose-600 font-medium underline cursor-pointer"
            >
              Desconectar
            </button>
          </div>
        )}

        {/* Vinculação de Planilha */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-800">
            Planilha Vinculada
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputPlanilhaId}
                onChange={(e) => setInputPlanilhaId(e.target.value)}
                placeholder="Cole a URL completa ou o ID da Planilha do Google"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-emerald-800 font-mono"
              />
            </div>
            <button
              onClick={handleVincularPlanilha}
              className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Vincular Planilha</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-stone-500">
            <span>Ainda não tem uma planilha formatada?</span>
            <button
              onClick={handleCriarNovaPlanilha}
              disabled={carregandoCriacao}
              className="text-emerald-800 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{carregandoCriacao ? 'Criando planilha...' : 'Criar Nova Planilha no Meu Google Drive'}</span>
            </button>
          </div>
        </div>

        {/* Card da Planilha Ativa */}
        {config.googleSpreadsheetId && (
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Planilha Ativa
                </span>
                <p className="font-bold text-sm text-stone-900 mt-0.5">
                  {config.googleSpreadsheetName || 'Treino & Saúde - Registro Completo'}
                </p>
                <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                  ID: {config.googleSpreadsheetId}
                </p>
              </div>

              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold shadow-2xs transition-colors"
                >
                  <span>Abrir Planilha</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Status do último envio */}
            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-stone-200 text-xs">
              <span className="text-stone-500">
                Última sincronização: <strong>{config.googleLastSync || 'Nunca sincronizado'}</strong>
              </span>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.googleAutoSync || false}
                  onChange={(e) => onUpdateConfig({ googleAutoSync: e.target.checked })}
                  className="rounded text-emerald-800 focus:ring-emerald-700 w-3.5 h-3.5"
                />
                <span className="font-semibold text-stone-700">Auto-enviar séries ao salvar</span>
              </label>
            </div>
          </div>
        )}

        {/* Botão de Enviar / Sincronizar Tudo */}
        <button
          onClick={handleSincronizarAgora}
          disabled={carregandoSync}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#2A4B39] hover:bg-emerald-900 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${carregandoSync ? 'animate-spin' : ''}`} />
          <span>{carregandoSync ? 'Enviando dados para o Google Sheets...' : 'Sincronizar Tudo Agora (Enviar Todos os Dados)'}</span>
        </button>
      </div>

      {/* Exportação para Arquivos Locais */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs p-5 space-y-3">
        <div>
          <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-800" />
            <span>Exportação de Arquivos Locais (.csv e .json)</span>
          </h4>
          <p className="text-xs text-stone-500 mt-0.5">
            Baixe seus registros a qualquer momento para abrir no Excel ou guardar cópias de segurança.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={handleBaixarCSVSeries}
            className="py-2.5 px-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-800" />
            <span>Séries (.csv)</span>
          </button>

          <button
            onClick={handleBaixarCSVCarga}
            className="py-2.5 px-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-800" />
            <span>Carga &amp; ACWR (.csv)</span>
          </button>

          <button
            onClick={handleBaixarBackup}
            className="py-2.5 px-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-800" />
            <span>Backup Total (.json)</span>
          </button>
        </div>
      </div>

      {/* Restaurar Backup */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs p-5">
        <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2 mb-1">
          <Upload className="w-4 h-4 text-emerald-800" />
          <span>Restaurar Backup</span>
        </h4>
        <p className="text-xs text-stone-500 mb-3">
          Restaure seus dados a partir de um backup <code>.json</code> baixado anteriormente.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="py-2 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Upload className="w-4 h-4 text-stone-600" />
          <span>Selecionar Arquivo .json</span>
        </button>
      </div>

      {/* Ajustes Pessoais */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs p-5">
        <h4 className="font-bold text-sm text-stone-900 mb-2">Ajustes Pessoais</h4>
        <div className="flex items-end gap-3 max-w-xs">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-stone-600 mb-1">Sua Altura (m)</label>
            <input
              type="number"
              step="0.01"
              value={altura}
              onChange={(e) => setAltura(parseFloat(e.target.value) || 1.75)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold"
            />
          </div>
          <button
            onClick={handleSalvarAltura}
            className="py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-all cursor-pointer"
          >
            Salvar
          </button>
        </div>
      </div>

      {/* Cadastro de Exercícios */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-800" />
            <span>Cadastro de Exercícios</span>
          </h4>
          <span className="text-xs text-stone-500 font-semibold">{exercicios.length} cadastrados</span>
        </div>

        {/* Formulário de novo exercício */}
        <form onSubmit={handleCriarExercicio} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 mb-4 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600">Grupo Muscular</label>
              <select
                value={novoExGrupo}
                onChange={(e) => setNovoExGrupo(e.target.value as GrupoMuscular)}
                className="w-full mt-1 px-2.5 py-2 border rounded-xl text-xs bg-white"
              >
                {GRUPOS_MUSCULARES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600">Nome do Exercício</label>
              <input
                type="text"
                placeholder="Ex: Supino Declinado"
                value={novoExNome}
                onChange={(e) => setNovoExNome(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 border rounded-xl text-xs bg-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-stone-600">Observações (opcional)</label>
            <input
              type="text"
              placeholder="Ex: barra livre, pegada pronada"
              value={novoExObs}
              onChange={(e) => setNovoExObs(e.target.value)}
              className="w-full mt-1 px-2.5 py-2 border rounded-xl text-xs bg-white"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Exercício</span>
          </button>
        </form>

        {/* Lista de exercícios cadastrados */}
        <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto">
          {exercicios.map((ex) => (
            <div key={ex.id} className="py-2.5 px-1.5 flex items-center justify-between text-xs hover:bg-stone-50 rounded-lg">
              <div>
                <p className="font-semibold text-stone-800">{ex.nome}</p>
                <p className="text-[11px] text-stone-500">
                  {ex.grupo} {ex.obs ? `· ${ex.obs}` : ''}
                </p>
              </div>
              <button
                onClick={() => onDeleteExercicio(ex.id)}
                className="p-1 text-stone-300 hover:text-rose-600 cursor-pointer"
                title="Remover exercício"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
