# Interaction Flows

## Flow 1: Product Discovery

### User Journey
User wants to browse available products

### Conversation Example

**User:** Hola, qué productos tienen?

**Agent:** (calls `list_products()`)

**Agent Response:**
```
Tenemos estos productos disponibles ✨

📦 Camisa Azul Clásica - $2.500
📦 Pantalón Negro Formal - $4.200
📦 Zapatillas Deportivas - $8.900
📦 Remera Básica Blanca - $1.800

¿Te interesa alguno en particular?
```

### Tool Calls
1. `list_products({})` → Returns all products

---

## Flow 2: Product Search with Filters

### User Journey
User searches for specific products within a price range

### Conversation Example

**User:** Buscame algo entre $2000 y $5000

**Agent:** (calls `list_products({ min_price: 2000, max_price: 5000 })`)

**Agent Response:**
```
Encontré estos productos en ese rango ✨

📦 Camisa Azul Clásica - $2.500
📦 Pantalón Negro Formal - $4.200

¿Cuál te interesa?
```

### Tool Calls
1. `list_products({ min_price: 2000, max_price: 5000 })`

---

## Flow 3: Product Details

### User Journey
User wants detailed information about a specific product

### Conversation Example

**User:** Contame más de la camisa azul

**Agent:** (calls `get_product({ product_id: "prod_xxx" })`)

**Agent Response:**
```
📦 Camisa Azul Clásica
💰 Precio: $2.500
📊 Stock: 15 unidades
Camisa de algodón 100%, corte clásico, ideal para uso formal o casual

¿Te gustaría agregarla al carrito?
```

### Tool Calls
1. `get_product({ product_id: "prod_xxx" })`

---

## Flow 4: Add to Cart (First Item)

### User Journey
User decides to purchase a product

### Conversation Example

**User:** Sí, agrégame 2 camisas

**Agent:** (calls `create_cart({ conversation_id: "12345", product_id: "prod_xxx", quantity: 2 })`)

**Agent Response:**
```
¡Listo! Agregué 2 Camisa Azul Clásica a tu carrito 🛒

Total actual: $5.000

¿Querés agregar algo más?
```

### Tool Calls
1. `create_cart({ conversation_id: "12345", product_id: "prod_xxx", quantity: 2 })`

### Side Effects
- Cart created in database
- Chatwoot tags added: `carrito_activo`, `interes_compra`, `producto_camisa_azul_clasica`

---

## Flow 5: Add More Items to Cart

### User Journey
User adds another product to existing cart

### Conversation Example

**User:** Agregame también un pantalón

**Agent:** (calls `create_cart({ conversation_id: "12345", product_id: "prod_yyy", quantity: 1 })`)

**Agent Response:**
```
¡Perfecto! Agregué 1 Pantalón Negro Formal 🛒

Tu carrito ahora:
• 2 Camisa Azul Clásica - $5.000
• 1 Pantalón Negro Formal - $4.200

Total: $9.200

¿Algo más?
```

### Tool Calls
1. `create_cart({ conversation_id: "12345", product_id: "prod_yyy", quantity: 1 })`

### Side Effects
- Chatwoot tag added: `producto_pantalon_negro_formal`

---

## Flow 6: View Cart

### User Journey
User wants to review their cart

### Conversation Example

**User:** Qué tengo en el carrito?

**Agent:** (calls `get_cart({ conversation_id: "12345" })`)

**Agent Response:**
```
Tu carrito 🛒

• 2 Camisa Azul Clásica - $5.000
• 1 Pantalón Negro Formal - $4.200

Total: $9.200

¿Procedemos con la compra?
```

### Tool Calls
1. `get_cart({ conversation_id: "12345" })`

---

## Flow 7: Update Cart Quantity

### User Journey
User wants to change the quantity of an item

### Conversation Example

**User:** Cambia las camisas a 3

**Agent:** (calls `update_cart_item({ conversation_id: "12345", product_id: "prod_xxx", quantity: 3 })`)

**Agent Response:**
```
Actualizado! 🛒

Tu carrito:
• 3 Camisa Azul Clásica - $7.500
• 1 Pantalón Negro Formal - $4.200

Total: $11.700
```

### Tool Calls
1. `update_cart_item({ conversation_id: "12345", product_id: "prod_xxx", quantity: 3 })`

---

## Flow 8: Remove Item from Cart

### User Journey
User wants to remove a product from cart

### Conversation Example

**User:** Saca el pantalón

**Agent:** (calls `update_cart_item({ conversation_id: "12345", product_id: "prod_yyy", quantity: 0 })`)

**Agent Response:**
```
Listo, eliminé el Pantalón Negro Formal 🛒

Tu carrito:
• 3 Camisa Azul Clásica - $7.500

Total: $7.500
```

### Tool Calls
1. `update_cart_item({ conversation_id: "12345", product_id: "prod_yyy", quantity: 0 })`

---

## Flow 9: Insufficient Stock Error

### User Journey
User tries to add more items than available stock

### Conversation Example

**User:** Agregame 50 camisas

**Agent:** (calls `create_cart({ conversation_id: "12345", product_id: "prod_xxx", quantity: 50 })`)

**Agent Response:**
```
Lo siento, Camisa Azul Clásica no tiene suficiente stock 😔
Disponible: 15 unidades
Solicitado: 50 unidades

¿Querés agregar las 15 disponibles?
```

### Tool Calls
1. `create_cart(...)` → Returns error

---

## Flow 10: Handoff to Human

### User Journey
User has a question the agent can't handle

### Conversation Example

**User:** Hacen envíos a Córdoba?

**Agent:** (recognizes need for handoff)

**Agent Response:**
```
Entiendo, te conecto con un asesor humano que te ayudará mejor con esto. Un momento por favor 🙋
```

### Tool Calls
None (agent decision)

### Side Effects
- Chatwoot tags added: `derivado_humano`, `motivo_envios`
- Conversation reassigned to human agent

---

## Test Scenarios

| # | User Input | Expected Tools | Expected Outcome |
|---|------------|----------------|------------------|
| 1 | "Hola" | None | Greeting + offer to show products |
| 2 | "Qué tienen?" | list_products | Product list displayed |
| 3 | "Algo barato" | list_products(max_price) | Filtered by price |
| 4 | "Info del producto X" | get_product | Full product details |
| 5 | "Lo quiero" | create_cart | Product added, cart created |
| 6 | "Agregame 2 más" | create_cart | Quantity increased |
| 7 | "Qué hay en mi carrito" | get_cart | Cart summary shown |
| 8 | "Cambia a 5" | update_cart_item | Quantity updated |
| 9 | "Elimina ese" | update_cart_item(qty=0) | Item removed |
| 10 | "Hacen envíos?" | None | Handoff to human |

## Error Handling Patterns

### Product Not Found
```
No encontré ese producto en nuestro catálogo.
¿Querés que te muestre lo que tenemos disponible?
```

### Empty Cart
```
Aún no tenés productos en tu carrito 🛒
¿Te muestro nuestro catálogo?
```

### Database Error
```
Disculpá, tuve un problema técnico.
¿Podés intentar de nuevo en un momento?
```

### Chatwoot Tag Failure
Agent continues normally, tags fail silently (logged in Worker)
