# Guía de Testing - Laburen AI Agent Challenge

Este documento detalla la estructura y ejecución de la suite de tests implementada con **Vitest** y **Mock D1 Database**.

## 🧪 Comandos de Ejecución

```bash
# Ejecutar todos los tests (Unitarios + Integración)
npm test

# Ejecutar solo tests unitarios
npm run test:unit

# Ejecutar solo tests de integración
npm run test:integration

# Modo Watch (re-ejecuta al guardar cambios)
npm run test:watch

# Tests con Cobertura completa
npm run test:coverage

# Type checking
npm run type-check
```

### Componentes con 100% Cobertura

✅ Validación de inputs (15/15)
✅ Integración Chatwoot (6/6)
✅ Herramientas MCP (3/3)
✅ Manejo de errores (6/6)

## 📂 Estructura del Proyecto

```
tests/
├── setup.ts                    # Configuración global de Vitest
├── helpers/                    # Utilidades reutilizables
│   ├── mock-d1.ts             # Mock D1 Database personalizado
│   ├── mock-fetch.ts          # Mock para API de Chatwoot
│   └── db-setup.ts            # Gestión de base de datos
├── fixtures/                   # Datos de prueba estáticos
│   └── products.ts            # Productos mock con UUIDs válidos
├── unit/                       # Tests Unitarios
│   ├── db/                    # Queries de base de datos
│   ├── integrations/          # Integraciones externas (Chatwoot)
│   ├── mcp/                   # Handlers y Tools del modelo
│   └── validation/            # Lógica de validación de inputs
└── integration/                # Tests de Integración
    ├── purchase-flow.test.ts          # Flujo completo E2E
    ├── concurrent-carts.test.ts       # Aislamiento de sesiones
    ├── error-handling.test.ts         # Manejo de errores
    ├── search-filters.test.ts         # Búsqueda y filtros
    └── stock-management.test.ts       # Gestión de stock
```

## 🛡️ Principios de Testing

1. **Seguridad**: No se usan credenciales reales. `.env.test` contiene valores mock.
2. **Clean Code**: Helpers para setup/teardown y mocks reutilizables.
3. **Validación**: Tests específicos para verificar inputs antes de procesarlos.
4. **Cobertura**: Objetivo de >70% de cobertura de código ✅ (75% actual).

## ⚙️ Configuración

### Vitest Config

`vitest.config.ts` está configurado para usar el entorno `miniflare` con bindings simulados para D1 Database y variables de entorno.

### Mock D1 Database

Debido a que Miniflare v2 no soporta D1 nativamente, se implementó un mock personalizado en `tests/helpers/mock-d1.ts` que simula:

✅ **Soportado**:
- SELECT, INSERT, UPDATE, DELETE
- WHERE, ORDER BY, LIMIT
- prepare(), bind(), run(), first(), all()

⚠️ **Limitaciones**:
- No soporta JOINs
- LIKE con caracteres especiales limitado
- Sin transacciones

## 🔍 Tests Fallantes Conocidos

### Queries con JOINs (6 tests)
**Causa**: Mock D1 no soporta JOINs entre tablas.
**Solución futura**: Usar `better-sqlite3` o actualizar a Miniflare v3.

### LIKE con Unicode (3 tests)
**Causa**: Regex LIKE no maneja bien caracteres acentuados.
**Workaround**: Usar búsquedas sin acentos en tests.

## 📝 Mejores Prácticas

### Usar Fixtures

```typescript
import { mockProducts } from '../fixtures/products'
```

### UUIDs Válidos

```typescript
// ✅ Correcto
const productId = '550e8400-e29b-41d4-a716-446655440001'

// ❌ Incorrecto
const productId = 'test-product-1'
```

### Mock Chatwoot

```typescript
import { mockChatwootAPI, restoreFetch } from '../helpers/mock-fetch'

beforeEach(() => mockChatwootAPI())
afterEach(() => restoreFetch())
```

### Usar Global DB

```typescript
// ✅ Correcto
const product = await getProductById(DB, productId)

// ❌ Incorrecto (DB no está disponible fuera de beforeEach)
const env = { DB, ... }  // En el scope de describe()
```

## 🚀 CI/CD

Recomendado para GitHub Actions:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run type-check
```

## 📚 Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Miniflare Documentation](https://miniflare.dev/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
