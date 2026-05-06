# Routing API

API de cálculo de rotas protegida utilizando OSRM (Open Source Routing Machine).

---

## Sumário

- [1. Visão Geral](#1-visão-geral)
- [2. Autenticação](#2-autenticação)
- [3. Rate Limiting](#3-rate-limiting)
- [4. Endpoints](#4-endpoints)
- [5. Erros](#5-erros)
- [6. Exemplos](#6-exemplos)
- [7. Configuração](#7-configuração)
- [8. Arquitetura](#8-arquitetura)

---

## 1. Visão Geral

A Routing API fornece acesso seguro ao serviço OSRM para cálculo de rotas de carro.

### Características

- **Autenticação JWT** obrigatória
- **Rate Limiting** multi-nível (burst, minuto, hora)
- **Cache** inteligente de rotas frequentes
- **Circuit Breaker** para resiliência
- **Retry** com backoff exponencial
- **Logging** estruturado
- **Métricas** de performance

### Base URL

```
POST /v1/routing/route
GET  /v1/routing/route
POST /v1/routing/route/async
GET  /v1/routing/rate-limit
```

---

## 2. Autenticação

Todas as requisições requerem token JWT válido no header:

```
Authorization: Bearer <token>
```

O usuário deve estar autenticado e ter email verificado.

---

## 3. Rate Limiting

### Limites

| Tipo | Desenvolvimento | Produção |
|------|-----------------|----------|
| Burst (1s) | 10 req | 5 req |
| Por minuto | 60 req | 30 req |
| Por hora | 500 req | 300 req |

### Headers de Resposta

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1733757600
```

### Resposta 429 (Rate Limit Excedido)

```json
{
  "error": {
    "message": "Limite de requisições excedido. Aguarde 45 segundos.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

Headers adicionais:
```
Retry-After: 45
```

---

## 4. Endpoints

### POST /v1/routing/route

Calcula a rota entre dois pontos.

#### Request

```json
{
  "originLat": -23.550520,
  "originLng": -46.633308,
  "destinationLat": -23.561414,
  "destinationLng": -46.656070,
  "includeSteps": false,
  "includeGeometry": false
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| originLat | number | Sim | Latitude origem (-90 a 90) |
| originLng | number | Sim | Longitude origem (-180 a 180) |
| destinationLat | number | Sim | Latitude destino (-90 a 90) |
| destinationLng | number | Sim | Longitude destino (-180 a 180) |
| includeSteps | boolean | Não | Incluir passos de navegação (default: false) |
| includeGeometry | boolean | Não | Incluir geometria GeoJSON (default: false) |

#### Response (200)

```json
{
  "distanceMeters": 5234.5,
  "distanceKm": 5.23,
  "durationSeconds": 720,
  "durationMinutes": 12,
  "durationFormatted": "12 min",
  "cached": false,
  "calculatedAt": "2025-12-09T14:30:00Z"
}
```

#### Response com Steps (includeSteps: true)

```json
{
  "distanceMeters": 5234.5,
  "distanceKm": 5.23,
  "durationSeconds": 720,
  "durationMinutes": 12,
  "durationFormatted": "12 min",
  "steps": [
    {
      "distanceMeters": 150.5,
      "durationSeconds": 25,
      "instruction": "turn right",
      "name": "Rua Augusta",
      "maneuver": "turn"
    },
    {
      "distanceMeters": 500,
      "durationSeconds": 60,
      "instruction": "continue straight",
      "name": "Avenida Paulista",
      "maneuver": "continue"
    }
  ],
  "cached": false,
  "calculatedAt": "2025-12-09T14:30:00Z"
}
```

#### Response com Geometry (includeGeometry: true)

```json
{
  "distanceMeters": 5234.5,
  "distanceKm": 5.23,
  "durationSeconds": 720,
  "durationMinutes": 12,
  "durationFormatted": "12 min",
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-46.633308, -23.550520],
      [-46.634000, -23.551000],
      [-46.656070, -23.561414]
    ]
  },
  "cached": false,
  "calculatedAt": "2025-12-09T14:30:00Z"
}
```

---

### GET /v1/routing/route

Versão GET para testes e debugging.

```
GET /v1/routing/route?originLat=-23.550520&originLng=-46.633308&destinationLat=-23.561414&destinationLng=-46.656070&includeSteps=false&includeGeometry=false
```

---

### POST /v1/routing/route/async

Enfileira requisição para processamento assíncrono.

#### Request

```json
{
  "originLat": -23.550520,
  "originLng": -46.633308,
  "destinationLat": -23.561414,
  "destinationLng": -46.656070
}
```

#### Headers (opcional)

```
X-Correlation-Id: my-custom-id-123
```

#### Response (202 Accepted)

```json
{
  "correlationId": "corr_123e4567-e89b-12d3-a456-426614174000",
  "status": "QUEUED",
  "message": "Requisição enfileirada para processamento"
}
```

---

### GET /v1/routing/rate-limit

Consulta informações do rate limit atual.

#### Response (200)

```json
{
  "remaining": 55,
  "limit": 60,
  "resetAt": 1733757600,
  "resetInSeconds": 45
}
```

---

## 5. Erros

### Tabela de Erros

| HTTP | Code | Descrição | Quando |
|------|------|-----------|--------|
| 400 | INVALID_COORDINATES | Coordenadas inválidas | Lat/lng fora do range |
| 400 | POINTS_TOO_CLOSE | Pontos muito próximos | Distância < 50m |
| 400 | DISTANCE_TOO_LARGE | Distância muito grande | Distância > 500km |
| 400 | OSRM_ROUTE_ERROR | Erro no cálculo OSRM | Rota impossível |
| 401 | UNAUTHORIZED | Token inválido | Auth falhou |
| 403 | FORBIDDEN | Acesso negado | Email não verificado |
| 422 | VALIDATION_ERROR | Campos inválidos | Validação falhou |
| 429 | RATE_LIMIT_EXCEEDED | Limite excedido | Muitas requisições |
| 500 | ROUTE_CALCULATION_FAILED | Falha no cálculo | Erro após retries |
| 503 | ROUTING_UNAVAILABLE | Serviço indisponível | Circuit breaker aberto |

### Formato de Erro

```json
{
  "error": {
    "message": "Descrição do erro",
    "code": "ERROR_CODE"
  }
}
```

### Validação

```json
{
  "error": {
    "message": "Campos inválidos",
    "fields": {
      "originLat": "Latitude de origem é obrigatória",
      "destinationLng": "Longitude deve ser entre -180 e 180"
    }
  }
}
```

---

## 6. Exemplos

### cURL - Rota Básica

```bash
curl -X POST 'http://localhost:8080/v1/routing/route' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "originLat": -23.550520,
    "originLng": -46.633308,
    "destinationLat": -23.561414,
    "destinationLng": -46.656070
  }'
```

### cURL - Rota com Steps e Geometry

```bash
curl -X POST 'http://localhost:8080/v1/routing/route' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "originLat": -23.550520,
    "originLng": -46.633308,
    "destinationLat": -23.561414,
    "destinationLng": -46.656070,
    "includeSteps": true,
    "includeGeometry": true
  }'
```

### JavaScript/Fetch

```javascript
const response = await fetch('/v1/routing/route', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    originLat: -23.550520,
    originLng: -46.633308,
    destinationLat: -23.561414,
    destinationLng: -46.656070
  })
});

// Verificar rate limit
const remaining = response.headers.get('X-RateLimit-Remaining');
console.log(`Requisições restantes: ${remaining}`);

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  console.log(`Rate limit! Tentar novamente em ${retryAfter}s`);
}

const route = await response.json();
console.log(`Distância: ${route.distanceKm}km, Tempo: ${route.durationFormatted}`);
```

---

## 7. Configuração

### application.properties

```properties
# OSRM
app.routing.osrm.base-url=http://72.60.57.106:5000
app.routing.timeout-seconds=10
app.routing.max-retries=2

# Rate Limit
app.routing.ratelimit.per-minute=60
app.routing.ratelimit.per-hour=500
app.routing.ratelimit.burst=10

# Cache
app.routing.cache.enabled=true
app.routing.cache.ttl-minutes=15

# Circuit Breaker
app.routing.circuit-breaker.failure-threshold=5
app.routing.circuit-breaker.recovery-time-seconds=60
app.routing.circuit-breaker.half-open-max-requests=3
```

### Variáveis de Ambiente (Produção)

```bash
# OSRM
OSRM_BASE_URL=http://your-osrm-server:5000
ROUTING_TIMEOUT_SECONDS=10
ROUTING_MAX_RETRIES=2

# Rate Limit
ROUTING_RATELIMIT_PER_MINUTE=30
ROUTING_RATELIMIT_PER_HOUR=300
ROUTING_RATELIMIT_BURST=5

# Cache
ROUTING_CACHE_ENABLED=true
ROUTING_CACHE_TTL_MINUTES=30

# Circuit Breaker
ROUTING_CB_FAILURE_THRESHOLD=5
ROUTING_CB_RECOVERY_TIME=60
ROUTING_CB_HALF_OPEN_MAX=3
```

---

## 8. Arquitetura

### Fluxo de Requisição

```
Cliente
   │
   ▼
┌─────────────────┐
│ JWT Auth Filter │  ← Valida token
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Rate Limiter   │  ← Verifica limites (Redis)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Circuit Breaker │  ← Verifica estado
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cache Check    │  ← Busca no Redis
└────────┬────────┘
         │ (cache miss)
         ▼
┌─────────────────┐
│  OSRM Request   │  ← HTTP + Retry
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cache Store    │  ← Armazena resultado
└────────┬────────┘
         │
         ▼
      Response
```

### Componentes

| Componente | Responsabilidade |
|------------|------------------|
| `RoutingController` | Endpoints REST, validação de entrada |
| `SecureRoutingService` | Orquestração das camadas de proteção |
| `RoutingRateLimitService` | Rate limiting multi-nível com Redis |
| `RoutingCacheService` | Cache de rotas com Redis |
| `RoutingCircuitBreaker` | Proteção contra falhas em cascata |

### Redis Keys

```
routing:ratelimit:{userId}:burst    # TTL: 1s
routing:ratelimit:{userId}:minute   # TTL: 60s
routing:ratelimit:{userId}:hour     # TTL: 3600s
routing:cache:{coords}:{options}    # TTL: 15min (config)
routing:circuit:state               # CLOSED/OPEN/HALF_OPEN
routing:circuit:failures            # Contador de falhas
routing:circuit:last_failure        # Timestamp última falha
```

---

## ✔ Fim da documentação


