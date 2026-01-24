# Laburen AI Sales Agent Challenge

Agente de ventas de IA completo que vende productos vía WhatsApp usando MCP Server en Cloudflare Workers.

## 🎯 Características

- **MCP Server** desplegado en Cloudflare Workers
- **Base de datos D1** (SQLite) con catálogo de productos
- **Agente de IA** en Laburen.com con Claude 3.5 Sonnet
- **Integración Chatwoot** para WhatsApp y tags automáticos
- **Sistema de carritos** con gestión completa

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

```bash
npm run type-check
```

Ver casos de prueba en `docs/FLOW.md`

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