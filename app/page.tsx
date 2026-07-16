'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import TransactionModal from '@/components/TransactionModal';
import { CHAINS } from '@/lib/chains';

// ─── Default Configuration ──────────────────────────────────────────────

const DEFAULT_LLM_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_LLM_MODEL = 'gpt-4o-mini';

const ACTIONS = [
  { value: 'transfer', label: 'Transfer' },
  { value: 'nft', label: 'NFT' },
  { value: 'contract', label: 'Contract' },
];

// ─── LLM Connection Check ──────────────────────────────────────────────

/** Check whether the LLM endpoint is reachable (via backend proxy to avoid browser CORS) */
async function checkLlmConnection(
  baseUrl: string,
  apiKey: string,
  model: string,
): Promise<'connected' | 'error'> {
  if (!baseUrl || !model) return 'error';
  try {
    const res = await fetch('/api/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl, apiKey, model }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json() as { connected?: boolean };
    return data.connected ? 'connected' : 'error';
  } catch {
    return 'error';
  }
}

// ─── Toast Notification ────────────────────────────────────────────────

/** Lightweight bottom-center notification, auto-dismisses after 3 seconds */
function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error' | 'info'; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(), 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl text-sm font-medium shadow-2xl z-50 ${
      type === 'success' ? 'bg-emerald-600 text-white' :
      type === 'error' ? 'bg-red-600 text-white' :
      'bg-zinc-700 text-zinc-200'
    }`}>
      {message}
    </div>
  );
}

// ─── Settings Panel ────────────────────────────────────────────────────

function SettingsPanel({
  llmBaseUrl, setLlmBaseUrl, llmApiKey, setLlmApiKey, llmModel, setLlmModel,
  onSave,
}: {
  llmBaseUrl: string; setLlmBaseUrl: (v: string) => void;
  llmApiKey: string; setLlmApiKey: (v: string) => void;
  llmModel: string; setLlmModel: (v: string) => void;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [formBaseUrl, setFormBaseUrl] = useState(llmBaseUrl);
  const [formApiKey, setFormApiKey] = useState(llmApiKey);
  const [formModel, setFormModel] = useState(llmModel);

  useEffect(() => {
    if (open) {
      setFormBaseUrl(llmBaseUrl);
      setFormApiKey(llmApiKey);
      setFormModel(llmModel);
    }
  }, [open, llmBaseUrl, llmApiKey, llmModel]);

  const handleSave = async () => {
    localStorage.setItem('gas-guru-settings', JSON.stringify({
      llmBaseUrl: formBaseUrl,
      llmApiKey: formApiKey,
      llmModel: formModel,
    }));
    setLlmBaseUrl(formBaseUrl);
    setLlmApiKey(formApiKey);
    setLlmModel(formModel);
    onSave();
  };

  const handleCancel = () => {
    setFormBaseUrl(llmBaseUrl);
    setFormApiKey(llmApiKey);
    setFormModel(llmModel);
    setOpen(false);
  };

  const handleRestore = () => {
    setFormBaseUrl(DEFAULT_LLM_BASE_URL);
    setFormApiKey('');
    setFormModel(DEFAULT_LLM_MODEL);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-50 w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-all flex items-center justify-center"
        title="Settings"
      >
        ⚙️
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={handleCancel} />
      <div className="fixed top-4 right-4 z-50 w-[440px] max-w-[90vw] bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">⚙️ 设置</h2>
          <button onClick={handleCancel} className="text-zinc-500 hover:text-white transition-colors text-xl">✕</button>
        </div>

        <div className="mb-5">
          <label className="block text-base font-semibold text-zinc-300 mb-2">🤖 AI Endpoint</label>
          <input
            type="text"
            value={formBaseUrl}
            onChange={(e) => setFormBaseUrl(e.target.value)}
            placeholder={DEFAULT_LLM_BASE_URL}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-base text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <p className="text-sm text-zinc-500 mt-1.5">OpenAI / Ollama / any OpenAI-compatible API endpoint</p>
        </div>

        <div className="mb-5">
          <label className="block text-base font-semibold text-zinc-300 mb-2">🔑 AI API Key</label>
          <input
            type="password"
            value={formApiKey}
            onChange={(e) => setFormApiKey(e.target.value)}
            placeholder="OpenAI: sk-xxx, local model: none"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-base text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="mb-6">
          <label className="block text-base font-semibold text-zinc-300 mb-2">📦 Model Name</label>
          <input
            type="text"
            value={formModel}
            onChange={(e) => setFormModel(e.target.value)}
            placeholder={DEFAULT_LLM_MODEL}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-base text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={handleRestore}
            className="text-sm text-zinc-500 hover:text-zinc-300 underline transition-colors"
          >
            Reset to defaults
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-3 rounded-xl text-base font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-base font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            💾 Save
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Connection Status Indicator ───────────────────────────────────────

function ConnectionStatus({ status, label }: { status: 'connected' | 'error' | 'unknown'; label: string }) {
  const color = status === 'connected' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-zinc-600';
  const text = status === 'connected' ? 'Connected' : status === 'error' ? 'Disconnected' : 'Checking';

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-base text-zinc-400">{label}: {text}</span>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────

export default function Home() {
  const [baseFee, setBaseFee] = useState<number | null>(null);
  const [priorityFee, setPriorityFee] = useState<number | null>(null);
  const [loadingGas, setLoadingGas] = useState(true);
  const [gasError, setGasError] = useState<string | null>(null);
  const [gasStatus, setGasStatus] = useState<'connected' | 'error' | 'unknown'>('unknown');

  const [action, setAction] = useState('普通转账');
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [showTxModal, setShowTxModal] = useState(false);

  const [llmBaseUrl, setLlmBaseUrl] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [llmStatus, setLlmStatus] = useState<'connected' | 'error' | 'unknown'>('unknown');

  const llmBaseUrlRef = useRef('');
  const llmApiKeyRef = useRef('');
  const llmModelRef = useRef('');

  // Merge three separate useEffect hooks into one to avoid redundant re-renders
  useEffect(() => {
    llmBaseUrlRef.current = llmBaseUrl;
    llmApiKeyRef.current = llmApiKey;
    llmModelRef.current = llmModel;
  }, [llmBaseUrl, llmApiKey, llmModel]);

  useEffect(() => {
    const saved = localStorage.getItem('gas-guru-settings');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.llmBaseUrl) { setLlmBaseUrl(s.llmBaseUrl); llmBaseUrlRef.current = s.llmBaseUrl; }
        if (s.llmApiKey) setLlmApiKey(s.llmApiKey);
        if (s.llmModel) { setLlmModel(s.llmModel); llmModelRef.current = s.llmModel; }
      } catch { /* ignore */ }
    } else {
      setLlmBaseUrl(DEFAULT_LLM_BASE_URL);
      llmBaseUrlRef.current = DEFAULT_LLM_BASE_URL;
      setLlmModel(DEFAULT_LLM_MODEL);
      llmModelRef.current = DEFAULT_LLM_MODEL;
    }
  }, []);

  const loadGas = useCallback(async () => {
    setLoadingGas(true);
    setGasError(null);
    try {
      const res = await fetch('/api/gas-fees');
      const data = await res.json() as { baseFee?: number; priorityFee?: number; message?: string };
      // Fix: use typeof check instead of truthy check to handle baseFee === 0 (valid when network is idle)
      if (!res.ok || typeof data.baseFee !== 'number') {
        setGasError(data.message || 'RPC call failed');
        throw new Error(data.message || 'RPC call failed');
      }
      setBaseFee(data.baseFee);
      setPriorityFee(data.priorityFee ?? null);
      setGasStatus('connected');
      setGasError(null);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'RPC call failed';
      setGasError(errorMsg);
      setBaseFee(null);
      setPriorityFee(null);
      setGasStatus('error');
    } finally {
      setLoadingGas(false);
    }
  }, []);

  useEffect(() => { loadGas(); }, [loadGas]);
  useEffect(() => {
    const id = setInterval(loadGas, 30_000);
    return () => clearInterval(id);
  }, [loadGas]);

  // Debounce LLM connection check to avoid spam on every keystroke
  useEffect(() => {
    const timer = setTimeout(async () => {
      const status = await checkLlmConnection(llmBaseUrlRef.current, llmApiKeyRef.current, llmModelRef.current);
      setLlmStatus(status);
    }, 500);
    return () => clearTimeout(timer);
  }, [llmBaseUrl, llmApiKey, llmModel]);

  const handleExplain = async () => {
    if (baseFee === null && !loadingGas) {
      setToastMsg('Gas data is loading, please try again later');
      setToastType('info');
      return;
    }
    setLoadingAI(true);
    setAiReply(null);
    try {
      const res = await fetch('/api/gas-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, llmBaseUrl, llmApiKey, llmModel }),
      });
      const data = await res.json() as { reply?: string };
      if (data.reply) setAiReply(data.reply);
    } catch {
      setAiReply(null);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSaveSettings = async () => {
    setToastMsg('Settings saved');
    setToastType('success');
    setLlmStatus('unknown');
    const status = await checkLlmConnection(llmBaseUrl, llmApiKey, llmModel);
    setLlmStatus(status);
    await loadGas();
  };

  const currentChain = CHAINS[0];

  /** Cache gas label result to avoid computing twice and using non-null assertion */
  const gasLabel = (() => {
    if (baseFee === null || loadingGas) return null;
    if (baseFee < 10) return { label: 'Very Cheap', cls: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50' };
    if (baseFee < 25) return { label: 'Moderate', cls: 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50' };
    if (baseFee < 50) return { label: 'High', cls: 'bg-orange-900/50 text-orange-400 border border-orange-700/50' };
    return { label: 'Very Congested', cls: 'bg-red-900/50 text-red-400 border border-red-700/50' };
  })();

  const transferCost = baseFee !== null && priorityFee !== null
    ? ((21000 * (baseFee + priorityFee) * 1e-9 * currentChain.tokenPrice)).toFixed(2)
    : '--';

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans scale-[0.7] origin-top-left w-[142.86%] text-[142.86%]">
      {/* ── Error Banner ── */}
      {gasError && !loadingGas && (
        <div className="bg-red-900/30 border-b border-red-800/40 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-base text-red-300">
              <span>⚠️</span>
              <span>
                {gasError.includes('端点') || gasError.includes('不可用')
                  ? 'RPC endpoint temporarily unavailable, please try again later'
                  : gasError.includes('feeHistory') || gasError.includes('无数据')
                    ? 'RPC returned abnormal data, likely network congestion'
                    : gasError}
              </span>
            </div>
            <button onClick={loadGas} className="text-sm bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">⛽</span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gas Guru</h1>
              <p className="text-base text-zinc-400">Real-time Ethereum Gas Fees & AI Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatus status={gasStatus} label="RPC" />
            <ConnectionStatus status={llmStatus} label="AI" />
          </div>
        </div>
      </header>

      {/* ── 2×2 Grid ── */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* [Top-Left] Gas Fees */}
          <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              <span>📊</span> Gas Fees
              {loadingGas && <span className="text-base text-zinc-500 font-normal">Loading...</span>}
            </h2>
            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="bg-zinc-800/50 rounded-xl p-6">
                <p className="text-base text-zinc-500 mb-2">Base Fee</p>
                <p className="text-4xl font-bold font-mono">
                  {loadingGas
                    ? <span className="inline-block w-24 h-10 bg-zinc-700 rounded animate-pulse" />
                    : baseFee !== null ? `${baseFee.toFixed(2)}` : <span className="text-red-500 text-2xl">--</span>
                  }
                </p>
                <p className="text-sm text-zinc-600 mt-1">Gwei</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-6">
                <p className="text-base text-zinc-500 mb-2">Priority Fee</p>
                <p className="text-4xl font-bold font-mono">
                  {loadingGas
                    ? <span className="inline-block w-24 h-10 bg-zinc-700 rounded animate-pulse" />
                    : priorityFee !== null ? `${priorityFee.toFixed(2)}` : <span className="text-red-500 text-2xl">--</span>
                  }
                </p>
                <p className="text-sm text-zinc-600 mt-1">Gwei</p>
              </div>
            </div>
            {gasLabel && !loadingGas && (
              <span className={`text-base font-semibold px-4 py-1.5 rounded-full ${gasLabel.cls}`}>
                {gasLabel.label}
              </span>
            )}
          </section>

          {/* [Top-Right] Network Info */}
          <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              <span>🌐</span> Network Info
            </h2>
            <div className="space-y-4 text-base">
              <div className="flex justify-between">
                <span className="text-zinc-500">Chain</span>
                <span className="text-zinc-200">{currentChain.name} Mainnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Block Time</span>
                <span className="text-zinc-200 font-mono">{currentChain.blockTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Transfer Gas</span>
                <span className="text-zinc-200 font-mono">21,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Transfer Cost</span>
                <span className="text-zinc-200 font-mono">${transferCost}</span>
              </div>
            </div>
            <p className="mt-5 text-sm text-zinc-600">{currentChain.description}</p>
          </section>

          {/* [Bottom-Left] AI Analysis */}
          <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              <span>🤖</span> AI Analysis
            </h2>
            <div className="flex flex-wrap gap-2 mb-5">
              {ACTIONS.map(a => (
                <button
                  key={a.value}
                  onClick={() => setAction(a.value)}
                  className={`px-4 py-2 rounded-lg text-base font-medium transition-all ${
                    action === a.value
                      ? 'bg-indigo-600 text-white shadow shadow-indigo-500/25'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleExplain}
              disabled={loadingAI}
              className="w-full py-3 rounded-xl text-base font-semibold transition-all bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 shadow-lg shadow-indigo-500/25"
            >
              {loadingAI ? '🧠 Analyzing...' : '✨ Generate Advice'}
            </button>
            <div className="mt-4 text-center text-base text-zinc-600 min-h-[28px] flex items-center justify-center">
              {loadingAI ? <span className="animate-pulse">AI is analyzing...</span> : 'Click the button above to get analysis'}
            </div>
          </section>

          {/* [Bottom-Right] Simulated Transaction */}
          <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              <span>💸</span> Simulated Transaction
            </h2>
            <p className="text-base text-zinc-400 mb-5">Simulated transaction flow (not broadcast on-chain)</p>
            {baseFee !== null && !loadingGas && (
              <div className="bg-zinc-800/50 rounded-xl p-5 mb-5 text-base text-zinc-400 space-y-2">
                <div className="flex justify-between">
                  <span>Base Fee</span>
                  <span className="font-mono">{baseFee.toFixed(2)} Gwei</span>
                </div>
                <div className="flex justify-between">
                  <span>Priority Fee</span>
                  <span className="font-mono">{priorityFee?.toFixed(2) ?? '--'} Gwei</span>
                </div>
                <div className="flex justify-between border-t border-zinc-700/50 pt-2">
                  <span>Transfer Cost</span>
                  <span className="font-mono">${transferCost}</span>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowTxModal(true)}
              className="w-full py-3 rounded-xl text-base font-semibold transition-all bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              🚀 Simulate Transaction
            </button>
          </section>
        </div>
      </div>

      {/* ── AI Analysis Result ── */}
      {aiReply && (
        <section className="max-w-4xl mx-auto px-6 pb-8">
          <div className="bg-indigo-950/20 border border-indigo-800/30 rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <span>🤖</span> AI Analysis Result
            </h3>
            <div className="text-base leading-relaxed text-zinc-200 whitespace-pre-line">{aiReply}</div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="text-center text-sm text-zinc-700 py-10">
        <p>Transactions are simulated and not broadcast on-chain · Uses public RPC endpoints, no API Key required</p>
      </footer>

      {/* ── Popups / Panels ── */}
      {toastMsg && <Toast message={toastMsg} type={toastType} onDismiss={() => setToastMsg(null)} />}
      {showTxModal && (
        <TransactionModal
          baseFee={baseFee}
          priorityFee={priorityFee}
          action={action}
          chainName={currentChain.name}
          chainSymbol={currentChain.symbol}
          chainColor={currentChain.color}
          onClose={() => setShowTxModal(false)}
        />
      )}
      <SettingsPanel
        llmBaseUrl={llmBaseUrl}
        setLlmBaseUrl={setLlmBaseUrl}
        llmApiKey={llmApiKey}
        setLlmApiKey={setLlmApiKey}
        llmModel={llmModel}
        setLlmModel={setLlmModel}
        onSave={handleSaveSettings}
      />
    </main>
  );
}
