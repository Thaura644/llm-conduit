import { NextResponse } from 'next/server';
import { ConduitEngine } from '@/lib/aos/engine';

export async function GET() {
    const engine = ConduitEngine.getInstance();
    const autoApprove = engine.db.getSetting('auto_approve') === 'true';
    return NextResponse.json({ autoApprove });
}

export async function POST(req: Request) {
    const { key, value } = await req.json();
    const engine = ConduitEngine.getInstance();
    engine.db.setSetting(key, String(value));
    return NextResponse.json({ success: true });
}
