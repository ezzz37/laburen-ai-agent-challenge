import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
    listProducts,
    getProductById,
    createOrUpdateCart,
    getCartByConversationId,
    updateCartItem
} from '../../../src/db/queries'
import { seedTestDatabase, cleanupTestDatabase } from '../../helpers/db-setup'
import { mockProducts } from '../../fixtures/products'

describe('Product Queries', () => {
    beforeEach(async () => {
        await seedTestDatabase(DB)
        for (const p of mockProducts) {
            await DB.prepare('INSERT INTO products (id, name, description, price, stock) VALUES (?, ?, ?, ?, ?)')
                .bind(p.id, p.name, p.description, p.price, p.stock)
                .run()
        }
    })

    afterEach(async () => {
        await cleanupTestDatabase(DB)
    })

    describe('listProducts', () => {
        it('should list all products when no filters provided', async () => {
            const result = await listProducts(DB)
            expect(result.products.length).toBe(3)
        })

        it('should filter by search term in product name', async () => {
            const result = await listProducts(DB, 'Camiseta')
            expect(result.products.length).toBe(1)
            expect(result.products[0].name).toContain('Camiseta')
        })

        it('should filter by search term in product description', async () => {
            const result = await listProducts(DB, 'cómodas')
            expect(result.products.length).toBe(1)
            expect(result.products[0].name).toContain('Zapatillas')
        })

        it('should filter by min_price only', async () => {
            const result = await listProducts(DB, undefined, 800)
            expect(result.products.length).toBe(2)
        })

        it('should filter by max_price only', async () => {
            const result = await listProducts(DB, undefined, undefined, 600)
            expect(result.products.length).toBe(1)
            expect(result.products[0].price).toBe(599.0)
        })

        it('should filter by price range', async () => {
            const result = await listProducts(DB, undefined, 500, 1000)
            expect(result.products.length).toBe(2)
        })

        it('should limit results', async () => {
            const result = await listProducts(DB, undefined, undefined, undefined, 1)
            expect(result.products.length).toBe(1)
        })
    })

    describe('getProductById', () => {
        it('should return product by valid id', async () => {
            const product = await getProductById(DB, 'test-product-1')
            expect(product).toBeDefined()
            expect(product?.name).toBe('Camiseta Test Azul XL')
        })

        it('should return null for non-existent id', async () => {
            const product = await getProductById(DB, 'non-existent')
            expect(product).toBeNull()
        })
    })

    describe('Cart Queries', () => {
        const convId = 'test-conv-1'

        it('should create new cart and add item', async () => {
            const cart = await createOrUpdateCart(DB, convId, 'test-product-1', 2)
            expect(cart.cart.conversation_id).toBe(convId)
            expect(cart.items.length).toBe(1)
            expect(cart.items[0].quantity).toBe(2)
        })

        it('should update existing cart item quantity', async () => {
            await createOrUpdateCart(DB, convId, 'test-product-1', 2)
            const cart = await createOrUpdateCart(DB, convId, 'test-product-1', 3) // Add 3 more

            expect(cart.items[0].quantity).toBe(5)
        })

        it('should check for stock availability', async () => {
            await expect(createOrUpdateCart(DB, convId, 'test-product-1', 100))
                .rejects.toThrow(/Insufficient stock/)
        })

        it('should retrieve cart by conversation id', async () => {
            await createOrUpdateCart(DB, convId, 'test-product-1', 2)
            const cart = await getCartByConversationId(DB, convId)
            expect(cart.cart.conversation_id).toBe(convId)
        })

        it('should update cart item with specific quantity', async () => {
            await createOrUpdateCart(DB, convId, 'test-product-1', 2)
            const cart = await updateCartItem(DB, convId, 'test-product-1', 5)
            expect(cart.items[0].quantity).toBe(5)
        })

        it('should remove item when quantity update is 0', async () => {
            await createOrUpdateCart(DB, convId, 'test-product-1', 2)
            const cart = await updateCartItem(DB, convId, 'test-product-1', 0)
            expect(cart.items.length).toBe(0)
        })
    })
})
