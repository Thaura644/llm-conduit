import { NextResponse } from 'next/server';
import { ConduitEngine } from '@/lib/aos/engine';
import OpenAI from 'openai';

export async function POST(req: Request) {
    try {
        const { provider, model } = await req.json();
        const engine = ConduitEngine.getInstance();
        const creds = (engine as any).getAgentCredentials(model || 'gpt-4o-mini');

        if (!creds.apiKey) {
            return NextResponse.json({ success: false, error: `No API key found for ${provider}` }, { status: 400 });
        }

        const openai = new OpenAI({
            apiKey: creds.apiKey,
            baseURL: creds.baseUrl || 'https://openrouter.ai/api/v1',
            defaultHeaders: {
                'X-Title': 'LLM-Conduit Health Check',
            }
        });

        const startTime = Date.now();
        const completion = await openai.chat.completions.create({
            model: model || 'google/gemini-2.0-flash-exp:free',
            messages: [{ role: 'user', content: 'healthcheck' }],
            max_tokens: 5
        });
        const latency = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            message: 'Connection established',
            latency: `${latency}ms`,
            response: completion.choices[0].message.content
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
