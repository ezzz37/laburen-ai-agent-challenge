import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
    handleListProducts,
    handleCreateCart,
    handleGetCart,
    handleUpdateCartItem
} from '../../src/mcp/handlers'
import { seedTestDatabase, cleanupTestDatabase } from '../helpers/db-setup'
import { mockChatwootAPI, restoreFetch } from '../helpers/mock-fetch'
import { mockProducts } from '../fixtures/products'


describe('Integration: Concurrent Conversations', () => {
    let env: { DB: D1Database, CHATWOOT_URL: string, CHATWOOT_ACCOUNT_ID: string, CHATWOOT_TOKEN: string }

    beforeEach(async () => {
        env = { DB, CHATWOOT_URL: "test", CHATWOOT_ACCOUNT_ID: "test", CHATWOOT_TOKEN: "test" }
        await seedTestDatabase(DB)
        mockChatwootAPI()
        for (const p of mockProducts) {
            await DB.prepare('INSERT INTO products (id, name, description, price, stock) VALUES (?, ?, ?, ?, ?)')
                .bind(p.id, p.name, p.description, p.price, p.stock)
                .run()
        }
    })

    afterEach(async () => {
        await cleanupTestDatabase(DB)
        restoreFetch()
    })

    it('should handle multiple independent carts without interference', async () => {
        const conv1 = `conv-1-${Date.now()}`
        const conv2 = `conv-2-${Date.now()}`

        const product1Id = '550e8400-e29b-41d4-a716-446655440001'
        const product2Id = '550e8400-e29b-41d4-a716-446655440002'

        const cart1Json = await handleCreateCart({
            conversation_id: conv1,
            product_id: product1Id,
            quantity: 2
        }, env)
        const cart1 = JSON.parse(cart1Json)

        const cart2Json = await handleCreateCart({
            conversation_id: conv2,
            product_id: product2Id,
            quantity: 3
        }, env)
        const cart2 = JSON.parse(cart2Json)

        expect(cart1.cart.id).not.toBe(cart2.cart.id)
        expect(cart1.cart.conversation_id).toBe(conv1)
        expect(cart2.cart.conversation_id).toBe(conv2)

        await handleUpdateCartItem({
            conversation_id: conv1,
            product_id: product1Id,
            quantity: 5
        }, env)

        const cart2CheckJson = await handleGetCart({ conversation_id: conv2 }, env)
        const cart2Check = JSON.parse(cart2CheckJson)
        expect(cart2Check.cart.items[0].quantity).toBe(3)
        expect(cart2Check.cart.items[0].product.id).toBe(product2Id)

        await handleCreateCart({
            conversation_id: conv2,
            product_id: product1Id,
            quantity: 1
        }, env)

        const finalCart1Json = await handleGetCart({ conversation_id: conv1 }, env)
        const finalCart2Json = await handleGetCart({ conversation_id: conv2 }, env)

        const finalCart1 = JSON.parse(finalCart1Json)
        const finalCart2 = JSON.parse(finalCart2Json)

        expect(finalCart1.cart.items).toHaveLength(1)
        expect(finalCart2.cart.items).toHaveLength(2)
    })
})
