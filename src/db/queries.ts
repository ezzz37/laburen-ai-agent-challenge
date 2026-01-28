import type { Product, Cart, CartItem, CartWithItems, ProductListResult } from '../types';

export async function listProducts(
    db: D1Database,
    search?: string,
    minPrice?: number,
    maxPrice?: number,
    limit: number = 50
): Promise<ProductListResult> {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: (string | number)[] = [];

    if (search) {
        query += ' AND (name LIKE ? OR description LIKE ?)';
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
    }

    if (minPrice !== undefined) {
        query += ' AND price >= ?';
        params.push(minPrice);
    }

    if (maxPrice !== undefined) {
        query += ' AND price <= ?';
        params.push(maxPrice);
    }

    query += ' ORDER BY name ASC LIMIT ?';
    params.push(limit);

    const result = await db.prepare(query).bind(...params).all<Product>();

    return {
        products: result.results || [],
        total: result.results?.length || 0
    };
}

export async function getProductById(db: D1Database, productId: string): Promise<Product | null> {
    const result = await db
        .prepare('SELECT * FROM products WHERE id = ?')
        .bind(productId)
        .first<Product>();

    return result;
}

export async function createOrUpdateCart(
    db: D1Database,
    conversationId: string,
    productId: string,
    quantity: number
): Promise<CartWithItems> {
    const product = await getProductById(db, productId);

    if (!product) {
        throw new Error(`Product ${productId} not found`);
    }

    if (product.stock < quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`);
    }

    let cart = await db
        .prepare('SELECT * FROM carts WHERE conversation_id = ?')
        .bind(conversationId)
        .first<Cart>();

    if (!cart) {
        const cartId = crypto.randomUUID();
        await db
            .prepare('INSERT INTO carts (id, conversation_id) VALUES (?, ?)')
            .bind(cartId, conversationId)
            .run();

        cart = await db
            .prepare('SELECT * FROM carts WHERE id = ?')
            .bind(cartId)
            .first<Cart>();
    }

    if (!cart) {
        throw new Error('Failed to create cart');
    }

    const existingItem = await db
        .prepare('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?')
        .bind(cart.id, productId)
        .first<CartItem>();

    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;

        if (product.stock < newQuantity) {
            throw new Error(`Insufficient stock. Available: ${product.stock}, Total requested: ${newQuantity}`);
        }

        await db
            .prepare('UPDATE cart_items SET quantity = ? WHERE id = ?')
            .bind(newQuantity, existingItem.id)
            .run();
    } else {
        const itemId = crypto.randomUUID();
        await db
            .prepare('INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES (?, ?, ?, ?)')
            .bind(itemId, cart.id, productId, quantity)
            .run();
    }

    return getCartByConversationId(db, conversationId);
}

export async function getCartByConversationId(db: D1Database, conversationId: string): Promise<CartWithItems> {
    const cart = await db
        .prepare('SELECT * FROM carts WHERE conversation_id = ?')
        .bind(conversationId)
        .first<Cart>();

    if (!cart) {
        throw new Error(`Cart not found for conversation ${conversationId}`);
    }

    const items = await db
        .prepare(`
      SELECT 
        ci.quantity,
        p.id, p.name, p.description, p.price, p.stock, p.created_at
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `)
        .bind(cart.id)
        .all<CartItem & Product>();

    const cartItems = (items.results || []).map(item => ({
        product: {
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            stock: item.stock,
            created_at: item.created_at
        },
        quantity: item.quantity,
        subtotal: item.price * item.quantity
    }));

    const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

    return {
        cart,
        items: cartItems,
        total
    };
}

export async function updateCartItem(
    db: D1Database,
    conversationId: string,
    productId: string,
    quantity: number
): Promise<CartWithItems> {
    const cart = await db
        .prepare('SELECT * FROM carts WHERE conversation_id = ?')
        .bind(conversationId)
        .first<Cart>();

    if (!cart) {
        throw new Error(`Cart not found for conversation ${conversationId}`);
    }

    if (quantity === 0) {
        await db
            .prepare('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?')
            .bind(cart.id, productId)
            .run();
    } else {
        const product = await getProductById(db, productId);

        if (!product) {
            throw new Error(`Product ${productId} not found`);
        }

        if (product.stock < quantity) {
            throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
        }

        await db
            .prepare('UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?')
            .bind(quantity, cart.id, productId)
            .run();
    }

    return getCartByConversationId(db, conversationId);
}
