import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'miniflare',
        environmentOptions: {
            bindings: {
                CHATWOOT_URL: 'https://mock-chatwoot.test',
                CHATWOOT_ACCOUNT_ID: 'mock-account-id',
                CHATWOOT_TOKEN: 'mock-token-value'
            },
            d1Databases: ['DB']
        },
        setupFiles: ['./tests/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'tests/',
                '*.config.ts',
                'dist/'
            ],
            thresholds: {
                lines: 70,
                functions: 70,
                branches: 70,
                statements: 70
            }
        },
        testTimeout: 10000,
        hookTimeout: 10000
    }
})
