import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getGasInfo } from '@/lib/eth';

/** Fallback reply when AI service is unavailable */
const DEFAULT_REPLY =
  'Current gas fees are moderate, with a standard transfer costing about $0.50. If you are not in a hurry, you can wait a bit to see if fees drop further.';

/** System prompt: constrains AI to respond in concise English, without reasoning steps */
const SYSTEM_PROMPT =
  'You are a blockchain expert who explains technical concepts in plain English. Explain the current Ethereum gas fee situation and provide transaction advice. Keep the answer concise, no more than 3 sentences. Do not include reasoning steps, thought tags, or meta-commentary.';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = (body.action as string) || '普通转账';
    const llmBaseUrl = body.llmBaseUrl as string | undefined;
    const llmApiKey = body.llmApiKey as string | undefined;
    const llmModel = body.llmModel as string | undefined;

    // Fetch gas data
    const gasInfo = await getGasInfo();
    const { baseFee, priorityFee, chain } = gasInfo;

    // Determine action type for gas limit estimation
    let actionKey: 'transfer' | 'nft' | 'swap';
    if (action.includes('nft') || action.includes('NFT')) {
      actionKey = 'nft';
    } else if (action.includes('contract') || action.includes('合约')) {
      actionKey = 'swap';
    } else {
      actionKey = 'transfer';
    }
    const gasLimit = chain.gasEstimates[actionKey];
    const totalGwei = baseFee + priorityFee;
    const totalEth = (gasLimit * totalGwei * 1e-9).toFixed(8);
    const totalUsd = (gasLimit * totalGwei * 1e-9 * chain.tokenPrice).toFixed(2);

    const userPrompt =
      `Ethereum mainnet gas: Base Fee ${baseFee} Gwei, Priority Fee ${priorityFee} Gwei.\n` +
      `Action: ${action}, Estimated Gas: ${gasLimit.toLocaleString()}.\n` +
      `Estimated Cost: ${totalEth} ${chain.symbol} (~$${totalUsd}).\n\n` +
      `Please tell me:\n` +
      `1. Is the network congested or idle?\n` +
      `2. How much will this operation cost in USD?\n` +
      `3. Should I transact now or wait?`;

    // Build LLM endpoint config (priority: frontend > env var > default)
    const baseUrl = llmBaseUrl || process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
    const apiKey = llmApiKey || process.env.LLM_API_KEY || 'default-key';
    const model = llmModel || process.env.LLM_MODEL || 'gpt-4o-mini';

    const openai = new OpenAI({ baseURL: baseUrl, apiKey });

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const choice = completion.choices?.[0];
    if (!choice || !choice.message?.content) {
      console.warn('⚠️ AI returned empty response');
      return NextResponse.json({ reply: DEFAULT_REPLY });
    }

    // Clean up potential reasoning tags
    let reply = choice.message.content.trim()
      .replace(/(?:思考过程|Thought\s*Process|Reasoning)[：:]?.*/gi, '')
      .replace(/(?:最终答案|Final\s*Answer|Output)[：:]?\s*/gi, '')
      .replace(/^[\s\-_*]+|[\s\-_*]+$/g, '')
      .trim();

    return NextResponse.json({ reply: reply || DEFAULT_REPLY });
  } catch (err) {
    const message = (err as Error).message;
    console.error('❌ AI explanation failed:', message);
    return NextResponse.json(
      { reply: `AI service temporarily unavailable: ${message.includes('network') || message.includes('fetch') ? 'Network connection failed, please check LLM endpoint config' : message}` },
    );
  }
}
