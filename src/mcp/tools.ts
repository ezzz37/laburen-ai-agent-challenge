export const LIST_PRODUCTS_TOOL = {
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
} as const;

export const GET_PRODUCT_TOOL = {
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
} as const;

export const CREATE_CART_TOOL = {
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
} as const;

export const GET_CART_TOOL = {
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
} as const;

export const UPDATE_CART_ITEM_TOOL = {
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
} as const;

export const APPLY_CHATWOOT_TAG_TOOL = {
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
} as const;

export const HANDOFF_TO_HUMAN_TOOL = {
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
} as const;

export const TOOLS_DEFINITIONS = {
    list_products: LIST_PRODUCTS_TOOL,
    get_product: GET_PRODUCT_TOOL,
    create_cart: CREATE_CART_TOOL,
    get_cart: GET_CART_TOOL,
    update_cart_item: UPDATE_CART_ITEM_TOOL,
    apply_chatwoot_tag: APPLY_CHATWOOT_TAG_TOOL,
    handoff_to_human: HANDOFF_TO_HUMAN_TOOL
} as const;
