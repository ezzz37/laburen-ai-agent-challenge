export const TOOLS_DEFINITIONS = {
    list_products: {
        name: 'list_products',
        description: 'Search and list products from the catalog with optional filters',
        inputSchema: {
            type: 'object',
            properties: {
                search: {
                    type: 'string',
                    description: 'Search term to filter products by name or description'
                },
                min_price: {
                    type: 'number',
                    description: 'Minimum price filter',
                    minimum: 0
                },
                max_price: {
                    type: 'number',
                    description: 'Maximum price filter',
                    minimum: 0
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of products to return',
                    default: 50,
                    minimum: 1,
                    maximum: 100
                }
            }
        }
    },
    get_product: {
        name: 'get_product',
        description: 'Get detailed information about a specific product by ID',
        inputSchema: {
            type: 'object',
            properties: {
                product_id: {
                    type: 'string',
                    description: 'Unique identifier of the product'
                }
            },
            required: ['product_id']
        }
    },
    create_cart: {
        name: 'create_cart',
        description: 'Create a cart or add a product to an existing cart for a conversation',
        inputSchema: {
            type: 'object',
            properties: {
                conversation_id: {
                    type: 'string',
                    description: 'Chatwoot conversation ID'
                },
                product_id: {
                    type: 'string',
                    description: 'Product ID to add to cart'
                },
                quantity: {
                    type: 'number',
                    description: 'Quantity of the product to add',
                    minimum: 1,
                    default: 1
                }
            },
            required: ['conversation_id', 'product_id', 'quantity']
        }
    },
    get_cart: {
        name: 'get_cart',
        description: 'Retrieve the current cart with all items for a conversation',
        inputSchema: {
            type: 'object',
            properties: {
                conversation_id: {
                    type: 'string',
                    description: 'Chatwoot conversation ID'
                }
            },
            required: ['conversation_id']
        }
    },
    update_cart_item: {
        name: 'update_cart_item',
        description: 'Update quantity of a product in the cart or remove it if quantity is 0',
        inputSchema: {
            type: 'object',
            properties: {
                conversation_id: {
                    type: 'string',
                    description: 'Chatwoot conversation ID'
                },
                product_id: {
                    type: 'string',
                    description: 'Product ID to update'
                },
                quantity: {
                    type: 'number',
                    description: 'New quantity (0 to remove the item)',
                    minimum: 0
                }
            },
            required: ['conversation_id', 'product_id', 'quantity']
        }
    },
    apply_chatwoot_tag: {
        name: 'apply_chatwoot_tag',
        description: 'Apply tags to a Chatwoot conversation for categorization and tracking',
        inputSchema: {
            type: 'object',
            properties: {
                conversation_id: {
                    type: 'string',
                    description: 'Chatwoot conversation ID'
                },
                tags: {
                    type: 'array',
                    description: 'Array of tags to apply to the conversation',
                    items: {
                        type: 'string'
                    },
                    minItems: 1
                }
            },
            required: ['conversation_id', 'tags']
        }
    },
    handoff_to_human: {
        name: 'handoff_to_human',
        description: 'Transfer the conversation to a human agent with context and reason',
        inputSchema: {
            type: 'object',
            properties: {
                conversation_id: {
                    type: 'string',
                    description: 'Chatwoot conversation ID'
                },
                reason: {
                    type: 'string',
                    description: 'Reason for handoff (e.g., "complex_query", "payment_issue", "customer_request")'
                }
            },
            required: ['conversation_id', 'reason']
        }
    }
};
