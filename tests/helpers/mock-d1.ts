import type { D1Database, D1Result } from '@cloudflare/workers-types'

interface MockD1Row {
    [key: string]: any
}

class MockD1Database {
    private tables: Map<string, MockD1Row[]> = new Map()

    prepare(query: string): D1PreparedStatement {
        return new MockD1PreparedStatement(query, this.tables) as unknown as D1PreparedStatement
    }

    async dump(): Promise<ArrayBuffer> {
        throw new Error('dump() not implemented in mock')
    }

    withSession(callback: (session: D1Database) => Promise<void>): Promise<void> {
        return callback(this as unknown as D1Database)
    }

    async batch<T = unknown>(_statements: any[]): Promise<D1Result<T>[]> {
        throw new Error('batch() not implemented in mock')
    }

    async exec(query: string): Promise<D1ExecResult> {
        const statements = query.split(';').filter(s => s.trim())

        for (const statement of statements) {
            const trimmed = statement.trim().toUpperCase()

            if (trimmed.startsWith('CREATE TABLE')) {
                const match = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i)
                if (match) {
                    const tableName = match[1].toLowerCase()
                    if (!this.tables.has(tableName)) {
                        this.tables.set(tableName, [])
                    }
                }
            } else if (trimmed.startsWith('DELETE FROM')) {
                const match = statement.match(/DELETE FROM (\w+)/i)
                if (match) {
                    const tableName = match[1].toLowerCase()
                    this.tables.set(tableName, [])
                }
            }
        }

        return {
            count: statements.length,
            duration: 0
        }
    }
}

class MockD1PreparedStatement {
    private boundValues: any[] = []

    constructor(
        private query: string,
        private tables: Map<string, MockD1Row[]>
    ) { }

    bind(...values: any[]) {
        this.boundValues = values
        return this
    }

    async first<T = unknown>(colName?: string): Promise<T | null> {
        const result = await this.all<T>()
        if (result.results && result.results.length > 0) {
            if (colName) {
                return result.results[0][colName] as T
            }
            return result.results[0] as T
        }
        return null
    }

    async run<T = unknown>(): Promise<D1Result<T>> {
        const trimmed = this.query.trim().toUpperCase()

        if (trimmed.startsWith('INSERT')) {
            const match = this.query.match(/INSERT INTO (\w+)/i)
            if (match) {
                const tableName = match[1].toLowerCase()
                const table = this.tables.get(tableName) || []

                const columnsMatch = this.query.match(/\(([^)]+)\) VALUES/i)
                if (columnsMatch) {
                    const columns = columnsMatch[1].split(',').map(c => c.trim())
                    const row: MockD1Row = {}
                    columns.forEach((col, i) => {
                        row[col] = this.boundValues[i]
                    })
                    table.push(row)
                    this.tables.set(tableName, table)
                }
            }
            return { success: true, meta: {} as any, results: [] }
        }

        if (trimmed.startsWith('UPDATE')) {
            const match = this.query.match(/UPDATE (\w+)/i)
            if (match) {
                const tableName = match[1].toLowerCase()
                const table = this.tables.get(tableName) || []

                const setMatch = this.query.match(/SET (.+?) WHERE/i)
                const whereMatch = this.query.match(/WHERE (.+)$/i)

                if (setMatch && whereMatch) {
                    const setClause = setMatch[1]
                    const whereClause = whereMatch[1]

                    table.forEach(row => {
                        if (this.evaluateWhere(row, whereClause)) {
                            const updates = setClause.split(',')
                            updates.forEach((update, i) => {
                                const [col] = update.trim().split('=')
                                row[col.trim()] = this.boundValues[i]
                            })
                        }
                    })
                }
            }
            return { success: true, meta: {} as any, results: [] }
        }

        if (trimmed.startsWith('DELETE')) {
            const match = this.query.match(/DELETE FROM (\w+)/i)
            if (match) {
                const tableName = match[1].toLowerCase()
                const table = this.tables.get(tableName) || []

                const whereMatch = this.query.match(/WHERE (.+)$/i)
                if (whereMatch) {
                    const whereClause = whereMatch[1]
                    const filtered = table.filter(row => !this.evaluateWhere(row, whereClause))
                    this.tables.set(tableName, filtered)
                } else {
                    this.tables.set(tableName, [])
                }
            }
            return { success: true, meta: {} as any, results: [] }
        }

        return { success: true, meta: {} as any, results: [] }
    }

    async all<T = unknown>(): Promise<D1Result<T>> {
        const trimmed = this.query.trim().toUpperCase()

        if (trimmed.startsWith('SELECT')) {
            const match = this.query.match(/FROM (\w+)/i)
            if (match) {
                const tableName = match[1].toLowerCase()
                let table = this.tables.get(tableName) || []

                const whereMatch = this.query.match(/WHERE (.+?)(?:ORDER|LIMIT|$)/i)
                if (whereMatch) {
                    const whereClause = whereMatch[1].trim()
                    table = table.filter(row => this.evaluateWhere(row, whereClause))
                }

                const limitMatch = this.query.match(/LIMIT (\?|\d+)/i)
                if (limitMatch) {
                    const limit = limitMatch[1] === '?'
                        ? this.boundValues[this.boundValues.length - 1]
                        : parseInt(limitMatch[1])
                    table = table.slice(0, limit)
                }

                return {
                    success: true,
                    meta: {} as any,
                    results: table as T[]
                }
            }
        }

        return { success: true, meta: {} as any, results: [] }
    }

    async raw<T = unknown[]>(): Promise<T[]> {
        const result = await this.all()
        return result.results as T[]
    }

    private evaluateWhere(row: MockD1Row, whereClause: string): boolean {
        let valueIndex = 0

        const conditions = whereClause.split(/\s+AND\s+/i)

        return conditions.every(condition => {
            const eqMatch = condition.match(/(\w+)\s*=\s*\?/)
            if (eqMatch) {
                const col = eqMatch[1]
                const value = this.boundValues[valueIndex++]
                return row[col] === value
            }

            const likeMatch = condition.match(/(\w+)\s+LIKE\s+\?/i)
            if (likeMatch) {
                const col = likeMatch[1]
                const pattern = this.boundValues[valueIndex++]
                const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i')
                return regex.test(String(row[col] || ''))
            }

            const gteMatch = condition.match(/(\w+)\s*>=\s*\?/)
            if (gteMatch) {
                const col = gteMatch[1]
                const value = this.boundValues[valueIndex++]
                return row[col] >= value
            }

            const lteMatch = condition.match(/(\w+)\s*<=\s*\?/)
            if (lteMatch) {
                const col = lteMatch[1]
                const value = this.boundValues[valueIndex++]
                return row[col] <= value
            }

            return true
        })
    }
}

export function createMockD1Database(): D1Database {
    return new MockD1Database() as unknown as D1Database
}
