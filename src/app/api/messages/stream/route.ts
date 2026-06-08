import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getEmitter } from '@/lib/events';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.status !== 'approved') {
    return new Response('unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  const emitter = getEmitter();
  let closed = false;

  const handler = (event: any) => {
    // Will be called by emitter; we can't enqueue here directly
  };

  const stream = new ReadableStream({
    start(controller) {
      const onEvent = (event: any) => {
        if (closed) return;
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          closed = true;
        }
      };

      emitter.on(user.personId, onEvent);

      // Heartbeat every 15s
      const heartbeat = setInterval(() => {
        if (closed) { clearInterval(heartbeat); return; }
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          closed = true;
          clearInterval(heartbeat);
        }
      }, 15000);

      // Cleanup on abort
      req.signal.addEventListener('abort', () => {
        closed = true;
        emitter.off(user.personId, onEvent);
        clearInterval(heartbeat);
        try { controller.close(); } catch {}
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
