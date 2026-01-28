import type { Env } from '../types';
import {
    handleListProducts,
    handleGetProduct,
    handleCreateCart,
    handleGetCart,
    handleUpdateCartItem,
    handleApplyChatwootTag,
    handleHandoffToHuman
} from '../mcp/handlers';
import {
    LIST_PRODUCTS_TOOL,
    GET_PRODUCT_TOOL,
    CREATE_CART_TOOL,
    GET_CART_TOOL,
    UPDATE_CART_ITEM_TOOL,
    APPLY_CHATWOOT_TAG_TOOL,
    HANDOFF_TO_HUMAN_TOOL
} from '../mcp/tools';

interface MCPRequest {
    jsonrpc: string;
    id?: number | string;
    method: string;
    params?: {
        name?: string;
        arguments?: Record<string, unknown>;
    };
}

export async function handleJsonRpc(request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json() as MCPRequest;
        const { id, method } = body;

        // Helper to construct success response
        const success = (result: any) => {
            return new Response(JSON.stringify({
                jsonrpc: "2.0",
                id: id ?? null,
                result
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        };

        // Helper to construct error response
        const errorRes = (code: number, message: string, data?: any) => {
            return new Response(JSON.stringify({
                jsonrpc: "2.0",
                id: id ?? null,
                error: {
                    code,
                    message,
                    data
                }
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        };

        if (method === 'initialize') {
            return success({
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: {}
                },
                serverInfo: {
                    name: "laburen-ai-agent-challenge",
                    version: "1.0.0"
                }
            });
        }

        if (method === 'notifications/initialized') {
            // Notifications don't need a response if no ID, but if ID is present we send one
            // Sending empty success result is safe
            if (id !== undefined) {
                return success({});
            }
            // 204 No Content for notifications
            return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        if (method === 'tools/list') {
            const tools = [
                LIST_PRODUCTS_TOOL,
                GET_PRODUCT_TOOL,
                CREATE_CART_TOOL,
                GET_CART_TOOL,
                UPDATE_CART_ITEM_TOOL,
                APPLY_CHATWOOT_TAG_TOOL,
                HANDOFF_TO_HUMAN_TOOL
            ];
            return success({ tools });
        }

        if (method === 'tools/call') {
            const toolName = body.params?.name;
            const toolParams = body.params?.arguments || {};

            let result: string;

            switch (toolName) {
                case 'list_products':
                    result = await handleListProducts(toolParams as any, env);
                    break;
                case 'get_product':
                    result = await handleGetProduct(toolParams as any, env);
                    break;
                case 'create_cart':
                    result = await handleCreateCart(toolParams as any, env);
                    break;
                case 'get_cart':
                    result = await handleGetCart(toolParams as any, env);
                    break;
                case 'update_cart_item':
                    result = await handleUpdateCartItem(toolParams as any, env);
                    break;
                case 'apply_chatwoot_tag':
                    result = await handleApplyChatwootTag(toolParams as any, env);
                    break;
                case 'handoff_to_human':
                    result = await handleHandoffToHuman(toolParams as any, env);
                    break;
                default:
                    return errorRes(-32601, `Unknown tool: ${toolName}`);
            }

            return success({
                content: [{ type: 'text', text: result }]
            });
        }

        console.log(`[JSON-RPC] Unknown method received: ${method}`);
        return errorRes(-32601, 'Method not found', { method });

    } catch (error) {
        console.error('[JSON-RPC] Error:', error);
        return new Response(JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: {
                code: -32603,
                message: 'Internal error',
                data: (error as Error).message
            }
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
