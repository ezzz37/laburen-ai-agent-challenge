import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
    handleListProducts,
    handleGetProduct,
    handleCreateCart,
    handleGetCart,
    handleUpdateCartItem
} from '../../src/mcp/handlers'
import { seedTestDatabase, cleanupTestDatabase } from '../helpers/db-setup'
import { mockChatwootAPI, restoreFetch } from '../helpers/mock-fetch'
import { mockProducts } from '../fixtures/products'


describe('Integration: Complete Purchase Flow', () => {
    let env: { DB: D1Database, CHATWOOT_URL: string, CHATWOOT_ACCOUNT_ID: string, CHATWOOT_TOKEN: string }
    let testConversationId: string

    beforeEach(async () => {
        env = { DB, CHATWOOT_URL: "test", CHATWOOT_ACCOUNT_ID: "test", CHATWOOT_TOKEN: "test" }
        await seedTestDatabase(DB)
        mockChatwootAPI()

        for (const p of mockProducts) {
            await DB.prepare('INSERT INTO products (id, name, description, price, stock) VALUES (?, ?, ?, ?, ?)')
                .bind(p.id, p.name, p.description, p.price, p.stock)
                .run()
        }

        testConversationId = `test-conv-${Date.now()}-${Math.random()}`
    })

    afterEach(async () => {
        await cleanupTestDatabase(DB)
        restoreFetch()
    })

    it('should complete full shopping journey from search to checkout', async () => {
        const searchResultJson = await handleListProducts({
            search: 'camiseta',
            limit: 5
        }, env)
        const searchResult = JSON.parse(searchResultJson)

        expect(searchResult.products).toHaveLength(1)

        const productId = searchResult.products[0].id
        const productDetailsJson = await handleGetProduct({ product_id: productId }, env)
        const productDetails = JSON.parse(productDetailsJson)

        expect(productDetails.product).toBeDefined()
        expect(productDetails.product.name).toContain('Camiseta')

        const cart1Json = await handleCreateCart({
            conversation_id: testConversationId,
            product_id: productId,
            quantity: 2
        }, env)
        const cart1 = JSON.parse(cart1Json)

        expect(cart1.cart.items).toHaveLength(1)
        expect(cart1.cart.items[0].quantity).toBe(2)

        const secondProductId = '550e8400-e29b-41d4-a716-446655440002'
        const cart2Json = await handleCreateCart({
            conversation_id: testConversationId,
            product_id: secondProductId,
            quantity: 1
        }, env)
        const cart2 = JSON.parse(cart2Json)

        expect(cart2.cart.items).toHaveLength(2)

        const fullCartJson = await handleGetCart({
            conversation_id: testConversationId
        }, env)
        const fullCart = JSON.parse(fullCartJson)

        expect(fullCart.cart.items).toHaveLength(2)
        expect(fullCart.cart.total).toBeGreaterThan(0)

        const updatedCartJson = await handleUpdateCartItem({
            conversation_id: testConversationId,
            product_id: productId,
            quantity: 5
        }, env)
        const updatedCart = JSON.parse(updatedCartJson)

        const updatedItem = updatedCart.cart.items.find(
            (item: any) => item.product.id === productId
        )
        expect(updatedItem.quantity).toBe(5)

        const finalCartJson = await handleUpdateCartItem({
            conversation_id: testConversationId,
            product_id: secondProductId,
            quantity: 0
        }, env)
        const finalCart = JSON.parse(finalCartJson)

        expect(finalCart.cart.items).toHaveLength(1)
        expect(finalCart.cart.items[0].product.id).toBe(productId)
    })
})
