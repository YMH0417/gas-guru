'use client';

import { useState, useMemo } from 'react';

// ─── Tier Configuration ────────────────────────────────────────────────

type Tier = 'slow' | 'standard' | 'fast';

interface TierConfig {
  key: Tier;
  emoji: string;
  label: string;
  premiumGwei: number; // Extra Gwei on top of base fee
  estimateTime: string;
  successRate: string;
  rateClass: string;
}

const TIER_CONFIGS: Record<Tier, TierConfig> = {
  slow: {
    key: 'slow',
    emoji: '🐢',
    label: 'Slow',
    premiumGwei: 1,
    estimateTime: '2-5 min',
    successRate: 'Luck-based',
    rateClass: 'text-yellow-400',
  },
  standard: {
    key: 'standard',
    emoji: '⚡',
    label: 'Standard',
    premiumGwei: 1.5,
    estimateTime: '15-30 sec',
    successRate: 'Reliable',
    rateClass: 'text-emerald-400',
  },
  fast: {
    key: 'fast',
    emoji: '🚀',
    label: 'Fast',
    premiumGwei: 3,
    estimateTime: '<12 sec',
    successRate: 'Instant',
    rateClass: 'text-emerald-400',
  },
};

// ─── Step Types ────────────────────────────────────────────────────────

type Step =
  | { type: 'idle' }
  | { type: 'signing' }
  | { type: 'broadcasting' }
  | { type: 'packing' }
  | { type: 'success'; block: number; hash: string; totalFee: string; waitTime: string }
  | { type: 'failed'; reason: string };

// ─── Utility Functions ─────────────────────────────────────────────────

/** Generate a random transaction hash */
function randomHash(): string {
  return (
    '0x' +
    Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  );
}

/** Generate a random block number near current height */
function randomBlock(): number {
  return 18_593_000 + Math.floor(Math.random() * 5000);
}

/** Convert slider value (0-100) to actual premium Gwei (0.5 ~ 6.0) */
function gweiFromSlider(value: number): number {
  return 0.5 + (value / 100) * 5.5;
}

/** Convert premium Gwei to estimated success rate (0-1) */
function successRateFromGwei(premiumGwei: number): number {
  // 0.5 Gwei → ~5% success, 2.0 Gwei → ~46%, 4.0+ → ~100%
  return Math.min(1, Math.max(0.05, (premiumGwei - 0.3) / 3.5));
}

/** Get AI-recommended tier based on current Base Fee */
function getRecommendTier(baseFee: number): Tier {
  if (baseFee > 50) return 'fast';
  if (baseFee > 25) return 'standard';
  if (baseFee > 10) return 'standard';
  return 'slow';
}

/** Determine current tier from premium Gwei value */
function getTierFromGwei(premiumGwei: number): Tier {
  if (premiumGwei >= 2.8) return 'fast';
  if (premiumGwei >= 1.2) return 'standard';
  return 'slow';
}

// ─── Main Component ────────────────────────────────────────────────────

interface TransactionModalProps {
  baseFee: number | null;
  priorityFee: number | null;
  action: string;
  chainName?: string;
  chainSymbol?: string;
  chainColor?: string;
  onClose: () => void;
}

