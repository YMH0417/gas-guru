/**
 * Chain Configuration
 *
 * Currently only Ethereum mainnet is supported. Public RPC endpoint list is sorted by stability.
 * All endpoints are free and require no API Key.
 *
 * Note: Several public endpoints now require API keys or have rate limits:
 *   - Ankr (rpc.ankr.com): requires API Key → removed
 *   - Merkle (eth.merkle.io): requires API Key → removed
 *   - 1rpc (1rpc.io/eth): strict public rate limiting → removed
 *   - Llama (eth.llamarpc.com): Cloudflare blocking → removed
 */

export interface ChainConfig {
  id: string;
  name: string;
  symbol: string;
  color: string;
  gasEstimates: { transfer: number; nft: number; swap: number };
  tokenPrice: number;
  blockTime: string;
  description: string;
}

// ─── Public RPC Endpoints ──────────────────────────────────────────────

/**
 * Stable public RPC endpoints (no API Key required).
 * eth.ts will try these endpoints in order and auto-failover on 401/timeout/error.
 */
const RPC_URLS: string[] = [
  'https://ethereum-rpc.publicnode.com',  // publicnode: most stable
  'https://eth.drpc.org',                  // drpc: stable
  'https://rpc.flashbots.net',             // flashbots: stable
];

// ─── Chain Config ──────────────────────────────────────────────────────

export const CHAINS: ChainConfig[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    color: '#627eea',
    description: 'Ethereum mainnet — the most decentralized and secure smart contract platform.',
    blockTime: '~12 sec',
    tokenPrice: 3200,
    gasEstimates: { transfer: 21000, nft: 80000, swap: 150000 },
  },
];

// ─── Public Functions ──────────────────────────────────────────────────

/** Get chain config by chain ID */
export function getChain(id: string): ChainConfig | undefined {
  return CHAINS.find((c) => c.id === id);
}

/** Return all RPC endpoints for eth.ts failover */
export function getAllRpcUrls(): string[] {
  return RPC_URLS;
}
