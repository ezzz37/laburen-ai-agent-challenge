import { vi } from 'vitest'

export function mockChatwootAPI(options: {
    shouldFail?: boolean
    delay?: number
} = {}) {
    const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        if (options.delay) {
            await new Promise(resolve => setTimeout(resolve, options.delay))
        }

        if (options.shouldFail) {
            throw new Error('Chatwoot API error (simulated)')
        }

        return {
            ok: true,
            status: 200,
            json: async () => ({ success: true })
        }
    })

    global.fetch = mockFetch as any
    return mockFetch
}

export function restoreFetch() {
    vi.restoreAllMocks()
}
