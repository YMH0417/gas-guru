import { NextResponse } from 'next/server';
import { getGasInfo } from '@/lib/eth';

/**
 * GET /api/gas-fees
 *
 * Returns current Ethereum mainnet gas fee data.
 * Automatically fetches latest data from multiple public RPC endpoints with failover.
 */
export async function GET() {
  try {
    const gasInfo = await getGasInfo();

    return NextResponse.json({
      chain: {
        id: gasInfo.chain.id,
        name: gasInfo.chain.name,
        symbol: gasInfo.chain.symbol,
        color: gasInfo.chain.color,
        description: gasInfo.chain.description,
        blockTime: gasInfo.chain.blockTime,
      },
      baseFee: gasInfo.baseFee,
      priorityFee: gasInfo.priorityFee,
      estimatedCost: gasInfo.estimatedCost,
    });
  } catch (err) {
    const message = (err as Error).message || 'RPC call failed';
    console.error('❌ Failed to fetch gas data:', message);
    return NextResponse.json(
      { error: 'Failed to fetch gas data', message },
      { status: 500 }
    );
  }
}
