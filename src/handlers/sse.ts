import type { Env } from '../types';

export function handleSSE(request: Request, env: Env): Response {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
        try {
            const endpointEvent = `event: endpoint\ndata: ${JSON.stringify({ url: '/mcp' })}\n\n`;
            await writer.write(encoder.encode(endpointEvent));

            while (true) {
                await new Promise(resolve => setTimeout(resolve, 30000));
                try {
                    await writer.write(encoder.encode(': keepalive\n\n'));
                } catch (e) {
                    break;
                }
            }
        } catch (error) {
            console.error('[SSE] Stream error:', error);
        } finally {
            try {
                await writer.close();
            } catch (e) {
            }
        }
    })();

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
