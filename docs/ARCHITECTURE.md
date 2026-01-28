# Arquitectura del Sistema

## Vista General

```mermaid
graph TB
    User[Usuario vía WhatsApp] --> EVO[Evolution API - Railway]
    EVO --> CW[Chatwoot CRM]
    CW --> Agent[Agente IA - Laburen]
    Agent --> MCP[Servidor MCP - Cloudflare Worker]
    MCP --> D1[(Base de Datos D1)]
    MCP --> CW_API[Chatwoot API]
    
    style User fill:#e1f5ff
    style EVO fill:#d4edda
    style CW fill:#ffe0e0
    style Agent fill:#fff4e1
    style MCP fill:#e8f5e9
    style D1 fill:#f3e5f5
```

## Detalles de Componentes

### WhatsApp
- Canal de comunicación principal para usuarios finales
- Los mensajes se envían/reciben a través de WhatsApp Business API
- Integrado vía Evolution API

### Evolution API (Railway)
- API de WhatsApp Web de código abierto
- Desplegada en Railway.app
- Maneja la conexión con WhatsApp y enrutamiento de mensajes
- Reenvía mensajes a Chatwoot vía webhook
- Gestiona la autenticación por código QR para WhatsApp

### Chatwoot CRM
- Recibe mensajes desde Evolution API
- Gestiona el estado e historial de conversaciones
- Proporciona conversation_id para seguimiento de carritos
- Recibe etiquetas automatizadas desde el Servidor MCP
- Permite derivación a agentes humanos cuando sea necesario

### Agente IA (Laburen)
- Modelo Claude 3.5 Sonnet alojado en Laburen.com
- Procesa mensajes de usuarios desde Chatwoot
- Llama a herramientas MCP para operaciones de datos
- Formatea respuestas para usuarios
- Maneja el flujo de ventas conversacional

### Servidor MCP (Cloudflare Worker)
- Expone 7 herramientas vía protocolo MCP
- Maneja la lógica de negocio
- Gestiona operaciones de base de datos
- Se integra con Chatwoot API para etiquetado y derivación

### Base de Datos D1
- Base de datos SQLite en Cloudflare
- Almacena productos, carritos y cart_items
- Gestión automática de timestamps vía triggers

## Flujo de Datos

### Flujo de Búsqueda de Productos

```mermaid
sequenceDiagram
    participant U as Usuario (WhatsApp)
    participant E as Evolution API
    participant CW as Chatwoot
    participant A as Agente IA
    participant M as Servidor MCP
    participant D as Base de Datos D1
    
    U->>E: "Qué productos tienen?"
    E->>CW: Reenviar mensaje vía webhook
    CW->>A: Mensaje + conversation_id
    A->>M: list_products()
    M->>D: SELECT * FROM products
    D-->>M: Lista de productos
    M-->>A: Respuesta JSON
    A-->>CW: Lista de productos formateada
    CW-->>E: Mensaje de respuesta
    E-->>U: Mensaje de WhatsApp
```

### Flujo de Agregar al Carrito

```mermaid
sequenceDiagram
    participant U as Usuario (WhatsApp)
    participant E as Evolution API
    participant CW as Chatwoot
    participant A as Agente IA
    participant M as Servidor MCP
    participant D as Base de Datos D1
    participant C as Chatwoot API
    
    U->>E: "Me llevo 2 camisas"
    E->>CW: Reenviar mensaje
    CW->>A: Mensaje + conversation_id
    A->>M: create_cart(conv_id, prod_id, qty=2)
    M->>D: Verificar stock
    D-->>M: Stock disponible
    M->>D: Crear/actualizar carrito
    M->>D: Agregar cart_item
    D-->>M: Carrito con items
    M->>C: Agregar etiquetas (async)
    C-->>M: Etiquetas agregadas
    M-->>A: Resumen del carrito
    A-->>CW: "Agregado al carrito! Total: $X"
    CW-->>E: Respuesta
    E-->>U: Mensaje de WhatsApp
```

