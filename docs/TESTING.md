# Testing del MCP Server

Guía completa para ejecutar los tests del MCP Server de Laburen.

## 📋 Prerequisitos

- `curl` instalado
- `jq` instalado (`sudo apt install jq` en Ubuntu/Debian)
- `bc` instalado (para cálculos de tiempo)
- Servidor MCP corriendo (`wrangler dev` o deployed)

## 🚀 Ejecución Rápida

### Test Completo

```bash
chmod +x test-mcp.sh
./test-mcp.sh
```

### Test Rápido (Solo Tests Críticos)

```bash
chmod +x test-mcp-quick.sh
./test-mcp-quick.sh
```

## ⚙️ Configuración

### Variables de Entorno

```bash
export MCP_BASE_URL="http://localhost:8787"
export VERBOSE=true
./test-mcp.sh
```

### Opciones Disponibles

- `MCP_BASE_URL`: URL base del servidor (default: `http://localhost:8787`)
- `VERBOSE`: Mostrar requests/responses completos (default: `false`)

## 📊 Suites de Tests

### Suite 1: Explorar Productos
- Listar todos los productos
- Buscar por texto
- Filtrar por rango de precio
- Límite de resultados

### Suite 2: Detalles de Producto
- Obtener producto existente
- Manejar producto inexistente

### Suite 3: Crear Carrito
- Crear carrito nuevo
- Agregar múltiples productos
- Sumar quantity de productos duplicados

### Suite 4: Ver Carrito
- Obtener carrito con items
- Manejar carrito inexistente

### Suite 5: Editar Carrito
- Actualizar cantidades
- Eliminar items (quantity = 0)

### Suite 6: Integración Completa
- Flujo end-to-end de compra

## 🎨 Output Esperado

```
🧪 LABUREN MCP SERVER - TEST SUITE
=====================================

📋 Configuración:
   Base URL: http://localhost:8787
   Endpoint: /mcp
   Database: laburen_sales

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST SUITE: 1. Explorar Productos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Test 1.1: Listar todos los productos
✅ Test 1.1: Listar todos los productos
   └─ Productos encontrados: 100

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total de tests: 18
✅ Pasados: 18
❌ Fallados: 0
⏱️  Tiempo total: 3s

🎉 Todos los tests pasaron exitosamente!
```

## 🔍 Modo Verbose

Para ver los requests y responses completos:

```bash
VERBOSE=true ./test-mcp.sh
```

Output adicional:
```
REQUEST:
{
  "method": "tools/call",
  "params": {
    "name": "list_products",
    "arguments": {}
  }
}

RESPONSE:
{
  "content": [{
    "type": "text",
    "text": "{\"products\": [...]}"
  }]
}
Duration: 0.234s
```

## 🐛 Troubleshooting

### Error: jq no está instalado

```bash
sudo apt install jq
```

### Error: No se puede conectar al servidor

Asegúrate de que el servidor esté corriendo:

```bash
wrangler dev
```

O verifica la URL si estás usando producción:

```bash
export MCP_BASE_URL="https://your-worker.workers.dev"
./test-mcp.sh
```

### Error: bc no está instalado

```bash
sudo apt install bc
```

## 📝 Estructura de Respuestas

### Respuesta Exitosa

```json
{
  "content": [{
    "type": "text",
    "text": "{\"products\": [...], \"total\": 100}"
  }]
}
```

### Respuesta con Error

```json
{
  "content": [{
    "type": "text",
    "text": "{\"error\": \"Product not found\", \"product_id\": \"invalid-id\"}"
  }]
}
```

## 🎯 Tests Críticos (Quick Suite)

El script `test-mcp-quick.sh` ejecuta solo los tests esenciales:

1. ✅ list_products básico
2. ✅ search products
3. ✅ filter by price
4. ✅ get_product
5. ✅ create_cart
6. ✅ get_cart
7. ✅ update_cart_item

Tiempo de ejecución: ~2 segundos

## 🔄 Integración con CI/CD

### GitHub Actions

```yaml
- name: Test MCP Server
  run: |
    wrangler dev &
    sleep 5
    ./test-mcp-quick.sh
```

### Pre-deploy Hook

```bash
#!/bin/bash
wrangler dev &
SERVER_PID=$!
sleep 5

if ./test-mcp-quick.sh; then
    echo "✅ Tests passed, deploying..."
    wrangler deploy
else
    echo "❌ Tests failed, aborting deploy"
    exit 1
fi

kill $SERVER_PID
```

## 📈 Métricas de Performance

El script mide automáticamente:
- Tiempo de respuesta de cada test
- Tiempo total de ejecución
- Tasa de éxito/fallo

## 🛠️ Personalización

### Agregar Nuevos Tests

Edita `test-mcp.sh` y agrega una nueva función:

```bash
test_suite_7_custom() {
    print_suite_header "7. Custom Tests"
    
    print_test "Test 7.1: Mi test personalizado"
    local response=$(call_mcp_tool "tool_name" '{"param": "value"}')
    
    if validate_response "${response}" ".content[0].text"; then
        print_success "Test 7.1: Mi test"
    else
        print_error "Test 7.1" "Descripción del error"
    fi
}
```

Luego llámala desde `main()`:

```bash
main() {
    ...
    test_suite_7_custom
    ...
}
```

## 📞 Soporte

Si encuentras problemas:
1. Verifica que el servidor esté corriendo
2. Revisa los logs con `VERBOSE=true`
3. Verifica la conectividad con `curl http://localhost:8787/health`
