# Changelog

## [2.0.0] - 2026-01-28

### Changed - Traducción Completa de Documentación

#### Documentación en Español
- ✅ Traducido `ARCHITECTURE.md` completamente al español
- ✅ Traducido `MCP_TOOLS.md` completamente al español
- ✅ Actualizado `README.md` con descripciones mejoradas
- ✅ `TESTING.md` ya estaba en español
- ✅ `FLOW.md` ya estaba en español
- ✅ Mantenidos todos los ejemplos de código y JSON
- ✅ Mantenidos términos técnicos apropiados en inglés (MCP, API, Worker, etc.)

---

### Changed - Architecture Update: Evolution API Integration

#### WhatsApp Integration Layer
- ✅ Agregada **Evolution API** desplegada en Railway como capa de integración con WhatsApp
- ✅ Actualizado flujo de arquitectura: WhatsApp → Evolution API → Chatwoot → Laburen Agent → MCP Server
- ✅ Evolution API maneja la conexión con WhatsApp Business API y autenticación QR
- ✅ Mensajes se reenvían a Chatwoot vía webhook para procesamiento

#### Documentation Updates
- ✅ Actualizado `ARCHITECTURE.md` con nuevo diagrama de overview incluyendo Evolution API
- ✅ Agregado componente "Evolution API (Railway)" en Component Details
- ✅ Actualizados diagramas de flujo de datos (Product Search Flow y Add to Cart Flow)
- ✅ Actualizado Deployment Architecture diagram con Railway y PostgreSQL
- ✅ Actualizado `README.md` con stack tecnológico completo
- ✅ Agregada mención de Evolution API en características principales

#### New Architecture Flow
```
WhatsApp Business
    ↓
Evolution API (Railway + PostgreSQL)
    ↓ (webhook)
Chatwoot CRM
    ↓
Laburen AI Agent (Claude 3.5 Sonnet)
    ↓ (MCP Protocol)
MCP Server (Cloudflare Workers)
    ↓
D1 Database (Cloudflare)
```

#### Infrastructure Components
1. **Railway**: Evolution API + PostgreSQL database
2. **Cloudflare**: MCP Workers + D1 SQLite database
3. **Chatwoot**: CRM y gestión de conversaciones
4. **Laburen**: AI Agent hosting

---

### Fixed - Documentation Updates

#### MCP Tools Documentation
- ✅ Actualizado `ARCHITECTURE.md` para reflejar **7 herramientas MCP** (antes decía 5)
- ✅ Agregadas `apply_chatwoot_tag` y `handoff_to_human` al diagrama de arquitectura
- ✅ Actualizado diagrama Mermaid con las nuevas herramientas y sus integraciones
- ✅ Expandida sección de características en `README.md` para incluir todas las capacidades
- ✅ Corregida descripción del MCP Server: "Integrates with Chatwoot API for tagging and handoff"

#### Tools Completas Documentadas
1. `list_products` - Búsqueda y listado de productos
2. `get_product` - Detalles de producto específico
3. `create_cart` - Crear/actualizar carrito
4. `get_cart` - Consultar carrito
5. `update_cart_item` - Modificar cantidades o eliminar items
6. `apply_chatwoot_tag` - Aplicar tags a conversaciones
7. `handoff_to_human` - Transferir a agente humano

---

## [1.0.0] - 2026-01-25

### Added - Testing Infrastructure

#### Test Framework Setup
- ✅ Configuración completa de **Vitest** como framework de testing
- ✅ Configuración de **Miniflare** para simular entorno Cloudflare Workers
- ✅ Mock personalizado de **D1 Database** (`tests/helpers/mock-d1.ts`)
- ✅ Helpers de testing reutilizables (mock-fetch, db-setup)
- ✅ Fixtures con datos de prueba y UUIDs válidos

#### Test Coverage
- ✅ **49/65 tests pasando (75% cobertura)**
- ✅ Tests unitarios: 37/47 (79%)
- ✅ Tests de integración: 12/18 (67%)

