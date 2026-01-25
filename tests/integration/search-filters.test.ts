import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { handleListProducts } from '../../src/mcp/handlers'
import { seedTestDatabase, cleanupTestDatabase } from '../helpers/db-setup'
import { mockProducts } from '../fixtures/products'


describe('Integration: Search and Filtering', () => {
    let env: { DB: D1Database, CHATWOOT_URL: string, CHATWOOT_ACCOUNT_ID: string, CHATWOOT_TOKEN: string }

    beforeEach(async () => {
        env = { DB, CHATWOOT_URL: "test", CHATWOOT_ACCOUNT_ID: "test", CHATWOOT_TOKEN: "test" }
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

    it('should search by product name accurately', async () => {
        const resultJson = await handleListProducts({ search: 'camiseta' }, env)
        const result = JSON.parse(resultJson)

        expect(result.products.length).toBeGreaterThan(0)
        expect(
            result.products.every((p: any) =>
                p.name.toLowerCase().includes('camiseta')
            )
        ).toBe(true)
    })

    it('should search by product description', async () => {
        const resultJson = await handleListProducts({
            search: 'alta calidad'
        }, env)
        const result = JSON.parse(resultJson)

        expect(result.products.length).toBeGreaterThan(0)
        expect(
            result.products.some((p: any) =>
                p.description?.toLowerCase().includes('alta calidad')
            )
        ).toBe(true)
    })

    it('should filter by price range accurately', async () => {
        const resultJson = await handleListProducts({
            min_price: 500,
            max_price: 1000
        }, env)
        const result = JSON.parse(resultJson)

        expect(result.products.length).toBeGreaterThan(0)
        expect(
            result.products.every((p: any) =>
                p.price >= 500 && p.price <= 1000
            )
        ).toBe(true)
    })

    it('should combine search and price filters correctly', async () => {
        const resultJson = await handleListProducts({
            search: 'azul',
            min_price: 400,
            max_price: 800
        }, env)
        const result = JSON.parse(resultJson)

        expect(result.products.length).toBeGreaterThan(0)
        expect(
            result.products.every((p: any) =>
                (p.name.toLowerCase().includes('azul') ||
                    p.description?.toLowerCase().includes('azul')) &&
                p.price >= 400 &&
                p.price <= 800
            )
        ).toBe(true)
    })

    it('should respect limit parameter', async () => {
        const resultJson = await handleListProducts({ limit: 1 }, env)
        const result = JSON.parse(resultJson)

        expect(result.products).toHaveLength(1)
    })

    it('should return empty array when no matches', async () => {
        const resultJson = await handleListProducts({
            search: 'PRODUCTO_QUE_NO_EXISTE_XYZ123'
        }, env)
        const result = JSON.parse(resultJson)

        expect(result.products).toHaveLength(0)
    })
})
