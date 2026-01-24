# MCP Tools Specification

## list_products

Search and filter products from the catalog.

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search | string | No | Search term to filter by name or description (LIKE query) |
| min_price | number | No | Minimum price filter (inclusive) |
| max_price | number | No | Maximum price filter (inclusive) |
| limit | number | No | Max results to return (default: 50, max: 100) |

### Output

```json
{
  "products": [
    {
      "id": "prod_xxx",
      "name": "Product Name",
      "description": "Product description",
      "price": 1500.00,
      "stock": 25,
      "created_at": "2026-01-24T20:00:00Z"
    }
  ],
  "total": 10
}
```

### Example Usage

```json
{
  "search": "camisa",
  "min_price": 1000,
  "max_price": 5000,
  "limit": 20
}
```

---

## get_product

Retrieve detailed information about a specific product.

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| product_id | string | Yes | Unique product identifier |

### Output

```json
{
  "product": {
    "id": "prod_xxx",
    "name": "Product Name",
    "description": "Detailed description",
    "price": 2500.00,
    "stock": 15,
    "created_at": "2026-01-24T20:00:00Z"
  }
}
```

### Error Response

```json
{
  "error": "Product not found",
  "product_id": "prod_xxx"
}
```

---

## create_cart

Create a new cart or add a product to an existing cart for a conversation.

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| conversation_id | string | Yes | Chatwoot conversation ID |
| product_id | string | Yes | Product to add to cart |
| quantity | number | Yes | Quantity to add (min: 1) |

### Output

```json
{
  "message": "Product added to cart successfully",
  "cart": {
    "cart": {
      "id": "cart_xxx",
      "conversation_id": "12345",
      "created_at": "2026-01-24T20:00:00Z",
      "updated_at": "2026-01-24T20:05:00Z"
    },
    "items": [
      {
        "product": {
          "id": "prod_xxx",
          "name": "Product Name",
          "price": 1500.00,
          "stock": 25
        },
        "quantity": 2,
        "subtotal": 3000.00
      }
    ],
    "total": 3000.00
  }
}
```

### Business Logic

- Creates cart if it doesn't exist for the conversation
- If product already in cart, adds to existing quantity
- Validates stock availability before adding
- Triggers Chatwoot tags: `carrito_activo`, `interes_compra`, `producto_{name}`

### Errors

- `Product {id} not found`
- `Insufficient stock for {name}. Available: {stock}, Requested: {quantity}`

---

## get_cart

Retrieve the current cart with all items for a conversation.

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| conversation_id | string | Yes | Chatwoot conversation ID |

### Output

```json
{
  "cart": {
    "cart": {
      "id": "cart_xxx",
      "conversation_id": "12345",
      "created_at": "2026-01-24T20:00:00Z",
      "updated_at": "2026-01-24T20:10:00Z"
    },
    "items": [
      {
        "product": {
          "id": "prod_xxx",
          "name": "Product Name",
          "description": "Description",
          "price": 1500.00,
          "stock": 25,
          "created_at": "2026-01-24T19:00:00Z"
        },
        "quantity": 2,
        "subtotal": 3000.00
      }
    ],
    "total": 3000.00
  }
}
```

### Empty Cart Response

```json
{
  "message": "No active cart found for this conversation",
  "cart": null
}
```

---

## update_cart_item

Update the quantity of a product in the cart or remove it.

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| conversation_id | string | Yes | Chatwoot conversation ID |
| product_id | string | Yes | Product to update |
| quantity | number | Yes | New quantity (0 to remove item) |

### Output

```json
{
  "message": "Product updated in cart successfully",
  "cart": {
    "cart": { },
    "items": [ ],
    "total": 0.00
  }
}
```

### Business Logic

- If `quantity = 0`: removes item from cart
- If `quantity > 0`: updates to new quantity
- Validates stock availability for new quantity
- Updates cart `updated_at` timestamp automatically

### Errors

- `Cart not found for conversation {id}`
- `Product {id} not found`
- `Insufficient stock. Available: {stock}, Requested: {quantity}`

---

## Common Error Format

All tools return errors in this format:

```json
{
  "error": "Error message",
  "tool": "tool_name"
}
```

## Database Schema Reference

### products
- `id` (TEXT, PK)
- `name` (TEXT, NOT NULL)
- `description` (TEXT, nullable)
- `price` (REAL, NOT NULL, >= 0)
- `stock` (INTEGER, NOT NULL, >= 0)
- `created_at` (TEXT, NOT NULL)

### carts
- `id` (TEXT, PK)
- `conversation_id` (TEXT, UNIQUE, NOT NULL)
- `created_at` (TEXT, NOT NULL)
- `updated_at` (TEXT, NOT NULL)

### cart_items
- `id` (TEXT, PK)
- `cart_id` (TEXT, FK → carts.id, CASCADE DELETE)
- `product_id` (TEXT, FK → products.id)
- `quantity` (INTEGER, NOT NULL, > 0)
- `added_at` (TEXT, NOT NULL)
- UNIQUE(cart_id, product_id)