#### Test Suites

**Tests Unitarios** (`tests/unit/`):
- ✅ Validación de inputs (15/15) - 100%
- ✅ Integración Chatwoot (6/6) - 100%
- ✅ Herramientas MCP (3/3) - 100%
- ⚠️ Queries de base de datos (7/15) - 47%
- ⚠️ Handlers MCP (6/8) - 75%

**Tests de Integración** (`tests/integration/`):
- ✅ Manejo de errores (6/6) - 100%
- ⚠️ Búsqueda y filtros (4/6) - 67%
- ⚠️ Gestión de stock (1/3) - 33%
- ⚠️ Flujo de compra (0/1) - 0%
- ⚠️ Carritos concurrentes (0/1) - 0%

#### NPM Scripts
```json
{
  "test": "vitest",
  "test:unit": "vitest tests/unit",
  "test:integration": "vitest tests/integration",
  "test:watch": "vitest --watch",
  "test:coverage": "vitest --coverage",
  "type-check": "tsc --noEmit"
}
```

#### Documentation
- ✅ Actualizado `README.md` con sección completa de testing
- ✅ Expandido `docs/TESTING.md` con guía comprensiva
- ✅ Documentación de limitaciones conocidas del mock D1
- ✅ Mejores prácticas y troubleshooting

### Technical Details

#### Mock D1 Implementation
Creado mock personalizado debido a que Miniflare v2 no soporta D1:
- Simula API completa de D1 (prepare, bind, run, first, all)
- Usa estructuras en memoria (Map) para tablas
- Parsea SQL básico con regex
- Limitaciones: No soporta JOINs, LIKE con Unicode limitado

#### Known Issues
- **JOINs no soportados**: 6 tests fallan por queries con JOIN entre cart_items y products
- **LIKE con acentos**: 3 tests fallan por búsquedas con caracteres especiales (ó, á)
- **Validación conversation_id**: 1 test falla por uso de `Date.now()` que genera caracteres inválidos

### Files Changed

#### New Files
- `tests/setup.ts` - Configuración global de Vitest
- `tests/helpers/mock-d1.ts` - Mock D1 Database (350+ líneas)
- `tests/helpers/mock-fetch.ts` - Mock fetch para Chatwoot
- `tests/helpers/db-setup.ts` - Helpers seed/cleanup
- `tests/fixtures/products.ts` - Datos de prueba
- `tests/unit/**/*.test.ts` - 5 archivos de tests unitarios
- `tests/integration/**/*.test.ts` - 5 archivos de tests de integración
- `tests/simple.test.ts` - Test de sanity check
- `vitest.config.ts` - Configuración de Vitest

#### Modified Files
- `.gitignore` - Agregados coverage/, .nyc_output/, .gemini/
- `README.md` - Sección de testing expandida
- `docs/TESTING.md` - Documentación completa actualizada
- `package.json` - Scripts de testing agregados

#### Dependencies Added
```json
{
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241127.0",
    "@miniflare/d1": "^2.14.2",
    "@types/node": "^22.10.2",
    "@vitest/coverage-v8": "^2.1.9",
    "miniflare": "^2.14.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.9"
  }
}
```

### Future Improvements

#### Short Term
- [ ] Mejorar mock D1 para soportar JOINs básicos
- [ ] Arreglar regex LIKE para caracteres Unicode
- [ ] Actualizar tests de conversation_id

#### Long Term
- [ ] Migrar a Miniflare v3 cuando soporte D1 nativamente
- [ ] Considerar `better-sqlite3` para tests con DB real en memoria
- [ ] Alcanzar 90%+ de cobertura de código
- [ ] Agregar tests E2E con Playwright

### Breaking Changes
Ninguno - Solo adiciones de testing, no afecta código de producción.

### Migration Guide
No se requiere migración. Para ejecutar tests:
```bash
npm install
npm test
```

---