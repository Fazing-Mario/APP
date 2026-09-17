import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Share2,
  Sparkles,
  ShieldCheck,
  Download,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface MobileAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
  canInstall?: boolean;
  onTriggerInstall?: () => void;
}

export const MobileAccessModal: React.FC<MobileAccessModalProps> = ({
  isOpen,
  onClose,
  appUrl,
  canInstall,
  onTriggerInstall
}) => {
  const [copiado, setCopiado] = useState(false);
  const [plataforma, setPlataforma] = useState<'android' | 'ios'>('android');
  const [mostrarAjuda, setMostrarAjuda] = useState(false);

  // URL para abrir no celular: prefere a URL pública/compartilhada ou a URL atual da janela
  const urlFinal =
    appUrl ||
    (typeof window !== 'undefined' && window.location.href.startsWith('http')
      ? window.location.href
      : 'https://ais-pre-klk7fqyv244ztfwpryn7dj-319937595038.us-west1.run.app');

  const handleCopiar = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(urlFinal);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
    urlFinal
  )}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg bg-white dark:bg-[#1A231E] rounded-3xl border border-stone-200 dark:border-[#2D3D34] shadow-2xl text-stone-900 dark:text-[#EAF2EC] overflow-hidden flex flex-col max-h-[92vh]"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
        <div className="p-5 border-b border-stone-100 dark:border-[#2D3D34] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white leading-tight">
                Acessar &amp; Instalar no Celular
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Poco X5 / Xiaomi, Android e iPhone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#232E27] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Rolagem */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Card com QR Code e Link Direto */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#121614] border border-stone-200 dark:border-[#26352D] flex flex-col sm:flex-row items-center gap-4">
            <div className="p-2 bg-white rounded-xl shadow-xs border border-stone-200 shrink-0">
              <img
                src={qrCodeUrl}
                alt="QR Code do Aplicativo"
                width={130}
                height={130}
                className="w-32 h-32 object-contain"
                loading="eager"
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 mb-1">
                  <QrCode className="w-3 h-3" /> Câmera do Celular
                </span>
                <h4 className="font-bold text-stone-900 dark:text-white text-sm">
                  Aponte a câmera para escanear
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                  Abra a câmera do seu Poco X5 ou iPhone e aponte para o código ao lado para abrir o app na hora.
                </p>
              </div>

              {/* Botão de Copiar Link */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleCopiar}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  {copiado ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Link do App</span>
                    </>
                  )}
                </button>

                <a
                  href={urlFinal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white dark:bg-[#1A231E] border border-stone-300 dark:border-[#2D3D34] text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#232E27] transition-colors"
                  title="Abrir em nova aba"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Seletor de Plataforma */}
          <div>
            <div className="flex rounded-xl p-1 bg-stone-100 dark:bg-[#121614] border border-stone-200 dark:border-[#26352D] mb-3">
              <button
                onClick={() => setPlataforma('android')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  plataforma === 'android'
                    ? 'bg-white dark:bg-[#1A231E] text-emerald-800 dark:text-emerald-400 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                Poco X5 / Android (Chrome)
              </button>
              <button
                onClick={() => setPlataforma('ios')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  plataforma === 'ios'
                    ? 'bg-white dark:bg-[#1A231E] text-emerald-800 dark:text-emerald-400 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                iPhone (Safari)
              </button>
            </div>

            {/* Botão de Instalação Direta (se o Chrome disparar beforeinstallprompt) */}
            {canInstall && onTriggerInstall && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-700 text-white flex items-center justify-between shadow-sm border border-emerald-600">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <Download className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Instalar Treino &amp; Saúde</div>
                    <div className="text-[10px] text-emerald-100">Instalação direta com 1 clique no aparelho</div>
                  </div>
                </div>
                <button
                  onClick={onTriggerInstall}
                  className="py-1.5 px-3 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  Instalar Agora
                </button>
              </div>
            )}

            {/* Passo a Passo Android (Poco X5 / MIUI) */}
            {plataforma === 'android' && (
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-stone-50 dark:bg-[#121614] border border-stone-200 dark:border-[#26352D]">
                <h5 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Como instalar como App Nativo (PWA) no Android:</span>
                </h5>

                <ol className="space-y-2 text-[11px] text-stone-600 dark:text-stone-300 list-decimal pl-4 leading-relaxed">
                  <li>
                    Abra o link acima no <strong>Google Chrome</strong> do seu Poco X5.
                  </li>
                  <li>
                    Toque no menu de <strong>3 pontinhos (⋮)</strong> no canto superior direito do Chrome.
                  </li>
                  <li>
                    Toque na opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                  </li>
                  <li>
                    Confirme o nome <strong>Treino &amp; Saúde</strong>. O ícone oficial do aplicativo aparecerá na grade de apps do seu celular.
                  </li>
                </ol>

                {/* Seção de Solução de Problemas no Poco X5 / Xiaomi */}
                <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-[11px] space-y-2">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between font-bold cursor-pointer text-left"
                    onClick={() => setMostrarAjuda(!mostrarAjuda)}
                  >
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Chrome não mostra a opção ou dá erro? (Poco/Xiaomi)</span>
                    </div>
                    {mostrarAjuda ? <ChevronUp className="w-4 h-4 shrink-0 ml-1" /> : <ChevronDown className="w-4 h-4 shrink-0 ml-1" />}
                  </button>

                  {mostrarAjuda && (
                    <div className="space-y-2 pt-1.5 border-t border-amber-500/20 text-[10.5px] leading-relaxed">
                      <p>
                        <strong>1. Permissão da Xiaomi (MIUI/HyperOS):</strong> Por padrão de fábrica, o Poco X5 bloqueia criação de atalhos por navegadores. Para liberar:
                        <br />
                        No celular, vá em: <em>Configurações &gt; Apps &gt; Gerenciar Apps &gt; Chrome &gt; Outras Permissões &gt; toque em "Atalhos na tela inicial" e marque como <strong>Permitir</strong></em>.
                      </p>
                      <p>
                        <strong>2. Abrir fora do editor:</strong> O Chrome desativa instalação quando a página está dentro de um frame embutido. Copie o link e abra direto no Chrome.
                      </p>
                      <p>
                        <strong>3. Recarregue a página:</strong> Como acabamos de gerar os ícones PNG e o Service Worker offline, recarregue a página no Chrome para que ele leia as novas configurações.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-2 p-2.5 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 text-[11px] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-400" />
                  <span>
                    <strong>Vantagem no Poco X5:</strong> O app roda em tela cheia (sem barra de URL do navegador), não sofre com o fechamento em segundo plano da bateria e mantém todos os dados sincronizados com o Google Sheets.
                  </span>
                </div>
              </div>
            )}

            {/* Passo a Passo iOS */}
            {plataforma === 'ios' && (
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-stone-50 dark:bg-[#121614] border border-stone-200 dark:border-[#26352D]">
                <h5 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Como instalar no iPhone (Safari):</span>
                </h5>

                <ol className="space-y-2 text-[11px] text-stone-600 dark:text-stone-300 list-decimal pl-4 leading-relaxed">
                  <li>
                    Abra o link acima no navegador <strong>Safari</strong> do iPhone.
                  </li>
                  <li>
                    Toque no botão de <strong>Compartilhar</strong> (quadrado com seta para cima no rodapé).
                  </li>
                  <li>
                    Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.
                  </li>
                  <li>
                    Toque em <strong>Adicionar</strong> no canto superior direito.
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Destaque de Recursos */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-3 rounded-xl bg-stone-100 dark:bg-[#222D27] border border-stone-200 dark:border-[#2D3D34]">
              <span className="font-bold text-stone-900 dark:text-white block mb-0.5">
                🌙 Tema Escuro Ativo
              </span>
              <span className="text-stone-500 dark:text-stone-400 text-[10px]">
                Ideal para treinos em academia e economia de bateria AMOLED.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-100 dark:bg-[#222D27] border border-stone-200 dark:border-[#2D3D34]">
              <span className="font-bold text-stone-900 dark:text-white block mb-0.5">
                📊 Google Sheets
              </span>
              <span className="text-stone-500 dark:text-stone-400 text-[10px]">
                Envie dados direto para sua planilha pelo celular com 1 toque.
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-stone-100 dark:border-[#2D3D34] bg-stone-50 dark:bg-[#141A16] flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 font-bold text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            Entendido
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
