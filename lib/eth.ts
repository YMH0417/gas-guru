/**
 * Ethereum RPC Call Utilities
 *
 * Uses public RPC endpoints (no API Key required) with automatic failover.
 *
 * Call chain:
 *   getGasInfo() → fetchGasFees() → fetchWithFallback() → tryRpcUrl(url) × N
 */

import { getChain, getAllRpcUrls, type ChainConfig } from './chains';

// ─── Raw RPC Calls ─────────────────────────────────────────────────────

/** Try to fetch feeHistory via a single RPC endpoint; returns null on failure */
async function tryRpcUrl(url: string): Promise<{
  baseFeePerGas: string[];
  reward?: string[][];
} | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_feeHistory',
        params: ['0x5', 'latest', [50]],
        id: 1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    // HTTP error (401, 500, etc.)
    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errData = await response.json();
        if (errData?.error?.message) errorMsg = errData.error.message;
      } catch { /* ignore */ }
      console.warn(`⚠️ RPC unavailable (${url}): ${errorMsg}`);
      return null;
    }

    const data = await response.json();
    if (data.error) {
      console.warn(`⚠️ RPC error (${url}): ${data.error.message}`);
      return null;
    }

    const feeHistory = data.result as { baseFeePerGas: string[]; reward?: string[][] };
    if (!feeHistory?.baseFeePerGas || feeHistory.baseFeePerGas.length === 0) {
      console.warn(`⚠️ RPC returned empty data (${url})`);
      return null;
    }

    return feeHistory;
  } catch (err) {
    clearTimeout(timer);
    console.warn(`⚠️ RPC request failed (${url}): ${(err as Error).message}`);
    return null;
  }
}

/** Parse feeHistory into Gwei numbers */
function parseFeeHistory(feeHistory: { baseFeePerGas: string[]; reward?: string[][] }): {
  baseFee: number;
  priorityFee: number;
} {
  const GWEI = BigInt('1000000000');

  const baseFeeWei = BigInt(feeHistory.baseFeePerGas[0]);
  const baseFee = Number(baseFeeWei / GWEI);

  let priorityFee = 1;
  if (feeHistory.reward?.[0]?.[0]) {
    priorityFee = Number(BigInt(feeHistory.reward[0][0]) / GWEI);
    if (priorityFee < 0.01) priorityFee = 1;
  }

  return { baseFee, priorityFee };
}

/** Try endpoints sequentially until one succeeds; throws if all fail */
async function fetchWithFallback(): Promise<{ baseFee: number; priorityFee: number }> {
  const urls = getAllRpcUrls();

  for (const url of urls) {
    const feeHistory = await tryRpcUrl(url);
    if (feeHistory) return parseFeeHistory(feeHistory);
  }

  throw new Error(`All ${urls.length} RPC endpoints are unavailable. Ethereum network may be congested.`);
}

// ─── Public API ────────────────────────────────────────────────────────

/** Get Base Fee + Priority Fee */
async function fetchGasFees(): Promise<{ baseFee: number; priorityFee: number }> {
  const chain = getChain('ethereum');
  if (!chain) throw new Error('Chain config not found');
  return fetchWithFallback();
}

/**
 * Get complete gas info (including transfer / NFT / swap cost estimates).
 * This is the only exported function; API routes call this exclusively.
 */
export async function getGasInfo(): Promise<{
  baseFee: number;
  priorityFee: number;
  chain: ChainConfig;
  estimatedCost: {
    transfer: { eth: string; usd: string };
    nft: { eth: string; usd: string };
    swap: { eth: string; usd: string };
  };
}> {
  const chain = getChain('ethereum');
  if (!chain) throw new Error('Chain config not found');

  const { baseFee, priorityFee } = await fetchGasFees();
  const totalGwei = baseFee + priorityFee;

  // gasLimit × totalGwei × 1e-9 = ETH cost, × tokenPrice = USD cost
  const calcCost = (gasLimit: number) => ({
    eth: (gasLimit * totalGwei * 1e-9).toFixed(8),
    usd: (gasLimit * totalGwei * 1e-9 * chain.tokenPrice).toFixed(4),
  });

  return {
    baseFee,
    priorityFee,
    chain,
    estimatedCost: {
      transfer: calcCost(chain.gasEstimates.transfer),
      nft: calcCost(chain.gasEstimates.nft),
      swap: calcCost(chain.gasEstimates.swap),
    },
  };
}
