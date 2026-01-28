import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
    handleListProducts,
    handleCreateCart,
    handleUpdateCartItem
} from '../../src/mcp/handlers'
import { seedTestDatabase, cleanupTestDatabase } from '../helpers/db-setup'
import { mockChatwootAPI, restoreFetch } from '../helpers/mock-fetch'
import { mockProducts, lowStockProduct } from '../fixtures/products'


describe('Integration: Stock Management', () => {
    let env: { DB: D1Database, CHATWOOT_URL: string, CHATWOOT_ACCOUNT_ID: string, CHATWOOT_TOKEN: string }

    beforeEach(async () => {
        env = { DB, CHATWOOT_URL: "test", CHATWOOT_ACCOUNT_ID: "test", CHATWOOT_TOKEN: "test" }
        await seedTestDatabase(DB)
        mockChatwootAPI()
        for (const p of [...mockProducts, lowStockProduct]) {
            await DB.prepare('INSERT INTO products (id, name, description, price, stock) VALUES (?, ?, ?, ?, ?)')
                .bind(p.id, p.name, p.description, p.price, p.stock)
                .run()
        }
    })

    afterEach(async () => {
        await cleanupTestDatabase(DB)
        restoreFetch()
    })

    it('should enforce stock limits when adding items', async () => {
        const product = lowStockProduct
        const convId = `stock-test-${Date.now()}`

        const cart1Json = await handleCreateCart({
            conversation_id: convId,
            product_id: product.id,
            quantity: 2
        }, env)
        const cart1 = JSON.parse(cart1Json)
        expect(cart1.message).toContain('successfully')

        await expect(handleUpdateCartItem({
            conversation_id: convId,
            product_id: product.id,
            quantity: product.stock + 1
        }, env)).rejects.toThrow(/Insufficient stock/)
    })

    it('should allow adding same product multiple times up to stock limit', async () => {
        const product = lowStockProduct
        const convId = `multi-add-${Date.now()}`

        await handleCreateCart({
            conversation_id: convId,
            product_id: product.id,
            quantity: 1
        }, env)

        const cart2Json = await handleCreateCart({
            conversation_id: convId,
            product_id: product.id,
            quantity: 2
        }, env)
        const cart2 = JSON.parse(cart2Json)

        expect(cart2.cart.items[0].quantity).toBe(3)

        await expect(handleCreateCart({
            conversation_id: convId,
            product_id: product.id,
            quantity: 1
        }, env)).rejects.toThrow(/Insufficient stock/)
    })

    it('should allow reducing quantity to free up stock', async () => {
        const product = mockProducts[0]
        const convId = `reduce-qty-${Date.now()}`

        await handleCreateCart({
            conversation_id: convId,
            product_id: product.id,
            quantity: 5
        }, env)

        const updatedCartJson = await handleUpdateCartItem({
            conversation_id: convId,
            product_id: product.id,
            quantity: 2
        }, env)
        const updatedCart = JSON.parse(updatedCartJson)

        expect(updatedCart.cart.items[0].quantity).toBe(2)
    })
})
