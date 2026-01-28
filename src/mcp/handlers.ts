import type {
    Env,
    ListProductsInput,
    GetProductInput,
    CreateCartInput,
    GetCartInput,
    UpdateCartItemInput,
    ApplyChatwootTagInput,
    HandoffToHumanInput
} from '../types';
import { listProducts, getProductById, createOrUpdateCart, getCartByConversationId, updateCartItem } from '../db/queries';
import { addChatwootTags, generateProductTags, generateCartTags, handoffToHuman } from '../integrations/chatwoot';
import {
    validateListProductsParams,
    validateProductId,
    validateCreateCartInput,
    validateConversationId,
    validateUpdateCartItemInput
} from '../validation/input-validation';


export async function handleListProducts(params: ListProductsInput, env: Env): Promise<string> {
    try {
        validateListProductsParams(params);
        const result = await listProducts(
            env.DB,
            params.search,
            params.min_price,
            params.max_price,
            params.limit
        );

        if (result.products.length === 0) {
            return JSON.stringify({
                message: 'No products found matching the criteria',
                products: [],
                total: 0
            });
        }

        return JSON.stringify({
            products: result.products,
            total: result.total
        });
    } catch (error) {
        console.error('[list_products] Error:', error);
        throw new Error(`Failed to list products: ${(error as Error).message}`);
    }
}

export async function handleGetProduct(params: GetProductInput, env: Env): Promise<string> {
    try {
        validateProductId(params.product_id);
        const product = await getProductById(env.DB, params.product_id);

        if (!product) {
            return JSON.stringify({
                error: 'Product not found',
                product_id: params.product_id
            });
        }

        return JSON.stringify({ product });
    } catch (error) {
        console.error('[get_product] Error:', error);
        throw new Error(`Failed to get product: ${(error as Error).message}`);
    }
}

export async function handleCreateCart(params: CreateCartInput, env: Env): Promise<string> {
    try {
        validateCreateCartInput(params);
        const cart = await createOrUpdateCart(
            env.DB,
            params.conversation_id,
            params.product_id,
            params.quantity
        );

        const product = await getProductById(env.DB, params.product_id);

        if (product) {
            const tags = [
                ...generateCartTags(),
                ...generateProductTags(product.name)
            ];

            addChatwootTags(params.conversation_id, tags, {
                url: env.CHATWOOT_URL,
                accountId: env.CHATWOOT_ACCOUNT_ID,
                token: env.CHATWOOT_TOKEN
            }).catch(error => {
                console.warn('[create_cart] Failed to add Chatwoot tags:', error);
            });
        }

        return JSON.stringify({
            message: 'Product added to cart successfully',
            cart
        });
    } catch (error) {
        console.error('[create_cart] Error:', error);
        throw new Error(`Failed to create/update cart: ${(error as Error).message}`);
    }
}

export async function handleGetCart(params: GetCartInput, env: Env): Promise<string> {
    try {
        validateConversationId(params.conversation_id);
        const cart = await getCartByConversationId(env.DB, params.conversation_id);
        return JSON.stringify({ cart });
    } catch (error) {
        const errorMessage = (error as Error).message;

        if (errorMessage.includes('not found')) {
            return JSON.stringify({
                message: 'No active cart found for this conversation',
                cart: null
            });
        }

        console.error('[get_cart] Error:', error);
        throw new Error(`Failed to get cart: ${errorMessage}`);
    }
}

export async function handleUpdateCartItem(params: UpdateCartItemInput, env: Env): Promise<string> {
    try {
        validateUpdateCartItemInput(params);
        const cart = await updateCartItem(
            env.DB,
            params.conversation_id,
            params.product_id,
            params.quantity
        );

        const action = params.quantity === 0 ? 'removed from' : 'updated in';

        return JSON.stringify({
            message: `Product ${action} cart successfully`,
            cart
        });
    } catch (error) {
        console.error('[update_cart_item] Error:', error);
        throw new Error(`Failed to update cart item: ${(error as Error).message}`);
    }
}

export async function handleApplyChatwootTag(params: ApplyChatwootTagInput, env: Env): Promise<string> {
    try {
        validateConversationId(params.conversation_id);

        if (!params.tags || params.tags.length === 0) {
            throw new Error('At least one tag is required');
        }

        await addChatwootTags(params.conversation_id, params.tags, {
            url: env.CHATWOOT_URL,
            accountId: env.CHATWOOT_ACCOUNT_ID,
            token: env.CHATWOOT_TOKEN
        });

        return JSON.stringify({
            message: 'Tags applied successfully',
            conversation_id: params.conversation_id,
            tags: params.tags
        });
    } catch (error) {
        console.error('[apply_chatwoot_tag] Error:', error);
        throw new Error(`Failed to apply tags: ${(error as Error).message}`);
    }
}

export async function handleHandoffToHuman(params: HandoffToHumanInput, env: Env): Promise<string> {
    try {
        validateConversationId(params.conversation_id);

        if (!params.reason || params.reason.trim() === '') {
            throw new Error('Handoff reason is required');
        }

        console.log('[handoff_to_human] Config check:', {
            hasUrl: !!env.CHATWOOT_URL,
            hasAccountId: !!env.CHATWOOT_ACCOUNT_ID,
            hasToken: !!env.CHATWOOT_TOKEN,
            url: env.CHATWOOT_URL,
            accountId: env.CHATWOOT_ACCOUNT_ID ? 'SET' : 'MISSING'
        });

        await handoffToHuman(params.conversation_id, params.reason, {
            url: env.CHATWOOT_URL,
            accountId: env.CHATWOOT_ACCOUNT_ID,
            token: env.CHATWOOT_TOKEN
        });

        return JSON.stringify({
            message: 'Conversation handed off to human agent successfully',
            conversation_id: params.conversation_id,
            reason: params.reason
        });
    } catch (error) {
        console.error('[handoff_to_human] Error:', error);
        throw new Error(`Failed to handoff to human: ${(error as Error).message}`);
    }
}

