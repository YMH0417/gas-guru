import { NextResponse } from 'next/server';

/**
 * Backend proxy to test LLM endpoint reachability.
 *
 * Bypasses browser CORS restrictions by making the request from the server side.
 * Strategy: try /models first (lightweight), then /chat/completions with a minimal message.
 */
export async function POST(request: Request) {
  try {
    const { baseUrl, apiKey, model } = await request.json() as {
      baseUrl?: string;
      apiKey?: string;
      model?: string;
    };

    if (!baseUrl || !model) {
      return NextResponse.json({ error: 'Missing baseUrl or model' }, { status: 400 });
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey && apiKey !== 'none') headers.Authorization = `Bearer ${apiKey}`;

    // Try /models endpoint (lightweight and fast)
    try {
      const modelsRes = await fetch(`${baseUrl}/models`, {
        headers,
        signal: AbortSignal.timeout(5000),
      });
      if (modelsRes.ok) {
        return NextResponse.json({ connected: true });
      }
    } catch {
      // Ignore and try fallback
    }

    // Fallback: try /chat/completions (send a minimal "hi" message)
    try {
      const chatRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 3,
        }),
        signal: AbortSignal.timeout(5000),
      });
      // 200 or 400 both indicate the endpoint is reachable
      if (chatRes.ok || chatRes.status === 400) {
        return NextResponse.json({ connected: true });
      }
      return NextResponse.json({ connected: false }, { status: 502 });
    } catch {
      return NextResponse.json({ connected: false }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ connected: false }, { status: 502 });
  }
}
