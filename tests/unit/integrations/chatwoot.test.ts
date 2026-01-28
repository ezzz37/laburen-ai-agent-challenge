import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { addChatwootTags, generateProductTags, generateCartTags } from '../../../src/integrations/chatwoot'
import { mockChatwootAPI, restoreFetch } from '../../helpers/mock-fetch'

describe('Chatwoot Integration', () => {
    describe('addChatwootTags', () => {
        const config = {
            url: 'https://test.chatwoot.com',
            accountId: '1',
            token: 'test-token'
        }
        const conversationId = '123'
        const tags = ['tag1', 'tag2']

        beforeEach(() => {
            mockChatwootAPI()
        })

        afterEach(() => {
            restoreFetch()
        })

        it('should call Chatwoot API with correct endpoint and headers', async () => {
            await addChatwootTags(conversationId, tags, config)

            expect(global.fetch).toHaveBeenCalledWith(
                `https://test.chatwoot.com/api/v1/accounts/1/conversations/123/labels`,
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'api_access_token': 'test-token',
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({ labels: tags })
                })
            )
        })

        it('should handle API failure gracefully (log warning but not throw)', async () => {
            mockChatwootAPI({ shouldFail: true })

            await expect(addChatwootTags(conversationId, tags, config)).resolves.not.toThrow()
        })
    })

    describe('Tag Generation & Sanitization', () => {
        it('should generate cart tags', () => {
            const tags = generateCartTags()
            expect(tags).toContain('carrito_activo')
            expect(tags).toContain('interes_compra')
        })

        it('should generate sanitized product tags', () => {
            const name = 'Camiseta Azul XL!'
            const tags = generateProductTags(name)
            expect(tags).toContain('producto_camiseta_azul_xl')
        })

        it('should handle special characters', () => {
            const name = '$$MoneyMaker$$'
            const tags = generateProductTags(name)
            expect(tags[0]).toBe('producto_moneymaker')
        })

        it('should handle spaces', () => {
            const name = 'Space   Man'
            const tags = generateProductTags(name)
            expect(tags[0]).toBe('producto_space_man')
        })
    })
})
