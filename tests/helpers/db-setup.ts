import { D1Database } from '@cloudflare/workers-types'

export async function createTestDatabase(): Promise<D1Database> {
    throw new Error("Use Miniflare environment bindings directly in tests")
}

export async function seedTestDatabase(db: D1Database): Promise<void> {
    await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY,
      conversation_id TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      cart_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      added_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(cart_id, product_id)
    );
  `)
}

export async function cleanupTestDatabase(db: D1Database): Promise<void> {
    await db.exec(`
    DELETE FROM cart_items;
    DELETE FROM carts;
    DELETE FROM products;
  `)
}
