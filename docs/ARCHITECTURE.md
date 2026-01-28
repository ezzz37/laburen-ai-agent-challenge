# System Architecture

## Overview

```mermaid
graph TB
    User[User via WhatsApp] --> CW[Chatwoot]
    CW --> Agent[AI Agent - Laburen]
    Agent --> MCP[MCP Server - Cloudflare Worker]
    MCP --> D1[(D1 Database)]
    MCP --> CW_API[Chatwoot API]
    
    style User fill:#e1f5ff
    style Agent fill:#fff4e1
    style MCP fill:#e8f5e9
    style D1 fill:#f3e5f5
    style CW fill:#ffe0e0
```

## Component Details

### WhatsApp + Chatwoot
- Entry point for user interactions
- Manages conversation state
- Provides conversation_id for cart tracking
- Receives automated tags from MCP Server

### AI Agent (Laburen)
- Claude 3.5 Sonnet model
- Processes user messages
- Calls MCP tools for data operations
- Formats responses for users

### MCP Server (Cloudflare Worker)
- Exposes 5 tools via MCP protocol
- Handles business logic
- Manages database operations
- Integrates with Chatwoot API for tagging

### D1 Database
- SQLite database on Cloudflare
- Stores products, carts, and cart_items
- Automatic timestamp management via triggers

## Data Flow

### Product Search Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as Agent
    participant M as MCP Server
    participant D as D1 Database
    
    U->>A: "Qué productos tienen?"
    A->>M: list_products()
    M->>D: SELECT * FROM products
    D-->>M: Product list
    M-->>A: JSON response
    A-->>U: Formatted product list
```

### Add to Cart Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as Agent
    participant M as MCP Server
    participant D as D1 Database
    participant C as Chatwoot API
    
    U->>A: "Me llevo 2 camisas"
    A->>M: create_cart(conv_id, prod_id, qty=2)
    M->>D: Check stock
    D-->>M: Stock available
    M->>D: Create/update cart
    M->>D: Add cart_item
    D-->>M: Cart with items
    M->>C: Add tags (async)
    C-->>M: Tags added
    M-->>A: Cart summary
    A-->>U: "Agregado al carrito! Total: $X"
```

## Database Schema

```mermaid
erDiagram
    PRODUCTS ||--o{ CART_ITEMS : contains
    CARTS ||--o{ CART_ITEMS : has
    
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

## MCP Tools Architecture

```mermaid
graph LR
    A[Agent] -->|MCP Protocol| S[MCP Server]
    S --> T1[list_products]
    S --> T2[get_product]
    S --> T3[create_cart]
    S --> T4[get_cart]
    S --> T5[update_cart_item]
    
    T1 --> Q[DB Queries]
    T2 --> Q
    T3 --> Q
    T3 --> CH[Chatwoot Tags]
    T4 --> Q
    T5 --> Q
    
    style S fill:#e8f5e9
    style Q fill:#f3e5f5
    style CH fill:#ffe0e0
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Cloudflare Edge"
        W[Worker]
        D1[(D1 Database)]
        W --> D1
    end
    
    subgraph "External Services"
        L[Laburen Platform]
        CW[Chatwoot]
    end
    
    L -->|MCP Calls| W
    W -->|Tag API| CW
    
    style W fill:#e8f5e9
    style D1 fill:#f3e5f5
    style L fill:#fff4e1
    style CW fill:#ffe0e0
```

## Security Considerations

### Authentication
- Chatwoot API token stored as Cloudflare secret
- MCP endpoint can be protected with API key if needed
- D1 database only accessible from Worker

### Data Privacy
- Conversation IDs used for cart isolation
- No PII stored in database
- Cart data can be purged periodically

### Rate Limiting
- Cloudflare Workers have built-in DDoS protection
- Chatwoot API calls include retry logic with backoff
- Database queries optimized with indexes

## Scalability

### Current Limits
- Cloudflare Workers: 50ms CPU time per request
- D1 Database: 100k reads/day (free tier)
- MCP tools designed for sub-100ms response time

### Optimization Strategies
- Database indexes on frequently queried columns
- Async Chatwoot tagging (non-blocking)
- Efficient SQL queries with JOINs
- Minimal data transfer in responses

## Monitoring

### Available Metrics
- Cloudflare Analytics: request count, errors, latency
- Worker logs: `wrangler tail` for real-time debugging
- D1 query performance via Cloudflare dashboard

### Error Handling
- All tools return structured error responses
- Chatwoot failures logged but don't block operations
- Database errors caught and returned to agent
