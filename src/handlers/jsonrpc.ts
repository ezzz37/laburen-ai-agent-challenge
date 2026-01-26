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
    method: string;
    params?: {
        name?: string;
        arguments?: Record<string, unknown>;
    };
}

export async function handleJsonRpc(request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json() as MCPRequest;

        if (body.method === 'initialize') {
            return new Response(JSON.stringify({
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: {}
                },
                serverInfo: {
                    name: "laburen-ai-agent-challenge",
                    version: "1.0.0"
                }
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        if (body.method === 'notifications/initialized') {
            return new Response(JSON.stringify({}), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        if (body.method === 'tools/list') {
            const tools = [
                LIST_PRODUCTS_TOOL,
                GET_PRODUCT_TOOL,
                CREATE_CART_TOOL,
                GET_CART_TOOL,
                UPDATE_CART_ITEM_TOOL,
                APPLY_CHATWOOT_TAG_TOOL,
                HANDOFF_TO_HUMAN_TOOL
            ];

            return new Response(JSON.stringify({ tools }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        if (body.method === 'tools/call') {
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
                    throw new Error(`Unknown tool: ${toolName}`);
            }

            return new Response(JSON.stringify({
                content: [{ type: 'text', text: result }]
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        console.log(`[JSON-RPC] Unknown method received: ${body.method}`);
        return new Response(JSON.stringify({ error: 'Unknown method', method: body.method }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('[JSON-RPC] Error:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: (error as Error).message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
