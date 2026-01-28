import { beforeEach } from 'vitest'
import type { D1Database } from '@cloudflare/workers-types'
import { createMockD1Database } from './helpers/mock-d1'

declare global {
    function getMiniflareBindings<T = Record<string, unknown>>(): T
    var DB: D1Database
}

beforeEach(() => {
    globalThis.DB = createMockD1Database()
})