export default function TransactionModal({
  baseFee,
  priorityFee,
  action,
  chainName = 'Ethereum',
  chainSymbol = 'ETH',
  chainColor = '#627eea',
  onClose,
}: TransactionModalProps) {
  // Tier & slider state
  const [sliderValue, setSliderValue] = useState(50);
  // Current simulation step
  const [step, setStep] = useState<Step>({ type: 'idle' });
  // Progress bars
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [packingProgress, setPackingProgress] = useState(0);

  const base = baseFee ?? 25;
  const premium = gweiFromSlider(sliderValue);
  const totalGwei = base + premium;
  const tier = getTierFromGwei(premium);
  const rate = successRateFromGwei(premium);

  const gasLimit = 21_000; // Standard ETH transfer
  const totalEth = (gasLimit * totalGwei * 1e-9).toFixed(8);
  const totalUsd = (gasLimit * totalGwei * 1e-9 * 3200).toFixed(2); // ETH price fixed at $3200

  // AI-recommended tier based on current Base Fee
  const recommendedTier = useMemo(() => getRecommendTier(base), [base]);

  // Reset all state on close
  const handleClose = () => {
    setStep({ type: 'idle' });
    setBroadcastProgress(0);
    setPackingProgress(0);
    setSliderValue(50);
    onClose();
  };

  // ─── Start Transaction Simulation ──────────────────────────────────

  const handleStartTransaction = () => {
    // Step 1: Signing
    setStep({ type: 'signing' });

    setTimeout(() => {
      // Step 2: Broadcasting
      setStep({ type: 'broadcasting' });
      const broadcastInterval = setInterval(() => {
        setBroadcastProgress((prev) => {
          if (prev >= 100) {
            clearInterval(broadcastInterval);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      setTimeout(() => {
        // Step 3: Packing
        setStep({ type: 'packing' });
        setBroadcastProgress(100);

        const packingInterval = setInterval(() => {
          setPackingProgress((prev) => {
            if (prev >= 100) {
              clearInterval(packingInterval);
              return 100;
            }
            return prev + Math.random() * 20;
          });
        }, 150);

        // After packing, determine success or failure based on rate
        setTimeout(() => {
          if (Math.random() < rate) {
            // Success
            const block = randomBlock();
            const hash = randomHash();
            const waitTime = tier === 'fast' ? '~12 sec'
              : tier === 'standard' ? `~${Math.floor(Math.random() * 15 + 10)} sec`
              : '~2 min';
            setStep({ type: 'success', block, hash, totalFee: totalEth, waitTime });
          } else {
            // Failed
            setStep({ type: 'failed', reason: 'Gas too low, miners picked higher-paying transactions' });
          }
        }, 2000);
      }, 1500);
    }, 600);
  };

  // ─── Tier Card Styles ──────────────────────────────────────────────

  const getTierStyle = (key: Tier): string => {
    const isActive = tier === key;
    return isActive
      ? 'bg-indigo-900/60 border-indigo-500 ring-1 ring-indigo-500/50'
      : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600';
  };

  // ─── Render: Idle State ────────────────────────────────────────────

  const renderIdle = () => (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h3 className="text-lg font-bold text-zinc-100">Choose Gas Price</h3>
        <p className="text-sm text-zinc-500 mt-1">
          {action} · Current Base Fee: {base.toFixed(1)} Gwei
        </p>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.values(TIER_CONFIGS) as TierConfig[]).map((cfg) => (
          <button
            key={cfg.key}
            onClick={() => {
              // Set slider position based on selected tier
              setSliderValue(cfg.key === 'slow' ? 20 : cfg.key === 'standard' ? 50 : 80);
            }}
            className={`relative rounded-xl border-2 p-4 text-left transition-all ${getTierStyle(cfg.key)}`}
          >
            {cfg.key === recommendedTier && (
              <div className="absolute -top-2 right-2 bg-indigo-600 text-[10px] text-white px-2 py-0.5 rounded-full">
                AI Recommended
              </div>
            )}
            <div className="text-2xl mb-2">{cfg.emoji}</div>
            <div className="text-sm font-bold text-zinc-100">{cfg.label}</div>
            <div className="text-xs text-zinc-500 mt-1">{cfg.estimateTime}</div>
            <div className={`text-xs mt-1 ${cfg.rateClass}`}>Success: {cfg.successRate}</div>
          </button>
        ))}
      </div>

      {/* Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">Manual Adjust</span>
          <span className="text-xs text-zinc-400 font-mono">
            +{premium.toFixed(1)} Gwei → Total {(base + premium).toFixed(1)} Gwei
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
          style={{
            background: `linear-gradient(to right, #4f46e5 ${sliderValue}%, #27272a ${sliderValue}%)`,
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-zinc-600">💰 Save</span>
          <span className="text-[10px] text-zinc-600">⚡ Speed</span>
        </div>
      </div>

      {/* Fee Estimation */}
      <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Estimated Cost</span>
          <span className="text-zinc-200 font-mono">{totalEth} ETH</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Approx. USD</span>
          <span className="text-zinc-200 font-mono">${totalUsd}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Success Rate</span>
          <span className={rate > 0.7 ? 'text-emerald-400' : rate > 0.4 ? 'text-yellow-400' : 'text-red-400'}>
            {Math.round(rate * 100)}%
          </span>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStartTransaction}
        className="w-full py-3.5 rounded-xl text-base font-semibold transition-all bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
      >
        🚀 Bid Transaction
      </button>
    </div>
  );

  // ─── Render: Signing ───────────────────────────────────────────────

  const renderSigning = () => (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">🔐</div>
      <h3 className="text-lg font-bold text-zinc-100">Signing Transaction...</h3>
      <p className="text-sm text-zinc-500 mt-2">Simulating wallet signature</p>
      <div className="mt-6 flex justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    </div>
  );

  // ─── Render: Broadcasting ──────────────────────────────────────────

  const renderBroadcasting = () => (
    <div className="text-center py-8 space-y-6">
      <div className="text-5xl">📡</div>
      <h3 className="text-lg font-bold text-zinc-100">Broadcasting to Network...</h3>
      <p className="text-sm text-zinc-500">
        Gas Price: {totalGwei.toFixed(1)} Gwei · {tier === 'fast' ? '🚀 Fast' : tier === 'standard' ? '⚡ Standard' : '🐢 Slow'}
      </p>
      <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(broadcastProgress, 100)}%` }}
        />
      </div>
      <p className="text-xs text-zinc-600">{Math.min(Math.round(broadcastProgress), 100)}%</p>
    </div>
  );

  // ─── Render: Packing ───────────────────────────────────────────────

  const renderPacking = () => (
    <div className="text-center py-8 space-y-6">
      <div className="text-5xl">🔍</div>
      <h3 className="text-lg font-bold text-zinc-100">Waiting for Miner...</h3>
      <p className="text-sm text-zinc-500">Waiting for block producer to include your transaction</p>
      <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(packingProgress, 100)}%` }}
        />
      </div>
      <p className="text-xs text-zinc-600">{Math.min(Math.round(packingProgress), 100)}%</p>
    </div>
  );

  // ─── Render: Success ───────────────────────────────────────────────

  const renderSuccess = () => {
    if (step.type !== 'success') return null;
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="text-6xl mb-3">✅</div>
          <h3 className="text-xl font-bold text-emerald-400">Transaction Successful!</h3>
          <p className="text-sm text-zinc-500 mt-1">Included in block #{step.block}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-950/60 to-zinc-900 rounded-xl border border-emerald-800/50 p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Operation</span>
            <span className="text-zinc-200">{action}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Gas Price</span>
            <span className="text-zinc-200 font-mono">{totalGwei.toFixed(1)} Gwei</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Gas Used</span>
            <span className="text-zinc-200 font-mono">{gasLimit.toLocaleString()}</span>
          </div>
          <div className="border-t border-emerald-800/50 pt-3 flex justify-between text-sm">
            <span className="text-emerald-400 font-semibold">Total Fee</span>
            <div className="text-right">
              <div className="text-emerald-300 font-mono font-bold">{totalEth} ETH</div>
              <div className="text-emerald-500 text-xs">~${totalUsd}</div>
            </div>
          </div>
          <div className="border-t border-emerald-800/50 pt-3 flex justify-between text-sm">
            <span className="text-zinc-400">Block Height</span>
            <span className="text-zinc-200 font-mono">#{step.block}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Est. Wait Time</span>
            <span className="text-zinc-200 font-mono">{step.waitTime}</span>
          </div>
        </div>

        {/* Transaction Hash */}
        <div className="bg-zinc-800/50 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Transaction Hash</p>
          <p className="text-xs text-zinc-300 font-mono break-all">{step.hash}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              setStep({ type: 'idle' });
              setBroadcastProgress(0);
              setPackingProgress(0);
              setSliderValue(50);
            }}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  };

  // ─── Render: Failed ────────────────────────────────────────────────

  const renderFailed = () => {
    if (step.type !== 'failed') return null;
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="text-6xl mb-3">
            <span className="inline-block animate-bounce">🗑️</span>
          </div>
          <h3 className="text-xl font-bold text-red-400">Transaction Dropped</h3>
          <p className="text-sm text-zinc-500 mt-2">{step.reason}</p>
        </div>

        <div className="bg-red-950/40 rounded-xl border border-red-800/50 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div className="text-sm text-zinc-300">
              <p className="font-semibold text-red-300 mb-1">Why did it fail?</p>
              <p>
                Network competition was high. Your gas price ({totalGwei.toFixed(1)} Gwei) was
                too low — miners prioritized higher-paying transactions.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-zinc-200">💡 Tips</p>
          <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
            <li>Try selecting "⚡ Standard" or "🚀 Fast" tier</li>
            <li>Transact when the network is less busy</li>
            <li>Current Base Fee is {base.toFixed(1)} Gwei — suggest at least Base Fee + 1.5 Gwei</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              setStep({ type: 'idle' });
              setSliderValue(50);
            }}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25"
          >
            🔄 Retry Bidding
          </button>
        </div>
      </div>
    );
  };

  // ─── Main Render ───────────────────────────────────────────────────

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        onClick={step.type === 'idle' ? handleClose : undefined}
      />

      {/* Panel */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[440px] max-w-[92vw] max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors text-xl z-10"
        >
          ✕
        </button>

        <div className="p-6 pt-5">
          {step.type === 'signing' && renderSigning()}
          {step.type === 'broadcasting' && renderBroadcasting()}
          {step.type === 'packing' && renderPacking()}
          {step.type === 'success' && renderSuccess()}
          {step.type === 'failed' && renderFailed()}
          {step.type === 'idle' && renderIdle()}
        </div>
      </div>
    </>
  );
}
