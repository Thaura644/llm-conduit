import { NextResponse } from 'next/server';
import { ConduitEngine } from '@/lib/aos/engine';

export async function POST(req: Request) {
    const body = await req.json();
    const proposal_id = body.proposal_id || body.proposalId;
    const decision = body.decision;
    const engine = ConduitEngine.getInstance();
    await engine.makeDecision(proposal_id, decision);
    return NextResponse.json({ success: true });
}
