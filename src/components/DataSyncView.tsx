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
  Settings,
  Smartphone,
  QrCode
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
  restaurarBackup,
  limparDadosTeste,
  restaurarDadosExemplo
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
import { initAuth, googleSignIn, logout, User } from '../services/firebaseAuth';

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
  onOpenMobileAccess?: () => void;
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
  onReloadAll,
  onOpenMobileAccess
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados locais
  const [altura, setAltura] = useState<number>(config.altura || 1.75);
  const [novoExNome, setNovoExNome] = useState<string>('');
  const [novoExGrupo, setNovoExGrupo] = useState<GrupoMuscular>('Peito');
  const [novoExObs, setNovoExObs] = useState<string>('');
  const [msgSucesso, setMsgSucesso] = useState<string>('');
  const [msgErro, setMsgErro] = useState<string>('');

  // Estados do Google Sheets e Usuário
  const [temToken, setTemToken] = useState<boolean>(false);
  const [usuarioGoogle, setUsuarioGoogle] = useState<User | null>(null);
  const [inputPlanilhaId, setInputPlanilhaId] = useState<string>(config.googleSpreadsheetId || '');
  const [carregandoAuth, setCarregandoAuth] = useState<boolean>(false);
  const [carregandoSync, setCarregandoSync] = useState<boolean>(false);
  const [carregandoCriacao, setCarregandoCriacao] = useState<boolean>(false);
  const [mostrarConfigAvancada, setMostrarConfigAvancada] = useState<boolean>(false);
  const [customClientId, setCustomClientId] = useState<string>(config.googleClientId || '');

  // Detectar usuário e token inicial
  useEffect(() => {
    const token = getStoredAccessToken();
    if (token) setTemToken(true);

    const unsubscribe = initAuth(
      (user, tok) => {
        setUsuarioGoogle(user);
        if (tok) setTemToken(true);
      },
      () => {
        // Apenas limpa se não houver token em cache/sessão
        const curr = getStoredAccessToken();
        if (!curr) {
          setUsuarioGoogle(null);
          setTemToken(false);
        }
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
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
    '214510564913-h3nsieg77e35cn5at65apqhapbvg65uc.apps.googleusercontent.com';

  // Autenticar com o Google via OAuth Oficial
  const handleConectarGoogle = async () => {
    setCarregandoAuth(true);
    try {
      let token: string;
      try {
        const authResult = await googleSignIn();
        setUsuarioGoogle(authResult.user);
        token = authResult.accessToken;
      } catch (authErr: any) {
        if (authErr?.code === 'auth/popup-closed-by-user') {
          return;
        }
        token = await requestGoogleAccessToken(effectiveClientId);
      }

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

  const handleDesconectarGoogle = async () => {
    try {
      await logout();
    } catch {
      // Ignore
    }
    setStoredAccessToken(null);
    setUsuarioGoogle(null);
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

  const handleLimparDadosTeste = () => {
    if (window.confirm('Tem certeza de que deseja apagar todos os dados de treino, séries, pesos e sono de teste? A lista de exercícios cadastrados será preservada.')) {
      limparDadosTeste(true);
      onReloadAll();
      mostrarMensagem('Dados de teste apagados com sucesso! Histórico limpo.');
    }
  };

  const handleLimparTudo = () => {
    if (window.confirm('ATENÇÃO: Deseja apagar TUDO (incluindo todos os exercícios cadastrados)? O app voltará ao estado virgem.')) {
      limparDadosTeste(false);
      onReloadAll();
      mostrarMensagem('Reset de fábrica concluído! Todos os registros foram apagados.');
    }
  };

  const handleRestaurarExemplo = () => {
    if (window.confirm('Deseja recarregar os dados de exemplo pré-definidos para demonstração?')) {
      restaurarDadosExemplo();
      onReloadAll();
      mostrarMensagem('Dados de exemplo recarregados!');
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

      {/* Acessar no Celular (Poco X5 / PWA) */}
      {onOpenMobileAccess && (
        <div className="bg-gradient-to-r from-emerald-900 to-stone-900 dark:from-[#1E3027] dark:to-[#151D18] rounded-3xl p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-800/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base leading-tight">Acessar no Celular (Poco X5)</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PWA Instalável
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1 max-w-lg">
                Abra no Chrome do seu Poco X5 e instale na tela inicial para usar em tela cheia como um app nativo, com vibração do timer e sincronização rápida.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenMobileAccess}
            className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>Ver QR Code &amp; Instruções</span>
          </button>
        </div>
      )}

      {/* Sincronização Direta com Google Sheets */}
      <div className="bg-white dark:bg-[#1A231E] rounded-3xl border border-stone-200 dark:border-[#2D3D34] shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-[#2D3D34]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white leading-tight">
                Sincronização com Google Sheets
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Envie suas séries, cargas e métricas direto para a sua planilha Google
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {temToken ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
                <Check className="w-3.5 h-3.5" /> Google Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 dark:bg-[#26352D] text-stone-600 dark:text-stone-300">
                Desconectado
              </span>
            )}

            <button
              onClick={() => setMostrarConfigAvancada(!mostrarConfigAvancada)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#232E27] transition-colors"
              title="Configurações avançadas do Google"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Configuração Avançada (Client ID) */}
        {mostrarConfigAvancada && (
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#151D18] border border-stone-200 dark:border-[#2D3D34] space-y-2 text-xs">
            <h5 className="font-bold text-stone-800 dark:text-stone-200">Configuração de Credenciais Google (OAuth)</h5>
            <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
              O aplicativo usa o Client ID configurado via Google Workspace OAuth. Caso queira usar um Client ID específico do seu Google Cloud Console, insira abaixo:
            </p>
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customClientId}
                onChange={(e) => setCustomClientId(e.target.value)}
                placeholder="ex: 123456789-xxxxxx.apps.googleusercontent.com"
                className="flex-1 px-3 py-2 border border-stone-300 dark:border-[#2D3D34] rounded-xl bg-white dark:bg-[#1A231E] text-stone-800 dark:text-white text-xs"
              />
              <button
                onClick={handleSalvarClientId}
                className="px-3.5 py-2 rounded-xl bg-stone-800 dark:bg-emerald-700 hover:bg-stone-900 dark:hover:bg-emerald-600 text-white font-semibold cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        {/* Estado da Conexão com Google */}
        {!temToken ? (
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-emerald-950 dark:text-emerald-300 text-sm">Conecte sua Conta Google</p>
              <p className="text-stone-600 dark:text-emerald-400 mt-0.5">
                Conecte via OAuth oficial para criar, ler e atualizar suas planilhas com segurança e sincronização automática.
              </p>
            </div>
            <button
              onClick={handleConectarGoogle}
              disabled={carregandoAuth}
              className="py-2.5 px-4 rounded-xl bg-white dark:bg-[#151D18] hover:bg-stone-50 dark:hover:bg-[#202C24] text-stone-800 dark:text-white font-semibold text-xs border border-stone-300 dark:border-[#2D3D34] shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{carregandoAuth ? 'Conectando...' : 'Entrar com Google'}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-[#151D18] border border-stone-200 dark:border-[#2D3D34] gap-2.5 text-xs">
            <div className="flex items-center gap-3">
              {usuarioGoogle?.photoURL ? (
                <img
                  src={usuarioGoogle.photoURL}
                  alt={usuarioGoogle.displayName || 'Google User'}
                  className="w-9 h-9 rounded-full border border-stone-300 dark:border-[#2D3D34] object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs">
                  {usuarioGoogle?.displayName
                    ? usuarioGoogle.displayName.charAt(0).toUpperCase()
                    : 'G'}
                </div>
              )}
              <div>
                <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                  <span>{usuarioGoogle?.displayName || 'Conta Google Conectada'}</span>
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
                    OAuth Ativo
                  </span>
                </div>
                <div className="text-stone-500 dark:text-stone-400 text-[11px]">
                  {usuarioGoogle?.email || 'Acesso liberado para Google Sheets'}
                </div>
              </div>
            </div>

            <button
              onClick={handleDesconectarGoogle}
              className="self-end sm:self-auto py-1.5 px-3 rounded-xl hover:bg-stone-200 dark:hover:bg-[#202C24] text-stone-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400 font-semibold transition-colors cursor-pointer text-xs"
            >
              Desconectar
            </button>
          </div>
        )}

        {/* Vinculação de Planilha */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
            Planilha Vinculada
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputPlanilhaId}
                onChange={(e) => setInputPlanilhaId(e.target.value)}
                placeholder="Cole a URL completa ou o ID da Planilha do Google"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-[#2D3D34] text-xs bg-white dark:bg-[#151D18] text-stone-800 dark:text-white focus:outline-emerald-800 font-mono"
              />
            </div>
            <button
              onClick={handleVincularPlanilha}
              className="py-2.5 px-4 rounded-xl bg-stone-800 dark:bg-emerald-700 hover:bg-stone-900 dark:hover:bg-emerald-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Vincular Planilha</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-stone-500 dark:text-stone-400">
            <span>Ainda não tem uma planilha formatada?</span>
            <button
              onClick={handleCriarNovaPlanilha}
              disabled={carregandoCriacao}
              className="text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{carregandoCriacao ? 'Criando planilha...' : 'Criar Nova Planilha no Meu Google Drive'}</span>
            </button>
          </div>
        </div>

        {/* Card da Planilha Ativa */}
        {config.googleSpreadsheetId && (
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#151D18] border border-stone-200 dark:border-[#2D3D34] space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Planilha Ativa
                </span>
                <p className="font-bold text-sm text-stone-900 dark:text-white mt-0.5">
                  {config.googleSpreadsheetName || 'Treino & Saúde - Registro Completo'}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-mono mt-0.5">
                  ID: {config.googleSpreadsheetId}
                </p>
              </div>

              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-white dark:bg-[#1A231E] border border-stone-300 dark:border-[#2D3D34] hover:bg-stone-100 dark:hover:bg-[#232E27] text-stone-700 dark:text-stone-200 text-xs font-semibold shadow-2xs transition-colors"
                >
                  <span>Abrir Planilha</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Status do último envio */}
            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-stone-200 dark:border-[#2D3D34] text-xs">
              <span className="text-stone-500 dark:text-stone-400">
                Última sincronização: <strong className="text-stone-700 dark:text-stone-200">{config.googleLastSync || 'Nunca sincronizado'}</strong>
              </span>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.googleAutoSync || false}
                  onChange={(e) => onUpdateConfig({ googleAutoSync: e.target.checked })}
                  className="rounded text-emerald-800 focus:ring-emerald-700 w-3.5 h-3.5"
                />
                <span className="font-semibold text-stone-700 dark:text-stone-300">Auto-enviar séries ao salvar</span>
              </label>
            </div>
          </div>
        )}

        {/* Botão de Enviar / Sincronizar Tudo */}
        <button
          onClick={handleSincronizarAgora}
          disabled={carregandoSync}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#2A4B39] dark:bg-emerald-750 hover:bg-emerald-900 dark:hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${carregandoSync ? 'animate-spin' : ''}`} />
          <span>{carregandoSync ? 'Enviando dados para o Google Sheets...' : 'Sincronizar Tudo Agora (Enviar Todos os Dados)'}</span>
        </button>
      </div>

      {/* Exportação para Arquivos Locais */}
      <div className="bg-white dark:bg-[#1A231E] rounded-3xl border border-stone-200 dark:border-[#2D3D34] shadow-xs p-5 space-y-3">
        <div>
          <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            <span>Exportação de Arquivos Locais (.csv e .json)</span>
          </h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Baixe seus registros a qualquer momento para abrir no Excel ou guardar cópias de segurança.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={handleBaixarCSVSeries}
            className="py-2.5 px-3 rounded-xl border border-stone-300 dark:border-[#2D3D34] hover:bg-stone-50 dark:hover:bg-[#232E27] text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            <span>Séries (.csv)</span>
          </button>

          <button
            onClick={handleBaixarCSVCarga}
            className="py-2.5 px-3 rounded-xl border border-stone-300 dark:border-[#2D3D34] hover:bg-stone-50 dark:hover:bg-[#232E27] text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            <span>Carga &amp; ACWR (.csv)</span>
          </button>

          <button
            onClick={handleBaixarBackup}
            className="py-2.5 px-3 rounded-xl border border-stone-300 dark:border-[#2D3D34] hover:bg-stone-50 dark:hover:bg-[#232E27] text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            <span>Backup Total (.json)</span>
          </button>
        </div>
      </div>

      {/* Restaurar Backup */}
      <div className="bg-white dark:bg-[#1A231E] rounded-3xl border border-stone-200 dark:border-[#2D3D34] shadow-xs p-5">
        <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2 mb-1">
          <Upload className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
          <span>Restaurar Backup</span>
        </h4>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
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
          className="py-2 px-4 rounded-xl bg-stone-100 dark:bg-[#26352D] hover:bg-stone-200 dark:hover:bg-[#304238] text-stone-800 dark:text-stone-200 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Upload className="w-4 h-4 text-stone-600 dark:text-stone-400" />
          <span>Selecionar Arquivo .json</span>
        </button>
      </div>

      {/* Limpeza de Dados de Teste & Reset */}
      <div className="bg-white dark:bg-[#1A231E] rounded-3xl border border-rose-200 dark:border-rose-950/60 shadow-xs p-5 space-y-3">
        <div>
          <h4 className="font-bold text-sm text-rose-900 dark:text-rose-300 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Limpar Dados de Teste &amp; Reset</span>
          </h4>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
            Apague os registros e simulações de teste para iniciar o acompanhamento com seus próprios dados reais.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            onClick={handleLimparDadosTeste}
            className="flex-1 py-2.5 px-3 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Apagar Dados de Teste (Zerar Treino, Peso e Sono)</span>
          </button>

          <button
            onClick={handleLimparTudo}
            className="py-2.5 px-3 rounded-xl border border-stone-300 dark:border-[#2D3D34] hover:bg-stone-50 dark:hover:bg-[#232E27] text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Apaga absolutamente tudo, inclusive a lista de exercícios"
          >
            <span>Reset de Fábrica</span>
          </button>

          <button
            onClick={handleRestaurarExemplo}
            className="py-2.5 px-3 rounded-xl border border-stone-300 dark:border-[#2D3D34] hover:bg-stone-50 dark:hover:bg-[#232E27] text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Restaura os dados de exemplo pré-configurados"
          >
            <RefreshCw className="w-3.5 h-3.5 text-stone-400" />
            <span>Restaurar Exemplo</span>
          </button>
        </div>
      </div>

      {/* Ajustes Pessoais */}
      <div className="bg-white dark:bg-[#1A231E] rounded-3xl border border-stone-200 dark:border-[#2D3D34] shadow-xs p-5">
        <h4 className="font-bold text-sm text-stone-900 dark:text-white mb-2">Ajustes Pessoais</h4>
        <div className="flex items-end gap-3 max-w-xs">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">Sua Altura (m)</label>
            <input
              type="number"
              step="0.01"
              value={altura}
              onChange={(e) => setAltura(parseFloat(e.target.value) || 1.75)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-[#2D3D34] bg-white dark:bg-[#151D18] text-stone-800 dark:text-white text-sm font-semibold"
            />
          </div>
          <button
            onClick={handleSalvarAltura}
            className="py-2.5 px-4 rounded-xl bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white font-semibold text-xs transition-all cursor-pointer"
          >
            Salvar
          </button>
        </div>
      </div>

      {/* Cadastro de Exercícios */}
      <div className="bg-white dark:bg-[#1A231E] rounded-3xl border border-stone-200 dark:border-[#2D3D34] shadow-xs p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            <span>Cadastro de Exercícios</span>
          </h4>
          <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">{exercicios.length} cadastrados</span>
        </div>

        {/* Formulário de novo exercício */}
        <form onSubmit={handleCriarExercicio} className="p-3.5 bg-stone-50 dark:bg-[#151D18] rounded-2xl border border-stone-200 dark:border-[#2D3D34] mb-4 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300">Grupo Muscular</label>
              <select
                value={novoExGrupo}
                onChange={(e) => setNovoExGrupo(e.target.value as GrupoMuscular)}
                className="w-full mt-1 px-2.5 py-2 border border-stone-300 dark:border-[#2D3D34] rounded-xl text-xs bg-white dark:bg-[#1A231E] text-stone-800 dark:text-white"
              >
                {GRUPOS_MUSCULARES.map((g) => (
                  <option key={g} value={g} className="bg-white dark:bg-[#1A231E]">
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300">Nome do Exercício</label>
              <input
                type="text"
                placeholder="Ex: Supino Declinado"
                value={novoExNome}
                onChange={(e) => setNovoExNome(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 border border-stone-300 dark:border-[#2D3D34] rounded-xl text-xs bg-white dark:bg-[#1A231E] text-stone-800 dark:text-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300">Observações (opcional)</label>
            <input
              type="text"
              placeholder="Ex: barra livre, pegada pronada"
              value={novoExObs}
              onChange={(e) => setNovoExObs(e.target.value)}
              className="w-full mt-1 px-2.5 py-2 border border-stone-300 dark:border-[#2D3D34] rounded-xl text-xs bg-white dark:bg-[#1A231E] text-stone-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Exercício</span>
          </button>
        </form>

        {/* Lista de exercícios cadastrados */}
        <div className="divide-y divide-stone-100 dark:divide-[#2D3D34] max-h-60 overflow-y-auto">
          {exercicios.map((ex) => (
            <div key={ex.id} className="py-2.5 px-1.5 flex items-center justify-between text-xs hover:bg-stone-50 dark:hover:bg-[#232E27] rounded-lg">
              <div>
                <p className="font-semibold text-stone-800 dark:text-stone-200">{ex.nome}</p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {ex.grupo} {ex.obs ? `· ${ex.obs}` : ''}
                </p>
              </div>
              <button
                onClick={() => onDeleteExercicio(ex.id)}
                className="p-1 text-stone-300 dark:text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
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
