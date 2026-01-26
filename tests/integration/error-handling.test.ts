import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
    handleGetProduct,
    handleCreateCart,
    handleListProducts
} from '../../src/mcp/handlers'
import { seedTestDatabase, cleanupTestDatabase } from '../helpers/db-setup'
import { mockChatwootAPI, restoreFetch } from '../helpers/mock-fetch'
import { mockProducts } from '../fixtures/products'


describe('Integration: Error Handling', () => {
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

    it('should return error for non-existent product', async () => {
        const resultJson = await handleGetProduct({
            product_id: '00000000-0000-0000-0000-000000000000'
        }, env)
        const result = JSON.parse(resultJson)
        expect(result.error).toMatch(/not found/i)
    })

    it('should validate product id format', async () => {
        await expect(handleGetProduct({ product_id: 'invalid-uuid' }, env))
            .rejects.toThrow(/Invalid product_id/)
    })

    it('should return error for invalid conversation_id', async () => {
        await expect(handleCreateCart({
            conversation_id: '',
            product_id: mockProducts[0].id,
            quantity: 1
        }, env)).rejects.toThrow(/conversation_id is required/)
    })

    it('should handle missing required parameters handling', async () => {
        await expect(handleCreateCart({} as any, env)).rejects.toThrow()
    })

    it('should handle invalid quantity types', async () => {
        const productId = mockProducts[0].id

        await expect(handleCreateCart({
            conversation_id: 'test-conv',
            product_id: productId,
            quantity: 'invalid'
        }, env)).rejects.toThrow(/must be a number/)
    })

    it('should gracefully handle Chatwoot API failures', async () => {
        mockChatwootAPI({ shouldFail: true })

        const productId = mockProducts[0].id

        const resultJson = await handleCreateCart({
            conversation_id: `fail-test-${Date.now()}`,
            product_id: productId,
            quantity: 1
        }, env)
        const result = JSON.parse(resultJson)

        expect(result.message).toContain('successfully')
        expect(result.cart).toBeDefined()
    })
})
