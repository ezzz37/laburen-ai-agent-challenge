import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
    handleListProducts,
    handleGetProduct,
    handleCreateCart,
    handleGetCart,
    handleUpdateCartItem
} from '../../../src/mcp/handlers'
import { seedTestDatabase, cleanupTestDatabase } from '../../helpers/db-setup'
import { mockChatwootAPI, restoreFetch } from '../../helpers/mock-fetch'
import { mockProducts } from '../../fixtures/products'

describe('MCP Tool Handlers', () => {
    let env: any

    beforeEach(async () => {
        env = {
            DB,
            CHATWOOT_URL: 'https://test.chatwoot.com',
            CHATWOOT_ACCOUNT_ID: 'test-account',
            CHATWOOT_TOKEN: 'test-token'
        }

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

    describe('handleListProducts', () => {
        it('should list products and return JSON string', async () => {
            const result = await handleListProducts({}, env)
            const parsed = JSON.parse(result)
            expect(parsed.products).toBeDefined()
            expect(parsed.total).toBe(3)
        })

        it('should handle no products found', async () => {
            await env.DB.prepare('DELETE FROM products').run()
            const result = await handleListProducts({}, env)
            const parsed = JSON.parse(result)
            expect(parsed.products).toHaveLength(0)
            expect(parsed.message).toContain('No products found')
        })
    })

    describe('handleGetProduct', () => {
        it('should return product details', async () => {
            const result = await handleGetProduct({ product_id: '550e8400-e29b-41d4-a716-446655440001' }, env)
            const parsed = JSON.parse(result)
            expect(parsed.product.id).toBe('550e8400-e29b-41d4-a716-446655440001')
        })

        it('should return error if product not found', async () => {
            const result = await handleGetProduct({ product_id: '00000000-0000-0000-0000-000000000000' }, env)
            const parsed = JSON.parse(result)
            expect(parsed.error).toBe('Product not found')
        })
    })

    describe('handleCreateCart', () => {
        it('should create cart and add item', async () => {
            const result = await handleCreateCart({
                conversation_id: 'conv-1',
                product_id: '550e8400-e29b-41d4-a716-446655440001',
                quantity: 1
            }, env)
            const parsed = JSON.parse(result)
            expect(parsed.message).toContain('successfully')
            expect(parsed.cart.items[0].product_id).toBe('550e8400-e29b-41d4-a716-446655440001')
        })

        it('should trigger Chatwoot tagging', async () => {
            await handleCreateCart({
                conversation_id: 'conv-chatwoot',
                product_id: '550e8400-e29b-41d4-a716-446655440001',
                quantity: 1
            }, env)
            await new Promise(r => setTimeout(r, 10))

            expect(global.fetch).toHaveBeenCalled()
        })
    })

    describe('handleGetCart', () => {
        it('should return empty cart message if not found', async () => {
            const result = await handleGetCart({ conversation_id: 'new-conv' }, env)
            const parsed = JSON.parse(result)
            expect(parsed.message).toContain('No active cart found')
            expect(parsed.cart).toBeNull()
        })
    })

    describe('handleUpdateCartItem', () => {
        it('should update item quantity', async () => {
            await handleCreateCart({
                conversation_id: 'conv-update',
                product_id: '550e8400-e29b-41d4-a716-446655440001',
                quantity: 1
            }, env)

            const result = await handleUpdateCartItem({
                conversation_id: 'conv-update',
                product_id: '550e8400-e29b-41d4-a716-446655440001',
                quantity: 5
            }, env)

            const parsed = JSON.parse(result)
            expect(parsed.cart.items[0].quantity).toBe(5)
        })
    })
})
