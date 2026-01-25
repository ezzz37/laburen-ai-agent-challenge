import { expect } from 'vitest'

interface CustomMatchers<R = unknown> {
    toBeValidUUID(): R
}

declare module 'vitest' {
    interface Assertion<T = any> extends CustomMatchers<T> { }
    interface AsymmetricMatchersContaining extends CustomMatchers { }
}

expect.extend({
    toBeValidUUID(received) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        const pass = uuidRegex.test(received)
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid UUID`,
                pass: true,
            }
        } else {
            return {
                message: () => `expected ${received} to be a valid UUID`,
                pass: false,
            }
        }
    },
})