## Esquema de Base de Datos

```mermaid
erDiagram
    PRODUCTS ||--o{ CART_ITEMS : contiene
    CARTS ||--o{ CART_ITEMS : tiene
    
    PRODUCTS {
        string id PK
        string name
        string description
        float price
        int stock
        string created_at
    }
    
    CARTS {
        string id PK
        string conversation_id UK
        string created_at
        string updated_at
    }
    
    CART_ITEMS {
        string id PK
        string cart_id FK
        string product_id FK
        int quantity
        string added_at
    }
```

## Arquitectura de Herramientas MCP

```mermaid
graph LR
    A[Agente] -->|Protocolo MCP| S[Servidor MCP]
    S --> T1[list_products]
    S --> T2[get_product]
    S --> T3[create_cart]
    S --> T4[get_cart]
    S --> T5[update_cart_item]
    S --> T6[apply_chatwoot_tag]
    S --> T7[handoff_to_human]
    
    T1 --> Q[Consultas DB]
    T2 --> Q
    T3 --> Q
    T3 --> CH[Chatwoot API]
    T4 --> Q
    T5 --> Q
    T6 --> CH
    T7 --> CH
    
    style S fill:#e8f5e9
    style Q fill:#f3e5f5
    style CH fill:#ffe0e0
```

## Arquitectura de Despliegue

```mermaid
graph TB
    subgraph "Railway"
        EVO[Evolution API]
        EVODB[(PostgreSQL)]
        EVO --> EVODB
    end
    
    subgraph "Cloudflare Edge"
        W[MCP Worker]
        D1[(Base de Datos D1)]
        W --> D1
    end
    
    subgraph "Servicios Externos"
        WA[WhatsApp Business]
        L[Plataforma Laburen]
        CW[Chatwoot CRM]
    end
    
    WA --> EVO
    EVO -->|Webhook| CW
    CW --> L
    L -->|Llamadas MCP| W
    W -->|API Tag/Handoff| CW
    
    style EVO fill:#d4edda
    style EVODB fill:#cfe2ff
    style W fill:#e8f5e9
    style D1 fill:#f3e5f5
    style L fill:#fff4e1
    style CW fill:#ffe0e0
    style WA fill:#e1f5ff
```

## Consideraciones de Seguridad

### Autenticación
- Token de API de Chatwoot almacenado como secreto de Cloudflare
- El endpoint MCP puede protegerse con API key si es necesario
- Base de datos D1 solo accesible desde el Worker

### Privacidad de Datos
- IDs de conversación usados para aislamiento de carritos
- No se almacena PII en la base de datos
- Los datos del carrito pueden purgarse periódicamente

### Limitación de Tasa
- Cloudflare Workers tienen protección DDoS integrada
- Las llamadas a la API de Chatwoot incluyen lógica de reintento con backoff
- Consultas de base de datos optimizadas con índices

## Escalabilidad

### Límites Actuales
- Cloudflare Workers: 50ms de tiempo de CPU por solicitud
- Base de Datos D1: 100k lecturas/día (tier gratuito)
- Herramientas MCP diseñadas para tiempo de respuesta sub-100ms

### Estrategias de Optimización
- Índices de base de datos en columnas consultadas frecuentemente
- Etiquetado asíncrono de Chatwoot (no bloqueante)
- Consultas SQL eficientes con JOINs
- Transferencia mínima de datos en respuestas

## Monitoreo

### Métricas Disponibles
- Cloudflare Analytics: conteo de solicitudes, errores, latencia
- Logs del Worker: `wrangler tail` para debugging en tiempo real
- Rendimiento de consultas D1 vía dashboard de Cloudflare

### Manejo de Errores
- Todas las herramientas retornan respuestas de error estructuradas
- Fallos de Chatwoot se registran pero no bloquean operaciones
- Errores de base de datos se capturan y retornan al agente
