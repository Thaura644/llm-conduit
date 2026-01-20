import { NextRequest } from 'next/server';
import { ConduitEngine } from '@/lib/aos/engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const engine = ConduitEngine.getInstance();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            const sendEvent = (event: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            };

            // Send existing events from DB first
            const existingEvents = engine.db.getEvents();
            existingEvents.forEach(sendEvent);

            // Listen for new events
            const handler = (event: any) => {
                sendEvent(event);
            };

            engine.onEvent(handler);

            req.signal.addEventListener('abort', () => {
                engine.offEvent(handler);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
