import { NextRequest, NextResponse } from 'next/server';
import { ConduitDatabase } from '@/lib/aos/db';

export async function DELETE(req: NextRequest) {
    try {
        const { runId } = await req.json();
        const db = new ConduitDatabase(process.cwd());

        // Delete all events with this run_id
        db.deleteSession(runId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
