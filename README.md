# Laburen AI Sales Agent Challenge

Agente de ventas de IA completo que vende productos vía WhatsApp usando MCP Server en Cloudflare Workers.

## 🎯 Características

- **MCP Server** desplegado en Cloudflare Workers con 7 herramientas
- **Base de datos D1** (SQLite) con catálogo de productos
- **Agente de IA** en Laburen.com con Claude 3.5 Sonnet
- **Integración Chatwoot** para WhatsApp, tags automáticos y handoff a humanos
- **Sistema de carritos** con gestión completa (crear, consultar, actualizar)
- **Búsqueda y filtros** de productos por precio y términos
- **Gestión de conversaciones** con categorización automática

## 🛠️ Stack Tecnológico

- **Backend**: Cloudflare Workers + TypeScript
- **Database**: Cloudflare D1 (SQLite)
- **MCP SDK**: @modelcontextprotocol/sdk
- **CRM**: Chatwoot API

## 📋 Prerequisitos

- Node.js 18+ y npm
- Cuenta de Cloudflare con Workers habilitado
- Wrangler CLI: `npm install -g wrangler`
- Cuenta autenticada: `wrangler login`

## 🚀 Setup

### 1. Clonar e instalar dependencias

```bash
git clone <repo>
cd laburen-ai-agent-challenge
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores reales de Cloudflare y Chatwoot.

### 3. Configurar secrets en Cloudflare

```bash
wrangler secret put CHATWOOT_TOKEN
wrangler secret put CHATWOOT_ACCOUNT_ID
```

### 4. Desarrollo local

```bash
wrangler dev
```

El servidor estará disponible en `http://localhost:8787`

### 5. Deploy a producción

```bash
wrangler deploy
```

## 📚 Documentación

- [Arquitectura del Sistema](./docs/ARCHITECTURE.md) - Diagramas y componentes
- [Flujos de Interacción](./docs/FLOW.md) - Escenarios de conversación
- [Especificación de MCP Tools](./docs/MCP_TOOLS.md) - API reference
- [Database Schema](./docs/database/schema.sql) - Estructura de la DB
- [System Prompt del Agente](./prompts/system-prompt.md) - Personalidad del agente
- [Instrucciones de Configuración](./prompts/instructions.md) - Setup en Laburen

## 🗄️ Base de Datos

**Nota**: La base de datos ya está poblada vía Cloudflare Dashboard GUI. No es necesario ejecutar scripts de seed.

Ver `docs/database/schema.sql` para referencia de la estructura.

## 🧪 Testing

El proyecto incluye una suite completa de tests unitarios e integración con **Vitest**.

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Solo tests unitarios
npm run test:unit

# Solo tests de integración
npm run test:integration

# Con cobertura de código
npm run test:coverage

# Modo watch (desarrollo)
npm run test:watch
```

### Cobertura Actual

- **Tests Unitarios**: 37/47 pasando (79%)
- **Tests de Integración**: 12/18 pasando (67%)
- **Cobertura General**: 49/65 tests (75%)

### Componentes Testeados

✅ **100% Cobertura**:
- Validación de inputs
- Integración con Chatwoot
- Herramientas MCP (schemas)
- Manejo de errores

✅ **Cobertura Parcial**:
- Queries de base de datos (limitaciones del mock D1)
- Handlers MCP
- Búsquedas y filtros

### Estructura de Tests

```
tests/
├── setup.ts                    # Configuración global
├── helpers/
│   ├── mock-d1.ts             # Mock D1 Database
│   ├── mock-fetch.ts          # Mock fetch para Chatwoot
│   └── db-setup.ts            # Helpers de DB
├── fixtures/
│   └── products.ts            # Datos de prueba
├── unit/                      # Tests unitarios
│   ├── db/
│   ├── integrations/
│   ├── mcp/
│   └── validation/
└── integration/               # Tests de integración
    ├── concurrent-carts.test.ts
    ├── error-handling.test.ts
    ├── purchase-flow.test.ts
    ├── search-filters.test.ts
    └── stock-management.test.ts
```

Ver casos de prueba detallados en `docs/TESTING.md`

## 📁 Estructura del Proyecto

```
laburen-ai-agent-challenge/
├── .env.example              # Template de variables
├── .gitignore
├── LICENSE
├── package.json
├── README.md
├── tsconfig.json
├── wrangler.toml
│
├── docs/
│   ├── database/
│   │   └── schema.sql        # Documentación del schema
│   ├── ARCHITECTURE.md
│   ├── FLOW.md
│   └── MCP_TOOLS.md
│
├── prompts/
│   ├── instructions.md
│   └── system-prompt.md
│
└── src/
    ├── index.ts              # Worker entry point
    ├── types.ts              # TypeScript definitions
    ├── mcp/
    │   ├── server.ts         # MCP Server setup
    │   ├── tools.ts          # Tool schemas
    │   └── handlers.ts       # Tool implementations
    ├── db/
    │   └── queries.ts        # Database operations
    └── integrations/
        └── chatwoot.ts       # Chatwoot API client
```

## 🔐 Gestión de Secrets

- **Desarrollo local**: Usa `.env` (gitignored)
- **Producción**: Usa `wrangler secret put` para tokens sensibles
- **Template**: `.env.example` documenta las variables necesarias

## 📝 Licencia

MIT