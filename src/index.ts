import type { Env } from './types';
import {
    handleListProducts,
    handleGetProduct,
    handleCreateCart,
    handleGetCart,
    handleUpdateCartItem
} from './mcp/handlers';

interface MCPRequest {
    method: string;
    params?: {
        name?: string;
        arguments?: Record<string, unknown>;
    };
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === '/health') {
            return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (url.pathname === '/mcp' && request.method === 'POST') {
            try {
                const body = await request.json() as MCPRequest;

                if (body.method === 'tools/list') {
                    const tools = [
                        {
                            name: 'list_products',
                            description: 'Search and list products from the catalog with optional filters',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    search: { type: 'string' },
                                    min_price: { type: 'number' },
                                    max_price: { type: 'number' },
                                    limit: { type: 'number', default: 50 }
                                }
                            }
                        },
                        {
                            name: 'get_product',
                            description: 'Get detailed information about a specific product by ID',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    product_id: { type: 'string' }
                                },
                                required: ['product_id']
                            }
                        },
                        {
                            name: 'create_cart',
                            description: 'Create a cart or add a product to an existing cart for a conversation',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    conversation_id: { type: 'string' },
                                    product_id: { type: 'string' },
                                    quantity: { type: 'number', minimum: 1 }
                                },
                                required: ['conversation_id', 'product_id', 'quantity']
                            }
                        },
                        {
                            name: 'get_cart',
                            description: 'Retrieve the current cart with all items for a conversation',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    conversation_id: { type: 'string' }
                                },
                                required: ['conversation_id']
                            }
                        },
                        {
                            name: 'update_cart_item',
                            description: 'Update quantity of a product in the cart or remove it if quantity is 0',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    conversation_id: { type: 'string' },
                                    product_id: { type: 'string' },
                                    quantity: { type: 'number', minimum: 0 }
                                },
                                required: ['conversation_id', 'product_id', 'quantity']
                            }
                        }
                    ];

                    return new Response(JSON.stringify({ tools }), {
                        headers: { 'Content-Type': 'application/json' }
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
                        default:
                            throw new Error(`Unknown tool: ${toolName}`);
                    }

                    return new Response(JSON.stringify({
                        content: [{ type: 'text', text: result }]
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                return new Response(JSON.stringify({ error: 'Unknown method' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error) {
                console.error('[Worker] Error:', error);
                return new Response(JSON.stringify({
                    error: 'Internal server error',
                    message: (error as Error).message
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response(JSON.stringify({
            error: 'Not found',
            available_endpoints: ['/health', '/mcp']
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    },
};
