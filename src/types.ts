export interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    created_at: string;
}

export interface Cart {
    id: string;
    conversation_id: string;
    created_at: string;
    updated_at: string;
}

export interface CartItem {
    id: string;
    cart_id: string;
    product_id: string;
    quantity: number;
    added_at: string;
}

export interface ListProductsInput {
    search?: string;
    min_price?: number;
    max_price?: number;
    limit?: number;
}

export interface GetProductInput {
    product_id: string;
}

export interface CreateCartInput {
    conversation_id: string;
    product_id: string;
    quantity: number;
}

export interface GetCartInput {
    conversation_id: string;
}

export interface UpdateCartItemInput {
    conversation_id: string;
    product_id: string;
    quantity: number;
}

export interface ApplyChatwootTagInput {
    conversation_id: string;
    tags: string[];
}

export interface HandoffToHumanInput {
    conversation_id: string;
    reason: string;
}

export interface ProductListResult {
    products: Product[];
    total: number;
}

export interface CartWithItems {
    cart: Cart;
    items: Array<{
        product: Product;
        quantity: number;
        subtotal: number;
    }>;
    total: number;
}

export interface ChatwootConfig {
    url: string;
    accountId: string;
    token: string;
}

export interface ChatwootTagRequest {
    conversationId: string;
    tags: string[];
}

export interface Env {
    DB: D1Database;
    CHATWOOT_URL: string;
    CHATWOOT_ACCOUNT_ID: string;
    CHATWOOT_TOKEN: string;
}

export class ProductNotFoundError extends Error {
    constructor(productId: string) {
        super(`Product with ID ${productId} not found`);
        this.name = 'ProductNotFoundError';
    }
}

export class InsufficientStockError extends Error {
    constructor(productId: string, requested: number, available: number) {
        super(`Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`);
        this.name = 'InsufficientStockError';
    }
}

export class CartNotFoundError extends Error {
    constructor(conversationId: string) {
        super(`Cart not found for conversation ${conversationId}`);
        this.name = 'CartNotFoundError';
    }
}
