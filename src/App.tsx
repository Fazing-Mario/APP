import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  TrendingUp,
  Scale,
  Moon,
  Database,
  Plus,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
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
} from './types';
import {
  getLocal,
  setLocal,
  inicializarStorage,
  CONFIG_PADRAO
} from './utils/storage';
import { TimerCard } from './components/TimerCard';
import { WorkoutView } from './components/WorkoutView';
import { AnalysisView } from './components/AnalysisView';
import { BodyView } from './components/BodyView';
import { SleepView } from './components/SleepView';
import { DataSyncView } from './components/DataSyncView';
import { NewSeriesModal } from './components/NewSeriesModal';
import { TqrModal } from './components/TqrModal';
import { TimerSettingsModal } from './components/TimerSettingsModal';
import { getStoredAccessToken, appendSingleSeries } from './services/googleSheets';

export default function App() {
  const [tab, setTab] = useState<'treino' | 'analise' | 'corpo' | 'sono' | 'dados'>('treino');

  // Estado dos dados
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [series, setSeries] = useState<SerieTreino[]>([]);
  const [pesoList, setPesoList] = useState<RegistroPeso[]>([]);
  const [medidasList, setMedidasList] = useState<MedidasCorporais[]>([]);
  const [wearablesList, setWearablesList] = useState<WearablesSemanal[]>([]);
  const [psqiList, setPsqiList] = useState<RegistroPSQI[]>([]);
  const [essList, setEssList] = useState<RegistroESS[]>([]);
  const [tqrList, setTqrList] = useState<RegistroTQR[]>([]);
  const [config, setConfig] = useState<ConfigApp>(CONFIG_PADRAO);

  // Modais
  const [modalSerieAberta, setModalSerieAberta] = useState<boolean>(false);
  const [modalTqrAberta, setModalTqrAberta] = useState<boolean>(false);
  const [modalTimerAberta, setModalTimerAberta] = useState<boolean>(false);

  // Trigger para iniciar o timer automaticamente ao salvar série
  const [timerTrigger, setTimerTrigger] = useState<number>(0);

  // Carregar dados na inicialização
  const recarregarTodosDados = () => {
    inicializarStorage();
    setExercicios(getLocal<Exercicio[]>('exercicios', []));
    setSeries(getLocal<SerieTreino[]>('series', []));
    setPesoList(getLocal<RegistroPeso[]>('peso', []));
    setMedidasList(getLocal<MedidasCorporais[]>('medidas', []));
    setWearablesList(getLocal<WearablesSemanal[]>('wearables', []));
    setPsqiList(getLocal<RegistroPSQI[]>('psqi', []));
    setEssList(getLocal<RegistroESS[]>('ess', []));
    setTqrList(getLocal<RegistroTQR[]>('tqr', []));
    setConfig(getLocal<ConfigApp>('config', CONFIG_PADRAO));
  };

  useEffect(() => {
    recarregarTodosDados();
  }, []);

  // Handlers para Séries
  const handleSalvarSerie = (novaSerie: Omit<SerieTreino, 'id'>, iniciarTimer: boolean) => {
    const item: SerieTreino = {
      ...novaSerie,
      id: 's-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
    };
    const atualizadas = [...series, item];
    setSeries(atualizadas);
    setLocal('series', atualizadas);

    if (iniciarTimer) {
      setTimerTrigger(Date.now());
    }

    // Auto-envio para Google Sheets se habilitado
    if (config.googleAutoSync && config.googleSpreadsheetId) {
      const token = getStoredAccessToken();
      if (token) {
        appendSingleSeries(token, config.googleSpreadsheetId, item).catch(() => {});
      }
    }
  };

  const handleExcluirSerie = (id: string) => {
    const atualizadas = series.filter((s) => s.id !== id);
    setSeries(atualizadas);
    setLocal('series', atualizadas);
  };

  // Handlers para TQR
  const handleSalvarTqr = (data: string, valor: number) => {
    const existenteIndex = tqrList.findIndex((t) => t.data === data);
    let atualizadas: RegistroTQR[];
    if (existenteIndex >= 0) {
      atualizadas = [...tqrList];
      atualizadas[existenteIndex] = { ...atualizadas[existenteIndex], valor };
    } else {
      atualizadas = [
        ...tqrList,
        { id: 'tqr-' + Date.now(), data, valor }
      ];
    }
    setTqrList(atualizadas);
    setLocal('tqr', atualizadas);
  };

  // Handlers para Exercícios
  const handleAdicionarExercicio = (novo: Omit<Exercicio, 'id'>) => {
    const item: Exercicio = {
      ...novo,
      id: 'ex-' + Date.now()
    };
    const atualizados = [...exercicios, item];
    setExercicios(atualizados);
    setLocal('exercicios', atualizados);
  };

  const handleExcluirExercicio = (id: string) => {
    const atualizados = exercicios.filter((e) => e.id !== id);
    setExercicios(atualizados);
    setLocal('exercicios', atualizados);
  };

  // Handlers para Peso
  const handleAdicionarPeso = (novo: Omit<RegistroPeso, 'id'>) => {
    const item: RegistroPeso = { ...novo, id: 'p-' + Date.now() };
    const atualizados = [...pesoList, item];
    setPesoList(atualizados);
    setLocal('peso', atualizados);
  };

  const handleExcluirPeso = (id: string) => {
    const atualizados = pesoList.filter((p) => p.id !== id);
    setPesoList(atualizados);
    setLocal('peso', atualizados);
  };

  // Handlers para Medidas
  const handleAdicionarMedida = (novo: Omit<MedidasCorporais, 'id'>) => {
    const item: MedidasCorporais = { ...novo, id: 'm-' + Date.now() };
    const atualizados = [...medidasList, item];
    setMedidasList(atualizados);
    setLocal('medidas', atualizados);
  };

  const handleExcluirMedida = (id: string) => {
    const atualizados = medidasList.filter((m) => m.id !== id);
    setMedidasList(atualizados);
    setLocal('medidas', atualizados);
  };

  // Handlers para Wearables
  const handleAdicionarWearable = (novo: Omit<WearablesSemanal, 'id'>) => {
    const item: WearablesSemanal = { ...novo, id: 'w-' + Date.now() };
    const atualizados = [...wearablesList, item];
    setWearablesList(atualizados);
    setLocal('wearables', atualizados);
  };

  const handleExcluirWearable = (id: string) => {
    const atualizados = wearablesList.filter((w) => w.id !== id);
    setWearablesList(atualizados);
    setLocal('wearables', atualizados);
  };

  // Handlers para PSQI
  const handleAdicionarPSQI = (novo: Omit<RegistroPSQI, 'id'>) => {
    const item: RegistroPSQI = { ...novo, id: 'psqi-' + Date.now() };
    const atualizados = [...psqiList, item];
    setPsqiList(atualizados);
    setLocal('psqi', atualizados);
  };

  const handleExcluirPSQI = (id: string) => {
    const atualizados = psqiList.filter((p) => p.id !== id);
    setPsqiList(atualizados);
    setLocal('psqi', atualizados);
  };

  // Handlers para ESS
  const handleAdicionarESS = (novo: Omit<RegistroESS, 'id'>) => {
    const item: RegistroESS = { ...novo, id: 'ess-' + Date.now() };
    const atualizados = [...essList, item];
    setEssList(atualizados);
    setLocal('ess', atualizados);
  };

  const handleExcluirESS = (id: string) => {
    const atualizados = essList.filter((e) => e.id !== id);
    setEssList(atualizados);
    setLocal('ess', atualizados);
  };

  // Handlers de Configuração
  const handleAtualizarConfig = (patch: Partial<ConfigApp>) => {
    const novo = { ...config, ...patch };
    setConfig(novo);
    setLocal('config', novo);
  };

  // Formatador de data no cabeçalho
  const hojeTexto = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1F2A24] font-sans pb-24 sm:pb-28">
      {/* Topo / Header */}
      <header className="px-4 sm:px-6 pt-5 pb-3 max-w-3xl mx-auto flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2A4B39] tracking-tight">
              Treino &amp; Saúde
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              <Sparkles className="w-3 h-3" /> Poco X5 Ready
            </span>
          </div>
          <p className="text-xs text-stone-500 capitalize mt-0.5">{hojeTexto}</p>
        </div>

        <button
          onClick={() => setTab('dados')}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition-all flex items-center gap-1.5 cursor-pointer"
          title="Configurações e Sincronização Google Sheets"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
          <span>{config.googleSpreadsheetId ? 'Sheets Conectado' : 'Google Sheets'}</span>
        </button>
      </header>

      {/* Conteúdo Principal */}
      <main className="px-4 sm:px-6 max-w-3xl mx-auto space-y-4">
        {/* Timer Card herói sempre no topo da aba Treino */}
        {tab === 'treino' && (
          <TimerCard
            config={config}
            onOpenSettings={() => setModalTimerAberta(true)}
            externalTrigger={timerTrigger}
          />
        )}

        {tab === 'treino' && (
          <WorkoutView
            series={series}
            tqrList={tqrList}
            onOpenNewSeries={() => setModalSerieAberta(true)}
            onOpenTqr={() => setModalTqrAberta(true)}
            onDeleteSeries={handleExcluirSerie}
          />
        )}

        {tab === 'analise' && (
          <AnalysisView
            series={series}
            tqrList={tqrList}
            wearables={wearablesList}
          />
        )}

        {tab === 'corpo' && (
          <BodyView
            altura={config.altura}
            pesoList={pesoList}
            medidasList={medidasList}
            wearablesList={wearablesList}
            onAddPeso={handleAdicionarPeso}
            onDeletePeso={handleExcluirPeso}
            onAddMedida={handleAdicionarMedida}
            onDeleteMedida={handleExcluirMedida}
            onAddWearable={handleAdicionarWearable}
            onDeleteWearable={handleExcluirWearable}
          />
        )}

        {tab === 'sono' && (
          <SleepView
            psqiList={psqiList}
            essList={essList}
            onAddPSQI={handleAdicionarPSQI}
            onDeletePSQI={handleExcluirPSQI}
            onAddESS={handleAdicionarESS}
            onDeleteESS={handleExcluirESS}
          />
        )}

        {tab === 'dados' && (
          <DataSyncView
            config={config}
            exercicios={exercicios}
            series={series}
            pesoList={pesoList}
            medidasList={medidasList}
            wearablesList={wearablesList}
            psqiList={psqiList}
            essList={essList}
            tqrList={tqrList}
            onUpdateConfig={handleAtualizarConfig}
            onAddExercicio={handleAdicionarExercicio}
            onDeleteExercicio={handleExcluirExercicio}
            onReloadAll={recarregarTodosDados}
          />
        )}
      </main>

      {/* Botão Flutuante (FAB) de Adição Rápida */}
      <button
        onClick={() => setModalSerieAberta(true)}
        className="fixed right-5 bottom-20 sm:bottom-22 h-13 px-5 rounded-full bg-[#2A4B39] hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center gap-2 active:scale-95 transition-all z-40 cursor-pointer"
        title="Adicionar Série"
      >
        <Plus className="w-5 h-5" />
        <span>Nova Série</span>
      </button>

      {/* Barra de Navegação Inferior (Estilo App Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 py-2 px-3 flex items-center justify-around z-30 shadow-lg">
        <button
          onClick={() => setTab('treino')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            tab === 'treino' ? 'text-[#2A4B39] font-bold' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <Dumbbell className="w-5 h-5" />
          <span className="text-[10px]">Treino</span>
        </button>

        <button
          onClick={() => setTab('analise')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            tab === 'analise' ? 'text-[#2A4B39] font-bold' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px]">Análise</span>
        </button>

        <button
          onClick={() => setTab('corpo')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            tab === 'corpo' ? 'text-[#2A4B39] font-bold' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <Scale className="w-5 h-5" />
          <span className="text-[10px]">Corpo</span>
        </button>

        <button
          onClick={() => setTab('sono')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            tab === 'sono' ? 'text-[#2A4B39] font-bold' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <Moon className="w-5 h-5" />
          <span className="text-[10px]">Sono</span>
        </button>

        <button
          onClick={() => setTab('dados')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            tab === 'dados' ? 'text-[#2A4B39] font-bold' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <Database className="w-5 h-5" />
          <span className="text-[10px]">Dados</span>
        </button>
      </nav>

      {/* Modais do Sistema */}
      <NewSeriesModal
        isOpen={modalSerieAberta}
        onClose={() => setModalSerieAberta(false)}
        exercicios={exercicios}
        seriesExistentes={series}
        onSave={handleSalvarSerie}
      />

      <TqrModal
        isOpen={modalTqrAberta}
        onClose={() => setModalTqrAberta(false)}
        onSave={handleSalvarTqr}
      />

      <TimerSettingsModal
        isOpen={modalTimerAberta}
        onClose={() => setModalTimerAberta(false)}
        config={config}
        onSave={handleAtualizarConfig}
      />
    </div>
  );
}
