# Places & Geocoding API

API protegida para autocomplete de lugares e geocodificação usando Google Maps Platform.

---

## Sumário

- [1. Visão Geral](#1-visão-geral)
- [2. Autenticação](#2-autenticação)
- [3. Rate Limiting](#3-rate-limiting)
- [4. Controle de Quota](#4-controle-de-quota)
- [5. Cache em Duas Camadas](#5-cache-em-duas-camadas)
- [6. Endpoints](#6-endpoints)
- [7. Erros](#7-erros)
- [8. Exemplos de Uso](#8-exemplos-de-uso)
- [9. Configuração](#9-configuração)
- [10. Arquitetura](#10-arquitetura)

---

## 1. Visão Geral

A Places API fornece acesso seguro às APIs do Google Maps Platform:
- **Places Autocomplete**: Sugestões de lugares enquanto o usuário digita
- **Place Details**: Detalhes completos de um lugar (coordenadas, endereço, etc.)
- **Geocoding**: Endereço → Coordenadas
- **Reverse Geocoding**: Coordenadas → Endereço

### Características

- **Chave de API protegida** - nunca exposta ao frontend
- **Rate Limiting por usuário** - evita abusos
- **Controle de Quota diária** - protege o free tier ($200/mês)
- **Cache em duas camadas** - Redis (rápido) + PostgreSQL (persistente)
- **Estatísticas de uso** - monitoramento em tempo real

### Base URL

```
POST /v1/places/autocomplete
GET  /v1/places/autocomplete
POST /v1/places/details
GET  /v1/places/details/{placeId}
POST /v1/places/geocode
GET  /v1/places/geocode
POST /v1/places/reverse-geocode
GET  /v1/places/reverse-geocode
GET  /v1/places/rate-limit
GET  /v1/places/quota
```

---

## 2. Autenticação

Todas as requisições requerem token JWT válido:

```
Authorization: Bearer <token>
```

---

## 3. Rate Limiting

### Limites por Usuário

| Tipo | Desenvolvimento | Produção |
|------|-----------------|----------|
| Burst (1s) | 5 req | 3 req |
| Por minuto | 30 req | 20 req |
| Por hora | 200 req | 150 req |

### Headers de Resposta

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 1733757600
```

### Resposta 429

```json
{
  "error": {
    "message": "Limite de requisições excedido. Aguarde 45 segundos.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

---

## 4. Controle de Quota

### Free Tier do Google

O Google Maps Platform oferece $200/mês de crédito gratuito (~$6.67/dia).

### Custos Aproximados

| API | Custo por Requisição |
|-----|---------------------|
| Autocomplete (sessão) | $0.017 |
| Place Details | $0.017 |
| Geocoding | $0.005 |
| Reverse Geocoding | $0.005 |

### Proteção Implementada

- **Orçamento diário**: $5.00 (configurável)
- **Alerta em 80%**: Log de warning
- **Bloqueio em 100%**: Erro 429 até meia-noite

### Endpoint de Monitoramento

```
GET /v1/places/quota
```

Resposta:
```json
{
  "date": "2025-12-09",
  "currentCost": 1.25,
  "dailyBudget": 5.00,
  "budgetUsedPercent": 25.0,
  "totalRequests": 150,
  "totalCacheHits": 120,
  "cacheHitRatePercent": 80.0,
  "autocompleteRequests": 100,
  "geocodingRequests": 30,
  "reverseGeocodingRequests": 15,
  "placeDetailsRequests": 5
}
```

---

## 5. Cache em Duas Camadas

### Estratégia

```
Request → Redis (1ms) → PostgreSQL (10ms) → Google API (100ms+)
```

### Camada 1: Redis (cache rápido)

| Tipo | TTL |
|------|-----|
| Autocomplete | 24h |
| Place Details | 60min |
| Geocoding | 60min |

### Camada 2: PostgreSQL (cache persistente)

| Tipo | TTL |
|------|-----|
| Autocomplete | 24-48h |
| Place Details | 90-180 dias |
| Geocoding | 90-180 dias |

### Benefícios

- **Cache hit rate ~80%+** em uso normal
- **Economia de 80%+ nas requisições** ao Google
- **Resiliência**: Funciona mesmo se Google estiver lento
- **Persistência**: Não perde cache em restart

---

## 6. Endpoints

### POST /v1/places/autocomplete

Sugestões de lugares enquanto o usuário digita.

#### Request

```json
{
  "input": "Avenida Paul",
  "location": {
    "lat": -23.550520,
    "lng": -46.633308,
    "city": "São Paulo",
    "state": "SP"
  },
  "radius": 50000,
  "strictBounds": true,
  "country": "br",
  "language": "pt-BR",
  "sessionToken": "sess_abc123"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| input | string | Sim | Texto de busca (mín. 2 caracteres) |
| location | object | Não | Localização do usuário para limitar busca |
| location.lat | number | Sim* | Latitude do usuário |
| location.lng | number | Sim* | Longitude do usuário |
| location.city | string | Não | Nome da cidade (para exibição) |
| location.state | string | Não | Estado |
| radius | integer | Não | Raio em metros (default: 50000 = 50km) |
| strictBounds | boolean | Não | **Se true, RESTRINGE resultados ao raio** (default: false) |
| country | string | Não | Código do país ISO (default: br) |
| language | string | Não | Idioma (default: pt-BR) |
| sessionToken | string | Não | Token para agrupar sessão de busca |

#### Diferença entre `strictBounds: false` e `strictBounds: true`

| strictBounds | Comportamento |
|--------------|---------------|
| `false` (default) | Dá **preferência** a resultados na área, mas pode retornar de outras cidades |
| `true` | **RESTRINGE** resultados ao raio especificado. Endereços fora do raio não aparecem |

**Recomendação:** Use `strictBounds: true` com `radius: 30000` (30km) para limitar à cidade do usuário.

#### Response

```json
{
  "predictions": [
    {
      "placeId": "ChIJrTLr-GyuEmsRBfy61i59si0",
      "description": "Avenida Paulista, São Paulo - SP, Brasil",
      "mainText": "Avenida Paulista",
      "secondaryText": "São Paulo - SP, Brasil",
      "types": ["route", "geocode"],
      "matchedSubstrings": [
        {"offset": 0, "length": 12}
      ]
    }
  ],
  "cached": false,
  "source": "GOOGLE_PLACES",
  "queriedAt": "2025-12-09T14:30:00Z"
}
```

---

### POST /v1/places/details

Detalhes completos de um lugar.

#### Request

```json
{
  "placeId": "ChIJrTLr-GyuEmsRBfy61i59si0",
  "language": "pt-BR",
  "sessionToken": "sess_abc123"
}
```

#### Response

```json
{
  "placeId": "ChIJrTLr-GyuEmsRBfy61i59si0",
  "name": "Avenida Paulista",
  "formattedAddress": "Avenida Paulista, São Paulo - SP, Brasil",
  "lat": -23.561414,
  "lng": -46.656070,
  "addressComponents": [
    {
      "longName": "Avenida Paulista",
      "shortName": "Av. Paulista",
      "types": ["route"]
    },
    {
      "longName": "São Paulo",
      "shortName": "São Paulo",
      "types": ["administrative_area_level_2", "political"]
    }
  ],
  "types": ["route", "geocode"],
  "viewport": {
    "northeast": {"lat": -23.5600, "lng": -46.6500},
    "southwest": {"lat": -23.5700, "lng": -46.6700}
  },
  "cached": true,
  "source": "GOOGLE_PLACES",
  "queriedAt": "2025-12-09T14:30:00Z"
}
```

---

### POST /v1/places/geocode

Endereço → Coordenadas.

#### Request

```json
{
  "address": "Avenida Paulista, 1000, São Paulo",
  "country": "br",
  "language": "pt-BR"
}
```

#### Response

```json
{
  "results": [
    {
      "placeId": "ChIJrTLr-GyuEmsRBfy61i59si0",
      "formattedAddress": "Avenida Paulista, 1000 - Bela Vista, São Paulo - SP, Brasil",
      "lat": -23.561414,
      "lng": -46.656070,
      "locationType": "ROOFTOP",
      "confidence": "EXACT"
    }
  ],
  "cached": false,
  "source": "GOOGLE_GEOCODING",
  "queriedAt": "2025-12-09T14:30:00Z"
}
```

---

### POST /v1/places/reverse-geocode

Coordenadas → Endereço.

#### Request

```json
{
  "lat": -23.561414,
  "lng": -46.656070,
  "language": "pt-BR"
}
```

#### Response

```json
{
  "results": [
    {
      "placeId": "ChIJrTLr-GyuEmsRBfy61i59si0",
      "formattedAddress": "Avenida Paulista, 1000 - Bela Vista, São Paulo - SP, Brasil",
      "lat": -23.561414,
      "lng": -46.656070,
      "locationType": "ROOFTOP",
      "confidence": "EXACT"
    }
  ],
  "cached": true,
  "source": "GOOGLE_GEOCODING",
  "queriedAt": "2025-12-09T14:30:00Z"
}
```

---

## 7. Erros

| HTTP | Code | Descrição |
|------|------|-----------|
| 400 | INVALID_INPUT | Texto de busca inválido |
| 400 | INPUT_TOO_SHORT | Menos de 2 caracteres |
| 400 | INVALID_PLACE_ID | Place ID inválido |
| 400 | INVALID_COORDINATES | Coordenadas inválidas |
| 400 | INVALID_ADDRESS | Endereço inválido |
| 400 | SERVICE_UNAVAILABLE | API Key não configurada |
| 401 | UNAUTHORIZED | Token inválido |
| 429 | RATE_LIMIT_EXCEEDED | Rate limit por usuário excedido |
| 429 | DAILY_QUOTA_EXCEEDED | Quota diária excedida |
| 500 | AUTOCOMPLETE_ERROR | Erro na API de autocomplete |
| 500 | GEOCODING_ERROR | Erro na API de geocoding |

---

## 8. Exemplos de Uso

### Fluxo Recomendado (Frontend)

```javascript
// 1. Obter localização do usuário (uma vez ao iniciar)
const userLocation = await getCurrentPosition(); // {lat, lng}

// 2. Gerar session token no início da sessão de busca
const sessionToken = `sess_${crypto.randomUUID()}`;

// 3. Autocomplete enquanto usuário digita (com debounce de 300ms)
const suggestions = await fetch('/v1/places/autocomplete', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    input: userInput,
    location: {
      lat: userLocation.lat,
      lng: userLocation.lng,
      city: "São Paulo",  // opcional
      state: "SP"         // opcional
    },
    radius: 30000,        // 30km - limita à cidade
    strictBounds: true,   // IMPORTANTE: restringe à área
    sessionToken: sessionToken
  })
}).then(r => r.json());

// 4. Quando usuário selecionar uma sugestão, buscar detalhes
const details = await fetch('/v1/places/details', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    placeId: selectedPrediction.placeId,
    sessionToken: sessionToken  // Mesmo token = custo reduzido!
  })
}).then(r => r.json());

// 5. Usar coordenadas
console.log(`Destino: ${details.lat}, ${details.lng}`);
```

### Obtendo Localização do Usuário

```javascript
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
```

### cURL - Autocomplete (sem restrição de área)

```bash
curl -X POST 'http://localhost:8080/v1/places/autocomplete' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "input": "Avenida Paul",
    "country": "br"
  }'
```

### cURL - Autocomplete (restrito à cidade do usuário)

```bash
curl -X POST 'http://localhost:8080/v1/places/autocomplete' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "input": "Avenida Paul",
    "location": {
      "lat": -23.550520,
      "lng": -46.633308
    },
    "radius": 30000,
    "strictBounds": true,
    "country": "br"
  }'
```

### GET - Autocomplete (restrito à cidade)

```bash
curl 'http://localhost:8080/v1/places/autocomplete?input=Avenida%20Paul&lat=-23.550520&lng=-46.633308&radius=30000&strictBounds=true' \
  -H 'Authorization: Bearer <token>'
```

### cURL - Geocoding

```bash
curl -X POST 'http://localhost:8080/v1/places/geocode' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "address": "Avenida Paulista, 1000, São Paulo"
  }'
```

---

## 9. Configuração

### application.properties

```properties
# Google API
app.places.google.api-key=${GOOGLE_PLACES_API_KEY}
app.places.google.places-api-url=https://maps.googleapis.com/maps/api/place
app.places.google.geocoding-api-url=https://maps.googleapis.com/maps/api/geocode/json

# Rate Limit
app.places.ratelimit.per-minute=30
app.places.ratelimit.per-hour=200
app.places.ratelimit.burst=5

# Cache
app.places.cache.redis-ttl-minutes=60
app.places.cache.postgres-ttl-days=90
app.places.cache.autocomplete-ttl-hours=24

# Quota
app.places.quota.enabled=true
app.places.quota.daily-budget=5.00
app.places.quota.warning-threshold=0.80
```

### Variáveis de Ambiente

```bash
# Google API Key (NUNCA expor no frontend!)
GOOGLE_PLACES_API_KEY=AIza...

# Rate Limit
PLACES_RATELIMIT_PER_MINUTE=20
PLACES_RATELIMIT_PER_HOUR=150
PLACES_RATELIMIT_BURST=3

# Cache
PLACES_CACHE_REDIS_TTL_MINUTES=120
PLACES_CACHE_POSTGRES_TTL_DAYS=180
PLACES_CACHE_AUTOCOMPLETE_TTL_HOURS=48

# Quota
PLACES_QUOTA_ENABLED=true
PLACES_QUOTA_DAILY_BUDGET=5.00
PLACES_QUOTA_WARNING_THRESHOLD=0.70
```

### Google Cloud Console

1. Acesse https://console.cloud.google.com
2. Crie um projeto ou use existente
3. Ative as APIs:
   - Places API
   - Geocoding API
4. Crie uma API Key com restrições:
   - Restrição de aplicativo: IPs do servidor
   - Restrição de API: Apenas Places e Geocoding
5. Configure $200/mês de alerta de orçamento

---

## 10. Arquitetura

### Fluxo de Requisição

```
Cliente (Frontend)
       │
       ▼
┌──────────────────┐
│  JWT Auth Filter │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Rate Limiter   │ ─── Redis (por usuário)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Quota Check    │ ─── Redis (diário)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Redis Cache    │ ─── TTL: 1-24h
└────────┬─────────┘
         │ (cache miss)
         ▼
┌──────────────────┐
│ PostgreSQL Cache │ ─── TTL: 90-180 dias
└────────┬─────────┘
         │ (cache miss)
         ▼
┌──────────────────┐
│   Google APIs    │ ─── Chave protegida
└────────┬─────────┘
         │
         ▼
    ┌─────────┐
    │ Response │
    └─────────┘
```

### Tabelas PostgreSQL

```sql
place_cache          -- Detalhes de lugares (place_id → dados)
geocoding_cache      -- Geocoding e reverse geocoding
autocomplete_cache   -- Sugestões de autocomplete
places_api_usage     -- Métricas de uso por dia
```

### Redis Keys

```
places:place:{placeId}                    # Cache de place details
places:geocoding:{hash}                   # Cache de geocoding
places:autocomplete:{hash}                # Cache de autocomplete
places:ratelimit:{userId}:{api}:burst     # Rate limit burst
places:ratelimit:{userId}:{api}:minute    # Rate limit por minuto
places:ratelimit:{userId}:{api}:hour      # Rate limit por hora
places:quota:{date}:cost                  # Custo diário acumulado
places:quota:{date}:{api}:count           # Contador de requisições
places:quota:{date}:{api}:cache_hits      # Contador de cache hits
```

### Jobs Agendados

| Job | Frequência | Descrição |
|-----|------------|-----------|
| `cleanupExpiredCache` | 6 horas | Remove cache expirado |
| `cleanupInactiveCache` | 1x/dia (3h) | Remove inativos (30+ dias, <5 acessos) |
| `logDailyUsage` | 1x/dia (0h) | Log de uso do dia anterior |

---

## ✔ Fim da documentação

