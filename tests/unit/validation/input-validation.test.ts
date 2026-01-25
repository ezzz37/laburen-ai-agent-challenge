import { describe, it, expect } from 'vitest'
import {
    validateListProductsParams,
    validateProductId,
    validateQuantity,
    validateConversationId
} from '../../../src/validation/input-validation'

describe('Input Validation', () => {
    describe('validateListProductsParams', () => {
        it('should accept valid parameters', () => {
            expect(() => validateListProductsParams({
                min_price: 10,
                max_price: 100,
                limit: 50,
                search: 'shirt'
            })).not.toThrow()
        })

        it('should reject negative min_price', () => {
            expect(() => validateListProductsParams({ min_price: -10 }))
                .toThrow('min_price must be non-negative')
        })

        it('should reject negative max_price', () => {
            expect(() => validateListProductsParams({ max_price: -10 }))
                .toThrow('max_price must be non-negative')
        })

        it('should reject when min_price > max_price', () => {
            expect(() => validateListProductsParams({ min_price: 100, max_price: 50 }))
                .toThrow('min_price cannot be greater than max_price')
        })

        it('should reject limit greater than 100', () => {
            expect(() => validateListProductsParams({ limit: 101 }))
                .toThrow('limit cannot exceed 100')
        })

        it('should reject search string with SQL injection chars', () => {
            expect(() => validateListProductsParams({ search: "admin'; DROP TABLE products; --" }))
                .toThrow('Invalid characters')
        })
    })

    describe('validateProductId', () => {
        it('should accept valid UUID', () => {
            expect(() => validateProductId('123e4567-e89b-12d3-a456-426614174000')).not.toThrow()
        })

        it('should reject invalid UUID format', () => {
            expect(() => validateProductId('invalid-id')).toThrow('Invalid product_id format')
        })
    })

    describe('validateQuantity', () => {
        it('should accept positive integers', () => {
            expect(() => validateQuantity(10)).not.toThrow()
        })

        it('should accept 0', () => {
            expect(() => validateQuantity(0)).not.toThrow()
        })

        it('should reject negative numbers', () => {
            expect(() => validateQuantity(-1)).toThrow('quantity cannot be negative')
        })

        it('should reject decimals', () => {
            expect(() => validateQuantity(1.5)).toThrow('quantity must be an integer')
        })
    })

    describe('validateConversationId', () => {
        it('should accept alphanumeric strings', () => {
            expect(() => validateConversationId('conv-123_ABC')).not.toThrow()
        })

        it('should reject special characters', () => {
            expect(() => validateConversationId('conv$123')).toThrow('invalid characters')
        })

        it('should reject empty string', () => {
            expect(() => validateConversationId('')).toThrow('required')
        })
    })
})
