import { NextRequest, NextResponse } from 'next/server';
import { ConduitEngine } from '@/lib/aos/engine';

export async function POST(req: NextRequest) {
    try {
        const engine = ConduitEngine.getInstance();
        await engine.initializeAgents();

        return NextResponse.json({
            success: true,
            message: 'Agents reloaded successfully'
        });
    } catch (error: any) {
        console.error('Error reloading agents:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
