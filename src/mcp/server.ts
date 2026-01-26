import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Env } from '../types';
import {
    LIST_PRODUCTS_TOOL,
    GET_PRODUCT_TOOL,
    CREATE_CART_TOOL,
    GET_CART_TOOL,
    UPDATE_CART_ITEM_TOOL,
    APPLY_CHATWOOT_TAG_TOOL,
    HANDOFF_TO_HUMAN_TOOL
} from './tools';
import {
    handleListProducts,
    handleGetProduct,
    handleCreateCart,
    handleGetCart,
    handleUpdateCartItem,
    handleApplyChatwootTag,
    handleHandoffToHuman
} from './handlers';

import {
    LIST_PRODUCTS_TOOL,
    GET_PRODUCT_TOOL,
    CREATE_CART_TOOL,
    GET_CART_TOOL,
    UPDATE_CART_ITEM_TOOL,
    APPLY_CHATWOOT_TAG_TOOL,
    HANDOFF_TO_HUMAN_TOOL
} from './tools';

export function createMCPServer(env: Env): Server {
    const server = new Server(
        {
            name: 'laburen-sales-agent',
            version: '1.0.0',
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                LIST_PRODUCTS_TOOL,
                GET_PRODUCT_TOOL,
                CREATE_CART_TOOL,
                GET_CART_TOOL,
                UPDATE_CART_ITEM_TOOL,
                APPLY_CHATWOOT_TAG_TOOL,
                HANDOFF_TO_HUMAN_TOOL
            ]
        };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: params } = request.params;

        try {
            switch (name) {
                case 'list_products':
                    return {
                        content: [{
                            type: 'text',
                            text: await handleListProducts(params as any, env)
                        }]
                    };

                case 'get_product':
                    return {
                        content: [{
                            type: 'text',
                            text: await handleGetProduct(params as any, env)
                        }]
                    };

                case 'create_cart':
                    return {
                        content: [{
                            type: 'text',
                            text: await handleCreateCart(params as any, env)
                        }]
                    };

                case 'get_cart':
                    return {
                        content: [{
                            type: 'text',
                            text: await handleGetCart(params as any, env)
                        }]
                    };

                case 'update_cart_item':
                    return {
                        content: [{
                            type: 'text',
                            text: await handleUpdateCartItem(params as any, env)
                        }]
                    };

                case 'apply_chatwoot_tag':
                    return {
                        content: [{
                            type: 'text',
                            text: await handleApplyChatwootTag(params as any, env)
                        }]
                    };

                case 'handoff_to_human':
                    return {
                        content: [{
                            type: 'text',
                            text: await handleHandoffToHuman(params as any, env)
                        }]
                    };

                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        } catch (error) {
            const errorMessage = (error as Error).message;
            console.error(`[MCP Server] Tool ${name} failed:`, errorMessage);

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        error: errorMessage,
                        tool: name
                    })
                }],
                isError: true
            };
        }
    });

    return server;
}

export async function runMCPServer(env: Env): Promise<void> {
    const server = createMCPServer(env);
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.log('[MCP Server] Started successfully');
}
