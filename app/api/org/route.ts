import { NextResponse } from 'next/server';
import { ConduitEngine } from '@/lib/aos/engine';

export async function GET() {
    const engine = ConduitEngine.getInstance();
    const roles = engine.db.getRoles();
    return NextResponse.json(roles);
}

export async function POST(req: Request) {
    const role = await req.json();
    const engine = ConduitEngine.getInstance();
    engine.db.saveRole(role);
    // Re-init engine to pick up role changes (in a real app, this might be more targeted)
    await engine.init('');
    return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
    const { role } = await req.json();
    const engine = ConduitEngine.getInstance();
    engine.db.deleteRole(role);
    await engine.init('');
    return NextResponse.json({ success: true });
}
