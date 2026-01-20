import { NextResponse } from 'next/server';
import { ConduitEngine } from '@/lib/aos/engine';

export async function GET() {
    const engine = ConduitEngine.getInstance();
    const keys = engine.db.getApiKeys();
    return NextResponse.json(keys);
}

export async function POST(req: Request) {
    const { provider, key, base_url } = await req.json();
    const engine = ConduitEngine.getInstance();
    engine.db.saveApiKey(provider, key, base_url);
    // Re-init engine to pick up key changes
    await engine.init('');
    return NextResponse.json({ success: true });
}
