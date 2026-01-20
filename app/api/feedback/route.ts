import { NextResponse } from 'next/server';
import { ConduitEngine } from '@/lib/aos/engine';

export async function POST(req: Request) {
    try {
        const { feedback, runId } = await req.json();
        const engine = ConduitEngine.getInstance();
        await engine.submitFeedback(feedback, runId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
