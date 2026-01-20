import { NextRequest, NextResponse } from 'next/server';
import { ConduitEngine } from '@/lib/aos/engine';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const { goal } = await req.json();
        const engine = ConduitEngine.getInstance();

        // Ensure engine is initialized
        if (engine.agents.length === 0) {
            await engine.init(path.join(process.cwd(), 'orgfile.yaml'));
        }

        const runId = await engine.submitGoal(goal);
        return NextResponse.json({ success: true, runId });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
