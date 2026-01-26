import { ListProductsInput, CreateCartInput, UpdateCartItemInput } from '../types';

export function validateListProductsParams(params: ListProductsInput): void {
    if (params.min_price !== undefined && params.min_price < 0) {
        throw new Error('min_price must be non-negative');
    }
    if (params.max_price !== undefined && params.max_price < 0) {
        throw new Error('max_price must be non-negative');
    }
    if (params.min_price !== undefined && params.max_price !== undefined && params.min_price > params.max_price) {
        throw new Error('min_price cannot be greater than max_price');
    }
    if (params.limit !== undefined) {
        if (params.limit <= 0) throw new Error('limit must be positive');
        if (params.limit > 100) throw new Error('limit cannot exceed 100');
    }
    if (params.search) {
        if (params.search.length > 255) throw new Error('search string too long');
        if (params.search.match(/['";]/)) {
            throw new Error('Invalid characters in search string');
        }
    }
}

export function validateProductId(productId: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!productId || !uuidRegex.test(productId)) {
        throw new Error('Invalid product_id format (must be UUID)');
    }
}

export function validateQuantity(quantity: number): void {
    if (typeof quantity !== 'number') throw new Error('quantity must be a number');
    if (quantity < 0) throw new Error('quantity cannot be negative');
    if (!Number.isInteger(quantity)) throw new Error('quantity must be an integer');
    if (quantity > 1000) throw new Error('quantity too large');
}

export function validateConversationId(conversationId: string): void {
    if (!conversationId) throw new Error('conversation_id is required');
    if (conversationId.length > 255) throw new Error('conversation_id too long');
    if (!/^[a-z0-9_-]+$/i.test(conversationId)) {
        throw new Error('conversation_id contains invalid characters');
    }
}

export function validateCreateCartInput(input: CreateCartInput): void {
    validateConversationId(input.conversation_id);
    validateProductId(input.product_id);
    validateQuantity(input.quantity);
}

export function validateUpdateCartItemInput(input: UpdateCartItemInput): void {
    validateConversationId(input.conversation_id);
    validateProductId(input.product_id);
    validateQuantity(input.quantity);
}
