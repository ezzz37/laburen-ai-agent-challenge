# Configuración del Agente en Laburen

## Paso 1: Obtener URL del MCP Server

Después de desplegar tu Worker a Cloudflare:

```bash
wrangler deploy
```

Obtendrás una URL como: `https://laburen-ai-agent-challenge.YOUR-SUBDOMAIN.workers.dev`

## Paso 2: Configurar MCP en Laburen

1. Accede a Laburen.com
2. Ve a la sección de configuración del agente
3. Agrega un nuevo MCP Server con estos datos:

**Nombre**: Laburen Sales Agent
**URL**: `https://laburen-ai-agent-challenge.YOUR-SUBDOMAIN.workers.dev/mcp`
**Método**: POST

## Paso 3: Configurar el Agente

### Modelo
- **Modelo**: Claude 3.5 Sonnet
- **Temperature**: 0.7
- **Max Tokens**: 1024

### System Prompt
Copia el contenido completo de `prompts/system-prompt.md`

### Tools Habilitadas
Asegúrate de que el agente tenga acceso a todas las tools del MCP:
- list_products
- get_product
- create_cart
- get_cart
- update_cart_item

## Paso 4: Conectar con Chatwoot

### Obtener Credenciales de Chatwoot

1. Accede a tu instancia de Chatwoot
2. Ve a Settings → Integrations → API
3. Genera un nuevo Access Token
4. Anota tu Account ID (visible en la URL: `/app/accounts/{ACCOUNT_ID}/`)

### Configurar Variables en Cloudflare

```bash
wrangler secret put CHATWOOT_TOKEN
```

Pega tu token cuando te lo solicite.

Edita `wrangler.toml` y actualiza:
```toml
[vars]
CHATWOOT_ACCOUNT_ID = "TU_ACCOUNT_ID"
```

Redeploy:
```bash
wrangler deploy
```

## Paso 5: Conectar WhatsApp a Chatwoot

1. En Chatwoot, ve a Settings → Inboxes → Add Inbox
2. Selecciona WhatsApp (Cloud API o Business API)
3. Sigue el wizard de configuración
4. Anota el Inbox ID

## Paso 6: Configurar el Agente en Chatwoot

1. Ve al inbox de WhatsApp en Chatwoot
2. Settings → Collaborators
3. Agrega el agente de Laburen como colaborador
4. Configura auto-assignment al agente

## Paso 7: Probar el Flujo Completo

Envía un mensaje de WhatsApp a tu número configurado:

```
Hola, qué productos tienen?
```

El agente debería:
1. Responder listando productos
2. Permitirte agregar al carrito
3. Crear tags automáticos en Chatwoot cuando agregues productos

## Variables de Entorno Requeridas

### En wrangler.toml (públicas)
```toml
CHATWOOT_URL = "https://chatwoot.laburen.com"
CHATWOOT_ACCOUNT_ID = "1"
```

### Secrets (privadas)
```bash
wrangler secret put CHATWOOT_TOKEN
```

## Troubleshooting

### El agente no responde
- Verifica que el Worker esté deployed: `wrangler tail`
- Revisa logs en Cloudflare Dashboard
- Confirma que la URL del MCP sea correcta

### Las tools no funcionan
- Verifica que la base de datos D1 esté creada y poblada
- Ejecuta: `wrangler d1 execute laburen_sales --command="SELECT COUNT(*) FROM products"`

### Los tags no se crean en Chatwoot
- Verifica el CHATWOOT_TOKEN: debe tener permisos de escritura
- Revisa logs del Worker para errores de Chatwoot API
- Los tags fallan silenciosamente, no bloquean la operación

## Endpoints Disponibles

- `GET /health` - Health check del Worker
- `POST /mcp` - Endpoint MCP para el agente

## Próximos Pasos

1. Prueba todos los flujos de conversación
2. Ajusta el system prompt según necesites
3. Configura webhooks de Chatwoot si necesitas notificaciones
4. Monitorea métricas en Cloudflare Analytics
