import React, { useState } from 'react';
import { Scale, Ruler, Watch, Plus, Trash2 } from 'lucide-react';
import { RegistroPeso, MedidasCorporais, WearablesSemanal } from '../types';
import { calcIMC, classificaIMC, classificaPA, fmtBR, isoHoje, segundaDaSemana } from '../utils/calculations';

interface BodyViewProps {
  altura: number;
  pesoList: RegistroPeso[];
  medidasList: MedidasCorporais[];
  wearablesList: WearablesSemanal[];
  onAddPeso: (p: Omit<RegistroPeso, 'id'>) => void;
  onDeletePeso: (id: string) => void;
  onAddMedida: (m: Omit<MedidasCorporais, 'id'>) => void;
  onDeleteMedida: (id: string) => void;
  onAddWearable: (w: Omit<WearablesSemanal, 'id'>) => void;
  onDeleteWearable: (id: string) => void;
}

export const BodyView: React.FC<BodyViewProps> = ({
  altura,
  pesoList,
  medidasList,
  wearablesList,
  onAddPeso,
  onDeletePeso,
  onAddMedida,
  onDeleteMedida,
  onAddWearable,
  onDeleteWearable
}) => {
  const [subTab, setSubTab] = useState<'peso' | 'medidas' | 'wearables'>('peso');
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form states for modals
  const [dataInput, setDataInput] = useState<string>(isoHoje());
  const [pesoInput, setPesoInput] = useState<string>('');
  const [obsInput, setObsInput] = useState<string>('');

  // Medidas form states
  const [busto, setBusto] = useState<string>('');
  const [ombros, setOmbros] = useState<string>('');
  const [braco, setBraco] = useState<string>('');
  const [antebraco, setAntebraco] = useState<string>('');
  const [coxa, setCoxa] = useState<string>('');
  const [panturrilha, setPanturrilha] = useState<string>('');

  // Wearables form states
  const [fcRepouso, setFcRepouso] = useState<string>('');
  const [qualSono, setQualSono] = useState<string>('');
  const [quantSono, setQuantSono] = useState<string>('');
  const [paSis, setPaSis] = useState<string>('');
  const [paDia, setPaDia] = useState<string>('');

  const ultimoPeso = pesoList.length > 0 ? pesoList[pesoList.length - 1] : null;
  const imcAtual = ultimoPeso ? calcIMC(ultimoPeso.peso, altura) : null;

  const handleSalvarPeso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesoInput) return;
    onAddPeso({
      data: dataInput,
      peso: parseFloat(pesoInput),
      obs: obsInput.trim()
    });
    setPesoInput('');
    setObsInput('');
    setShowModal(false);
  };

  const handleSalvarMedidas = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMedida({
      data: dataInput,
      busto: busto ? parseFloat(busto) : null,
      ombros: ombros ? parseFloat(ombros) : null,
      braco: braco ? parseFloat(braco) : null,
      antebraco: antebraco ? parseFloat(antebraco) : null,
      coxa: coxa ? parseFloat(coxa) : null,
      panturrilha: panturrilha ? parseFloat(panturrilha) : null,
      obs: obsInput.trim()
    });
    setShowModal(false);
  };

  const handleSalvarWearables = (e: React.FormEvent) => {
    e.preventDefault();
    onAddWearable({
      semana: segundaDaSemana(dataInput),
      fcRepouso: fcRepouso ? parseInt(fcRepouso) : null,
      qualSono: qualSono ? parseInt(qualSono) : null,
      quantSono: quantSono ? parseInt(quantSono) : null,
      paSis: paSis ? parseInt(paSis) : null,
      paDia: paDia ? parseInt(paDia) : null,
      obs: obsInput.trim()
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Subtabs */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-200/80 rounded-xl overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setSubTab('peso')}
          className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            subTab === 'peso'
              ? 'bg-white text-stone-900 shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Peso & IMC</span>
        </button>

        <button
          onClick={() => setSubTab('medidas')}
          className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            subTab === 'medidas'
              ? 'bg-white text-stone-900 shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Medidas Corporais</span>
        </button>

        <button
          onClick={() => setSubTab('wearables')}
          className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            subTab === 'wearables'
              ? 'bg-white text-stone-900 shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Watch className="w-3.5 h-3.5" />
          <span>Wearables & Pressão</span>
        </button>
      </div>

      {/* Subtab: Peso e IMC */}
      {subTab === 'peso' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-500 block mb-1">Peso Atual</span>
              <div className="font-serif text-2xl font-bold text-stone-900">
                {ultimoPeso ? `${ultimoPeso.peso} kg` : '–'}
              </div>
              <span className="text-[11px] text-stone-400 block mt-1">
                {ultimoPeso ? fmtBR(ultimoPeso.data) : 'Nenhum registro'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-500 block mb-1">Índice IMC</span>
              <div className="font-serif text-2xl font-bold text-stone-900">
                {imcAtual ? imcAtual.toFixed(1) : '–'}
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 block mt-1">
                {classificaIMC(imcAtual)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm text-stone-800">Histórico de Pesagens</h4>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Peso</span>
              </button>
            </div>

            {pesoList.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">Nenhum peso registrado.</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {[...pesoList].reverse().map((p) => {
                  const imc = calcIMC(p.peso, altura);
                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-stone-50 px-2 rounded-lg">
                      <div>
                        <p className="font-semibold text-stone-800">{fmtBR(p.data)}</p>
                        <p className="text-stone-500 text-[11px]">
                          IMC {imc ? imc.toFixed(1) : '–'} · {classificaIMC(imc)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-serif font-bold text-sm text-stone-900">{p.peso} kg</span>
                        <button
                          onClick={() => onDeletePeso(p.id)}
                          className="text-stone-300 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab: Medidas Corporais */}
      {subTab === 'medidas' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-sm text-stone-800">Medidas Corporais (cm)</h4>
                <p className="text-[11px] text-stone-500">Acompanhamento trimestral com fita métrica</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Medidas</span>
              </button>
            </div>

            {medidasList.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">Nenhuma medida registrada.</p>
            ) : (
              <div className="space-y-3">
                {[...medidasList].reverse().map((m) => (
                  <div key={m.id} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-stone-900">{fmtBR(m.data)}</span>
                      <button
                        onClick={() => onDeleteMedida(m.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-stone-600">
                      <div>Peito: <span className="font-bold text-stone-800">{m.busto || '–'} cm</span></div>
                      <div>Ombros: <span className="font-bold text-stone-800">{m.ombros || '–'} cm</span></div>
                      <div>Braço: <span className="font-bold text-stone-800">{m.braco || '–'} cm</span></div>
                      <div>Antebraço: <span className="font-bold text-stone-800">{m.antebraco || '–'} cm</span></div>
                      <div>Coxa: <span className="font-bold text-stone-800">{m.coxa || '–'} cm</span></div>
                      <div>Panturrilha: <span className="font-bold text-stone-800">{m.panturrilha || '–'} cm</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab: Wearables & Pressão */}
      {subTab === 'wearables' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-700 leading-relaxed">
            <strong>Diretrizes American Heart Association / SBC:</strong> Pressão Normal: &lt; 120 e &lt; 80 mmHg. Elevada: 120–129 e &lt; 80. Hipertensão Estágio 1: 130–139 ou 80–89. Meça sentado após 5 minutos de repouso.
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm text-stone-800">Registros Semanais</h4>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Registro</span>
              </button>
            </div>

            {wearablesList.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">Nenhum registro de wearable.</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {[...wearablesList].reverse().map((w) => {
                  const classePA = classificaPA(w.paSis, w.paDia);
                  return (
                    <div key={w.id} className="py-3 flex items-center justify-between text-xs hover:bg-stone-50 px-2 rounded-lg">
                      <div>
                        <p className="font-semibold text-stone-900">Semana de {fmtBR(w.semana)}</p>
                        <p className="text-stone-500 text-[11px] mt-0.5">
                          {w.fcRepouso ? `FC Repouso: ${w.fcRepouso} bpm · ` : ''}
                          {w.qualSono ? `Sono: ${w.qualSono}% · ` : ''}
                          {w.paSis && w.paDia ? `PA: ${w.paSis}/${w.paDia} mmHg` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {classePA && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              classePA === 'Normal'
                                ? 'bg-emerald-100 text-emerald-800'
                                : classePA === 'Pressão elevada'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {classePA}
                          </span>
                        )}
                        <button
                          onClick={() => onDeleteWearable(w.id)}
                          className="text-stone-300 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Genérico para Adição */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-lg text-stone-900 mb-4">
              {subTab === 'peso' ? 'Registrar Pesagem' : subTab === 'medidas' ? 'Registrar Medidas (cm)' : 'Registrar Wearables / Pressão'}
            </h3>

            {subTab === 'peso' && (
              <form onSubmit={handleSalvarPeso} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Data</label>
                  <input
                    type="date"
                    value={dataInput}
                    onChange={(e) => setDataInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 73.5"
                    value={pesoInput}
                    onChange={(e) => setPesoInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-xs font-bold text-white shadow-xs"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            )}

            {subTab === 'medidas' && (
              <form onSubmit={handleSalvarMedidas} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Data</label>
                  <input
                    type="date"
                    value={dataInput}
                    onChange={(e) => setDataInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-stone-600">Peito / Busto</label>
                    <input type="number" step="0.1" value={busto} onChange={(e) => setBusto(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-600">Ombros</label>
                    <input type="number" step="0.1" value={ombros} onChange={(e) => setOmbros(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-600">Braço</label>
                    <input type="number" step="0.1" value={braco} onChange={(e) => setBraco(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-600">Antebraço</label>
                    <input type="number" step="0.1" value={antebraco} onChange={(e) => setAntebraco(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-600">Coxa</label>
                    <input type="number" step="0.1" value={coxa} onChange={(e) => setCoxa(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-600">Panturrilha</label>
                    <input type="number" step="0.1" value={panturrilha} onChange={(e) => setPanturrilha(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                  </div>
                </div>
                <div className="flex gap-2 pt-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-xl bg-stone-100 text-xs font-semibold">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs">Salvar</button>
                </div>
              </form>
            )}

            {subTab === 'wearables' && (
              <form onSubmit={handleSalvarWearables} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Data de Referência</label>
                  <input
                    type="date"
                    value={dataInput}
                    onChange={(e) => setDataInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-stone-600">FC Repouso (bpm)</label>
                    <input type="number" value={fcRepouso} onChange={(e) => setFcRepouso(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" placeholder="Ex: 58" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-600">Qualidade Sono (%)</label>
                    <input type="number" value={qualSono} onChange={(e) => setQualSono(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" placeholder="Ex: 85" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-600">PA Sistólica (mmHg)</label>
                    <input type="number" value={paSis} onChange={(e) => setPaSis(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" placeholder="Ex: 118" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-600">PA Diastólica (mmHg)</label>
                    <input type="number" value={paDia} onChange={(e) => setPaDia(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-xs" placeholder="Ex: 76" />
                  </div>
                </div>
                <div className="flex gap-2 pt-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-xl bg-stone-100 text-xs font-semibold">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs">Salvar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
