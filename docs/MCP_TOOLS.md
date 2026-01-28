# Especificación de Herramientas MCP

## list_products

Buscar y filtrar productos del catálogo.

### Parámetros de Entrada

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| search | string | No | Término de búsqueda para filtrar por nombre o descripción (consulta LIKE) |
| min_price | number | No | Filtro de precio mínimo (inclusivo) |
| max_price | number | No | Filtro de precio máximo (inclusivo) |
| limit | number | No | Máximo de resultados a retornar (default: 50, máx: 100) |

### Salida

```json
{
  "products": [
    {
      "id": "prod_xxx",
      "name": "Nombre del Producto",
      "description": "Descripción del producto",
      "price": 1500.00,
      "stock": 25,
      "created_at": "2026-01-24T20:00:00Z"
    }
  ],
  "total": 10
}
```

### Ejemplo de Uso

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

Recuperar información detallada sobre un producto específico.

### Parámetros de Entrada

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| product_id | string | Sí | Identificador único del producto |

### Salida

```json
{
  "product": {
    "id": "prod_xxx",
    "name": "Nombre del Producto",
    "description": "Descripción detallada",
    "price": 2500.00,
    "stock": 15,
    "created_at": "2026-01-24T20:00:00Z"
  }
}
```

### Respuesta de Error

```json
{
  "error": "Product not found",
  "product_id": "prod_xxx"
}
```

---

## create_cart

Crear un nuevo carrito o agregar un producto a un carrito existente para una conversación.

### Parámetros de Entrada

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| conversation_id | string | Sí | ID de conversación de Chatwoot |
| product_id | string | Sí | Producto a agregar al carrito |
| quantity | number | Sí | Cantidad a agregar (mín: 1) |

### Salida

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
          "name": "Nombre del Producto",
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

### Lógica de Negocio

- Crea el carrito si no existe para la conversación
- Si el producto ya está en el carrito, suma a la cantidad existente
- Valida disponibilidad de stock antes de agregar
- Activa etiquetas de Chatwoot: `carrito_activo`, `interes_compra`, `producto_{name}`

### Errores

- `Product {id} not found`
- `Insufficient stock for {name}. Available: {stock}, Requested: {quantity}`

---

## get_cart

Recuperar el carrito actual con todos los items para una conversación.

### Parámetros de Entrada

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| conversation_id | string | Sí | ID de conversación de Chatwoot |

### Salida

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
          "name": "Nombre del Producto",
          "description": "Descripción",
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

### Respuesta de Carrito Vacío

```json
{
  "message": "No active cart found for this conversation",
  "cart": null
}
```

---

## update_cart_item

Actualizar la cantidad de un producto en el carrito o eliminarlo.

### Parámetros de Entrada

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| conversation_id | string | Sí | ID de conversación de Chatwoot |
| product_id | string | Sí | Producto a actualizar |
| quantity | number | Sí | Nueva cantidad (0 para eliminar el item) |

### Salida

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

### Lógica de Negocio

- Si `quantity = 0`: elimina el item del carrito
- Si `quantity > 0`: actualiza a la nueva cantidad
- Valida disponibilidad de stock para la nueva cantidad
- Actualiza automáticamente el timestamp `updated_at` del carrito

### Errores

- `Cart not found for conversation {id}`
- `Product {id} not found`
- `Insufficient stock. Available: {stock}, Requested: {quantity}`

---

## apply_chatwoot_tag

Aplicar etiquetas a una conversación de Chatwoot para categorización y seguimiento.

### Parámetros de Entrada

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| conversation_id | string | Sí | ID de conversación de Chatwoot |
| tags | array | Sí | Array de etiquetas a aplicar (mín: 1) |

### Salida

```json
{
  "message": "Tags applied successfully",
  "conversation_id": "12345",
  "tags": ["interesado", "producto_camisa"]
}
```

### Ejemplo de Uso

```json
{
  "conversation_id": "18",
  "tags": ["interesado", "consulta_precio", "producto_pantalon"]
}
```

### Lógica de Negocio

- Las etiquetas se sanitizan automáticamente (minúsculas, alfanumérico + guión bajo/guión)
- Se pueden aplicar múltiples etiquetas en una sola llamada
- Reintenta automáticamente en caso de fallo (máx 1 reintento)
- Operación no bloqueante (no falla la creación del carrito si las etiquetas fallan)

---

## handoff_to_human

Transferir la conversación a un agente humano con contexto y razón.

### Parámetros de Entrada

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| conversation_id | string | Sí | ID de conversación de Chatwoot |
| reason | string | Sí | Razón de la derivación (ej: "complex_query", "payment_issue") |

### Salida

```json
{
  "message": "Conversation handed off to human agent successfully",
  "conversation_id": "12345",
  "reason": "complex_query"
}
```

### Ejemplo de Uso

```json
{
  "conversation_id": "18",
  "reason": "customer_request"
}
```

### Lógica de Negocio

- Aplica automáticamente etiquetas: `derivado_humano`, `motivo_{reason}`
- Cambia el estado de la conversación a "open" en Chatwoot
- La razón se sanitiza para la creación de etiquetas
- Razones comunes: `complex_query`, `payment_issue`, `customer_request`, `technical_support`

### Errores

- `Handoff reason is required`
- `Failed to change conversation status: {details}`

---

## Formato Común de Errores


Todas las herramientas retornan errores en este formato:

```json
{
  "error": "Mensaje de error",
  "tool": "nombre_herramienta"
}
```

## Referencia del Esquema de Base de Datos

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
