import type { Env } from './types';
import { handleJsonRpc } from './handlers/jsonrpc';
import { handleSSE } from './handlers/sse';

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        const pathname = url.pathname.endsWith('/') && url.pathname.length > 1
            ? url.pathname.slice(0, -1)
            : url.pathname;

        console.log(`[Worker] Incoming request: ${request.method} ${pathname}`);

        const decodedPath = decodeURIComponent(pathname);

        if (request.method === 'OPTIONS') {
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


        const isMalformedDashboardPath = pathname.includes('%7B%22url%22:%22/mcp%22%7D') ||
            decodedPath.includes('{"url":"/mcp"}');

        if (pathname === '/mcp' || isMalformedDashboardPath) {
            if (request.method === 'GET') {
                return handleSSE(request, env);
            }

            if (request.method === 'POST') {
                return handleJsonRpc(request, env);
            }
        }

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
