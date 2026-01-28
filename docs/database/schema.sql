CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL CHECK(price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY,
  conversation_id TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_carts_conversation ON carts(conversation_id);

CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE(cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

CREATE TRIGGER IF NOT EXISTS update_cart_timestamp 
AFTER UPDATE ON carts
BEGIN
  UPDATE carts SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_cart_on_item_change
AFTER INSERT ON cart_items
BEGIN
  UPDATE carts SET updated_at = datetime('now') WHERE id = NEW.cart_id;
END;

CREATE TRIGGER IF NOT EXISTS update_cart_on_item_update
AFTER UPDATE ON cart_items
BEGIN
  UPDATE carts SET updated_at = datetime('now') WHERE id = NEW.cart_id;
END;

CREATE TRIGGER IF NOT EXISTS update_cart_on_item_delete
AFTER DELETE ON cart_items
BEGIN
  UPDATE carts SET updated_at = datetime('now') WHERE id = OLD.cart_id;
END;
