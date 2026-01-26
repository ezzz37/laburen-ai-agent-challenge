import type { Env } from './types';
import { handleJsonRpc } from './handlers/jsonrpc';
import { handleSSE } from './handlers/sse';

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        // Normalize path (remove trailing slash)
        const pathname = url.pathname.endsWith('/') && url.pathname.length > 1
            ? url.pathname.slice(0, -1)
            : url.pathname;

        console.log(`[Worker] Incoming request: ${request.method} ${pathname}`);

        // CORS Preflight - GLOBAL
        if (request.method === 'OPTIONS') {
            console.log('[Worker] Handling OPTIONS request');
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                    'Access-Control-Max-Age': '86400',
                }
            });
        }

        if (pathname === '/health') {
            return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        if (pathname === '/mcp') {
            if (request.method === 'GET') {
                console.log('[Worker] Routing to SSE handler');
                return handleSSE(request, env);
            }

            if (request.method === 'POST') {
                console.log('[Worker] Routing to JSON-RPC handler');
                return handleJsonRpc(request, env);
            }
        }

        console.log(`[Worker] Root 404 hit. Path: ${pathname}, Method: ${request.method}`);

        return new Response(JSON.stringify({
            error: 'Not found',
            available_endpoints: ['/health', '/mcp']
        }), {
            status: 404,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    },
};
