import { describe, it, expect } from 'vitest'
import { TOOLS_DEFINITIONS } from '../../../src/mcp/tools'

describe('MCP Tools Definitions', () => {
    describe('list_products', () => {
        it('should have correct name and description', () => {
            expect(TOOLS_DEFINITIONS.list_products.name).toBe('list_products')
            expect(TOOLS_DEFINITIONS.list_products.description).toContain('Search and list')
        })

        it('should define correct properties', () => {
            const props = TOOLS_DEFINITIONS.list_products.inputSchema.properties
            expect(props.search).toBeDefined()
            expect(props.min_price).toBeDefined()
            expect(props.min_price.minimum).toBe(0)
            expect(props.limit.maximum).toBe(100)
            expect(props.limit.default).toBe(50)
        })
    })

    describe('create_cart', () => {
        it('should require specific fields', () => {
            const schema = TOOLS_DEFINITIONS.create_cart.inputSchema
            expect(schema.required).toContain('conversation_id')
            expect(schema.required).toContain('product_id')
            expect(schema.required).toContain('quantity')
        })
    })
})
