import { NextResponse } from 'next/server';
import { ConduitEngine } from '@/lib/aos/engine';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    const engine = ConduitEngine.getInstance();
    const records = engine.db.getRecords();
    return NextResponse.json(records);
}

export async function POST(req: Request) {
    const { category, content, id } = await req.json();
    const engine = ConduitEngine.getInstance();
    engine.db.addRecord({
        id: id || uuidv4(),
        category,
        content
    });
    return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
    const { id } = await req.json();
    const engine = ConduitEngine.getInstance();
    engine.db.deleteRecord(id);
    return NextResponse.json({ success: true });
}
