# Documentação WebSocket - Sistema de Rastreamento e Notificações em Tempo Real

## Visão Geral

O sistema de WebSocket permite comunicação bidirecional em tempo real entre:
- **Motoristas**: Enviam localização, recebem ofertas de corrida e respondem a elas
- **Passageiros**: Recebem notificações sobre o status de suas corridas

O sistema utiliza Redis GEO para armazenar posições, H3 para indexação espacial e WebSocket para comunicação em tempo real.

## Endpoints

### Motoristas

```
ws://host:port/ws/drivers?token=<JWT_TOKEN>
```

**Autenticação:**
- **Método**: Query Parameter
- **Parâmetro**: `token`
- **Tipo**: JWT Access Token
- **Requisito**: Token válido com role `driver`

**Exemplo:**
```javascript
const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...";
const ws = new WebSocket(`ws://localhost:8080/ws/drivers?token=${token}`);
```

### Passageiros

```
ws://host:port/ws/passengers?token=<JWT_TOKEN>
```

**Autenticação:**
- **Método**: Query Parameter
- **Parâmetro**: `token`
- **Tipo**: JWT Access Token
- **Requisito**: Token válido com role `passenger`

**Exemplo:**
```javascript
const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...";
const ws = new WebSocket(`ws://localhost:8080/ws/passengers?token=${token}`);
```

## Mensagens Enviadas pelo Cliente

### 1. Atualização de Localização

Envia a posição atual do motorista. Deve ser enviada a cada 2-5 segundos.

**Formato:**
```json
{
  "type": "location_update",
  "lat": -23.5505,
  "lng": -46.6333,
  "heading": 90.0,
  "speed": 45.5
}
```

**Campos:**
- `type` (string, obrigatório): Sempre `"location_update"`
- `lat` (number, obrigatório): Latitude em graus decimais (-90 a 90)
- `lng` (number, obrigatório): Longitude em graus decimais (-180 a 180)
- `heading` (number, opcional): Direção em graus (0-360)
- `speed` (number, opcional): Velocidade em km/h

**Resposta de Sucesso:**
```json
{
  "type": "location_update",
  "message": "Localização atualizada com sucesso"
}
```

**Comportamento:**
- Atualiza a posição no Redis GEO
- Adiciona o motorista à célula H3 correspondente
- Atualiza automaticamente o heartbeat (TTL de 10 segundos)
- Remove automaticamente das células H3 antigas quando expira

### 2. Heartbeat

Mantém a conexão ativa. Deve ser enviado periodicamente se não houver atualizações de localização.

**Formato:**
```json
{
  "type": "heartbeat"
}
```

**Resposta:**
```json
{
  "type": "pong",
  "message": "Heartbeat recebido"
}
```

**Comportamento:**
- Renova o TTL das chaves de conexão e status
- Se não receber heartbeat em 15 segundos, o motorista é marcado como offline automaticamente

### 3. Atualização de Status Operacional

Atualiza o status operacional do motorista (disponível, ocupado, pausado, offline).

**Formato:**
```json
{
  "type": "status_update",
  "status": "AVAILABLE"
}
```

**Valores Válidos:**
- `AVAILABLE`: Motorista disponível e aceitando corridas
- `BUSY`: Motorista ocupado com uma corrida ativa
- `PAUSED`: Motorista pausado/não disponível temporariamente
- `OFFLINE`: Motorista offline manualmente

**Resposta de Sucesso:**
```json
{
  "type": "status_updated",
  "message": "Status atualizado com sucesso"
}
```

**Resposta de Erro:**
```json
{
  "type": "error",
  "message": "Status inválido: INVALID_STATUS"
}
```

### 4. Resposta de Oferta de Corrida

Motorista aceita ou recusa uma oferta de corrida.

**Formato (Aceitar):**
```json
{
  "type": "ride_response",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "action": "accept"
}
```

**Formato (Recusar):**
```json
{
  "type": "ride_response",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "action": "reject"
}
```

**Campos:**
- `type` (string, obrigatório): Sempre `"ride_response"`
- `rideId` (UUID, obrigatório): ID da corrida oferecida
- `action` (string, obrigatório): `"accept"` ou `"reject"`

**Resposta de Sucesso (Aceitar):**
```json
{
  "type": "ride_accepted",
  "message": "Corrida aceita com sucesso"
}
```

**Resposta de Sucesso (Recusar):**
```json
{
  "type": "ride_rejected",
  "message": "Corrida recusada"
}
```

**Resposta de Erro:**
```json
{
  "type": "error",
  "message": "Não foi possível aceitar a corrida. Ela pode já ter sido aceita por outro motorista ou expirado."
}
```

**Comportamento:**
- Aceite é processado de forma atômica com locks Redis
- Previne que múltiplos motoristas aceitem a mesma corrida
- Se aceitar, motorista é marcado como `BUSY` automaticamente
- Se recusar, sistema tenta próximo motorista da lista

## Mensagens Recebidas pelo Cliente (Motoristas)

### Conexão Estabelecida

Enviada automaticamente quando a conexão é estabelecida com sucesso.

```json
{
  "type": "connected",
  "message": "Conexão estabelecida com sucesso"
}
```

### Corrida Ativa (Reconexão)

Enviada automaticamente quando o motorista reconecta e há uma corrida ativa. 
Permite que o app restaure o estado da UI sem precisar fazer uma chamada REST adicional.

**Formato:**
```json
{
  "type": "active_ride",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "passengerId": "018f1234-5678-9abc-def0-123456789def",
  "status": "MOTORISTA_ACEITOU",
  "estimatedPrice": 23.90,
  "finalPrice": null,
  "distanceKm": 6.4,
  "durationMinutes": 18.0,
  "surge": 1.2,
  "requestedAt": "2025-12-01T08:00:00Z",
  "passenger": {
    "id": "018f1234-5678-9abc-def0-123456789def",
    "name": "Maria Santos",
    "rating": 9.75
  },
  "passengerLocation": {
    "lat": -23.5505,
    "lng": -46.6333
  }
}
```

**Campos:**
- `type` (string): Sempre `"active_ride"`
- `rideId` (UUID): ID da corrida ativa
- `passengerId` (UUID): ID do passageiro
- `status` (string): Status atual da corrida
- `estimatedPrice` (number): Preço estimado
- `finalPrice` (number|null): Preço final (null se ainda não finalizada)
- `distanceKm` (number): Distância em quilômetros
- `durationMinutes` (number): Duração estimada em minutos
- `surge` (number): Fator de surge aplicado
- `requestedAt` (ISO 8601): Data/hora da solicitação
- `passenger` (object): Informações do passageiro (nome e avaliação)
- `passengerLocation` (object|null): Localização atual do passageiro (se disponível)

**Comportamento:**
- Enviada automaticamente após a mensagem `connected` se houver corrida ativa
- Se não houver corrida ativa, esta mensagem não é enviada
- O app pode usar esta mensagem para restaurar a UI da corrida ativa
- A localização do passageiro é incluída se estiver disponível no Redis
- Se o WebSocket falhar, o app pode usar o fallback REST: `GET /v1/drivers/active-ride`

### Oferta de Corrida

Enviada quando uma corrida está disponível para o motorista.

**Formato:**
```json
{
  "type": "ride_offer",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "pickup": {
    "lat": -23.5505,
    "lng": -46.6333
  },
  "destination": {
    "lat": -23.5510,
    "lng": -46.6340
  },
  "estimatedPrice": 26.10,
  "distanceKm": 6.4,
  "durationMinutes": 18.0,
  "etaToPickupMinutes": 5,
  "expiresInSeconds": 15
}
```

**Campos:**
- `type` (string): Sempre `"ride_offer"`
- `rideId` (UUID): ID da corrida
- `pickup` (object): Coordenadas do ponto de embarque
- `destination` (object): Coordenadas do destino
- `estimatedPrice` (number): Preço estimado da corrida
- `distanceKm` (number): Distância em quilômetros
- `durationMinutes` (number): Duração estimada em minutos
- `etaToPickupMinutes` (number): Tempo estimado até o ponto de embarque
- `expiresInSeconds` (number): Tempo restante para responder (geralmente 15s)

**Comportamento:**
- Oferta expira após 15 segundos se não houver resposta
- Se expirar, sistema tenta próximo motorista
- Motorista deve responder com `ride_response` (accept/reject)

### Respostas de Sucesso

Todas as mensagens enviadas pelo cliente recebem uma resposta de confirmação:

```json
{
  "type": "<tipo_da_acao>",
  "message": "Mensagem de confirmação"
}
```

### Respostas de Erro

Em caso de erro, o servidor envia:

```json
{
  "type": "error",
  "message": "Descrição do erro"
}
```

## Mensagens Recebidas pelo Cliente (Passageiros)

### Conexão Estabelecida

Enviada automaticamente quando a conexão é estabelecida com sucesso.

```json
{
  "type": "connected",
  "message": "Conexão estabelecida com sucesso"
}
```

### Notificações de Corrida

Passageiros recebem notificações em tempo real sobre o status de suas corridas.

#### Motorista Aceitou

Enviada quando um motorista aceita a corrida. Inclui informações completas do motorista (nome, avaliação, veículo).

**Formato:**
```json
{
  "type": "ride_driver_accepted",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "message": "Motorista aceitou sua corrida",
  "data": {
    "driverId": "018f1234-5678-9abc-def0-123456789def",
    "status": "MOTORISTA_ACEITOU",
    "driver": {
      "id": "018f1234-5678-9abc-def0-123456789def",
      "name": "João Silva",
      "rating": 9.50,
      "vehicle": {
        "licensePlate": "ABC-1234",
        "brand": "Toyota",
        "model": "Corolla",
        "color": "Branco"
      }
    }
  }
}
```

**Campos:**
- `type` (string): Sempre `"ride_driver_accepted"`
- `rideId` (UUID): ID da corrida
- `message` (string): Mensagem descritiva
- `data` (object): Dados da notificação
  - `driverId` (UUID): ID do motorista
  - `status` (string): Status atual da corrida
  - `driver` (object, opcional): Informações completas do motorista (se disponível)
    - `id` (UUID): ID do motorista
    - `name` (string): Nome do motorista
    - `rating` (number): Avaliação média do motorista (0 a 10)
    - `vehicle` (object, opcional): Informações do veículo
      - `licensePlate` (string): Placa do veículo
      - `brand` (string): Marca do veículo
      - `model` (string): Modelo do veículo
      - `color` (string): Cor do veículo

**Comportamento:**
- Enviada imediatamente quando o motorista aceita a corrida
- Inclui informações completas do motorista (nome, avaliação, veículo) para exibição imediata na UI
- Se houver erro ao obter informações completas, apenas `driverId` e `status` são incluídos
- O app pode usar esta mensagem para exibir informações do motorista sem precisar fazer chamada REST adicional
- Como fallback, o app pode usar `GET /v1/passengers/active-ride` se o WebSocket falhar

#### Motorista a Caminho

```json
{
  "type": "ride_driver_on_the_way",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "message": "Motorista está a caminho do ponto de embarque",
  "data": {
    "driverId": "018f1234-5678-9abc-def0-123456789def",
    "status": "MOTORISTA_A_CAMINHO"
  }
}
```

#### Motorista Próximo

```json
{
  "type": "ride_driver_nearby",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "message": "Motorista está próximo do ponto de embarque",
  "data": {
    "driverId": "018f1234-5678-9abc-def0-123456789def",
    "status": "MOTORISTA_PROXIMO"
  }
}
```

#### Motorista Chegou

```json
{
  "type": "ride_driver_arrived",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "message": "Motorista chegou no ponto de embarque",
  "data": {
    "driverId": "018f1234-5678-9abc-def0-123456789def",
    "status": "MOTORISTA_CHEGOU"
  }
}
```

#### Atualização de Status

```json
{
  "type": "ride_status_update",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "message": "Em rota para o destino.",
  "data": {
    "status": "EM_ROTA",
    "driverId": "018f1234-5678-9abc-def0-123456789def"
  }
}
```

**Tipos de Notificação:**
- `ride_driver_accepted`: Motorista aceitou a corrida
- `ride_driver_on_the_way`: Motorista está a caminho
- `ride_driver_nearby`: Motorista está próximo (máximo 500m)
- `ride_driver_arrived`: Motorista chegou (máximo 100m)
- `ride_status_update`: Atualização geral de status

**Comportamento:**
- Notificações são enviadas automaticamente quando motorista atualiza status
- Passageiro não precisa enviar mensagens (apenas recebe)
- Conexão permanece aberta para receber notificações

## Estados do Motorista

O sistema gerencia dois tipos de estado:

### 1. Estado de Conexão (Controlado pelo Sistema)

- **Online**: Motorista conectado via WebSocket e com heartbeat recente (< 15s)
- **Offline**: Motorista desconectado ou sem heartbeat há mais de 15 segundos

**Regras:**
- Conexão estabelecida → `online = true`
- Sem mensagens em 15s → `online = false` (automático)
- Socket fechado → `online = false` (automático)

### 2. Estado Operacional (Controlado pelo Motorista)

- **AVAILABLE**: Motorista disponível e aceitando corridas
- **BUSY**: Motorista ocupado com corrida ativa
- **PAUSED**: Motorista pausado temporariamente
- **OFFLINE**: Motorista offline manualmente

**Regras:**
- Pode ser alterado via WebSocket (`status_update`) ou REST API
- Persiste no Redis com TTL de 24 horas
- Default é `OFFLINE` se não estiver definido

### Recebimento de Corridas

Um motorista **só recebe corridas** se:
- `online = true` (conectado + heartbeat recente)
- `operationalStatus = AVAILABLE`

## Estrutura Redis

### Chaves Utilizadas

```
drivers_live (GEO)
  → Armazena posições dos motoristas usando Redis GEO
  → Chave: "drivers_live"
  → Valor: GeoLocation com driverId como membro

drivers_status:{driverId}
  → Status de conexão (online/offline)
  → Valor: "online"
  → TTL: 10 segundos

drivers_connection:{driverId}
  → Indica conexão WebSocket ativa
  → Valor: "connected"
  → TTL: 20 segundos (renovado a cada heartbeat)

drivers_operational_status:{driverId}
  → Status operacional do motorista
  → Valor: "AVAILABLE" | "BUSY" | "PAUSED" | "OFFLINE"
  → TTL: 24 horas

h3:cell:{h3Index}
  → Conjunto de motoristas em uma célula H3
  → Tipo: Set
  → Membros: driverId (String)
  → TTL: 12 segundos
```

### H3 Indexação Espacial

- **Resolução**: 9 (células de ~0.5km)
- **Uso**: Indexação rápida de motoristas por região geográfica
- **Atualização**: Automática a cada `location_update`
- **Expiração**: Automática após 12 segundos sem atualização

## Endpoints REST Relacionados

### GET `/v1/drivers/operational-status`

Obtém o status operacional e de conexão do motorista autenticado.

**Resposta:**
```json
{
  "operationalStatus": "AVAILABLE",
  "isOnline": true,
  "canReceiveRides": true
}
```

### PATCH `/v1/drivers/operational-status`

Atualiza o status operacional do motorista.

**Request:**
```json
{
  "status": "AVAILABLE"
}
```

**Resposta:**
```json
{
  "operationalStatus": "AVAILABLE",
  "isOnline": true,
  "canReceiveRides": true
}
```

## Fluxo de Funcionamento

### 1. Conexão Inicial

```
Cliente → ws://host/ws/drivers?token=<JWT>
  ↓
Interceptor valida JWT e verifica role "driver"
  ↓
Handler marca motorista como online
  ↓
Cria chaves no Redis (status, connection)
  ↓
Envia mensagem "connected"
```

### 2. Atualização de Localização

```
Cliente → {"type": "location_update", "lat": ..., "lng": ...}
  ↓
Handler processa mensagem
  ↓
Atualiza Redis GEO (drivers_live)
  ↓
Calcula célula H3
  ↓
Adiciona motorista à célula H3
  ↓
Atualiza heartbeat (TTL)
  ↓
Responde com confirmação
```

### 3. Heartbeat

```
Cliente → {"type": "heartbeat"}
  ↓
Handler processa mensagem
  ↓
Renova TTL das chaves (status, connection)
  ↓
Responde com "pong"
```

### 4. Desconexão

```
Cliente fecha conexão ou timeout
  ↓
Handler detecta desconexão
  ↓
Remove do Redis GEO
  ↓
Remove das células H3 (expiração automática)
  ↓
Marca como offline
```

## Segurança

### Autenticação

- **JWT obrigatório**: Token deve ser válido e não expirado
- **Role validation**: Apenas usuários com role `driver` podem conectar
- **UUID do token**: O ID do motorista é extraído do token (não confia no cliente)

### Validações

- Token deve estar presente na query string
- Token deve ser válido (assinatura, expiração, issuer, audience)
- Usuário deve ter role `driver`
- Motorista deve existir e não estar deletado

### Proteção contra Ataques

- **Múltiplas conexões**: Se um motorista já está conectado, a conexão anterior é fechada
- **TTL automático**: Chaves expiram automaticamente, prevenindo dados órfãos
- **Validação de dados**: Latitude/longitude são validados antes de processar

## Exemplo de Implementação Cliente (JavaScript)

```javascript
class DriverWebSocketClient {
    constructor(token, baseUrl = 'ws://localhost:8080') {
        this.token = token;
        this.baseUrl = baseUrl;
        this.ws = null;
        this.heartbeatInterval = null;
        this.locationUpdateInterval = null;
    }

    connect() {
        const url = `${this.baseUrl}/ws/drivers?token=${this.token}`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('WebSocket conectado');
            this.startHeartbeat();
            this.startLocationUpdates();
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        };

        this.ws.onerror = (error) => {
            console.error('Erro WebSocket:', error);
        };

        this.ws.onclose = () => {
            console.log('WebSocket desconectado');
            this.stopHeartbeat();
            this.stopLocationUpdates();
        };
    }

    startHeartbeat() {
        // Enviar heartbeat a cada 10 segundos
        this.heartbeatInterval = setInterval(() => {
            this.send({
                type: 'heartbeat'
            });
        }, 10000);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    startLocationUpdates() {
        // Atualizar localização a cada 3 segundos
        this.locationUpdateInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition((position) => {
                this.send({
                    type: 'location_update',
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    heading: position.coords.heading || null,
                    speed: position.coords.speed ? position.coords.speed * 3.6 : null // m/s para km/h
                });
            });
        }, 3000);
    }

    stopLocationUpdates() {
        if (this.locationUpdateInterval) {
            clearInterval(this.locationUpdateInterval);
            this.locationUpdateInterval = null;
        }
    }

    updateStatus(status) {
        this.send({
            type: 'status_update',
            status: status
        });
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    handleMessage(message) {
        switch (message.type) {
            case 'connected':
                console.log('Conexão estabelecida:', message.message);
                break;
            case 'location_updated':
                console.log('Localização atualizada');
                break;
            case 'pong':
                console.log('Heartbeat confirmado');
                break;
            case 'status_updated':
                console.log('Status atualizado');
                break;
            case 'error':
                console.error('Erro:', message.message);
                break;
        }
    }

    disconnect() {
        this.stopHeartbeat();
        this.stopLocationUpdates();
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Uso
const client = new DriverWebSocketClient('seu-jwt-token-aqui');
client.connect();

// Atualizar status
client.updateStatus('AVAILABLE');

// Desconectar
// client.disconnect();
```

## Troubleshooting

### Problema: Conexão rejeitada

**Possíveis causas:**
- Token inválido ou expirado
- Token sem role `driver`
- Motorista não existe ou está deletado

**Solução:**
- Verificar se o token está válido
- Verificar se o usuário tem role `driver`
- Verificar se o motorista está ativo

### Problema: Motorista fica offline mesmo conectado

**Possíveis causas:**
- Heartbeat não está sendo enviado
- Intervalo de heartbeat muito longo (> 15s)
- Problemas de rede

**Solução:**
- Garantir que heartbeat é enviado a cada 10 segundos
- Verificar conectividade de rede
- Verificar logs do servidor

### Problema: Localização não atualiza

**Possíveis causas:**
- Formato de mensagem incorreto
- Latitude/longitude inválidas
- Motorista não existe

**Solução:**
- Verificar formato JSON da mensagem
- Validar coordenadas (lat: -90 a 90, lng: -180 a 180)
- Verificar logs do servidor

## Limites e Considerações

### Performance

- **Heartbeat**: Recomendado a cada 10 segundos
- **Location updates**: Recomendado a cada 2-5 segundos
- **TTL**: Configurado para expiração automática após 15s sem heartbeat

### Escalabilidade

- Sistema suporta múltiplas conexões simultâneas
- Redis GEO otimizado para buscas geográficas
- H3 permite indexação eficiente por região

### Monitoramento

- Logs de conexão/desconexão
- Métricas de heartbeat
- Status de motoristas online/offline

## Sistema de Matching e Dispatch

### Fluxo de Oferta de Corrida

1. **Passageiro solicita corrida** → Sistema cria corrida com status `AGUARDANDO_MOTORISTA`
2. **Sistema busca motoristas** → Usa H3 + Redis GEO para encontrar candidatos próximos
3. **Sistema envia oferta** → Envia para motorista mais próximo via WebSocket
4. **Motorista responde** → Aceita ou recusa via WebSocket
5. **Se aceitar** → Corrida atualizada para `MOTORISTA_ACEITOU`, passageiro notificado
6. **Se recusar/timeout** → Sistema tenta próximo motorista da lista

### Estratégia de Envio

- **Unicast sequencial**: Envia para um motorista por vez
- **Timeout**: 15 segundos por oferta
- **Máximo de tentativas**: 20 motoristas (configurável)
- **Locks Redis**: Previne que múltiplos motoristas aceitem a mesma corrida

### Estruturas Redis para Dispatch

```
ride_dispatch:{rideId}
  → Estado de dispatch da corrida
  → Contém lista de candidatos e índice atual
  → TTL: 10 minutos

ride_offer:{rideId}:{driverId}
  → Oferta individual para um motorista
  → Status: pending | accepted | rejected | expired
  → TTL: 25 segundos (15s timeout + 10s buffer)

lock:ride:{rideId}
  → Lock para processar aceite de corrida
  → TTL: 5 segundos

lock:driver:{driverId}
  → Lock para processar aceite do motorista
  → TTL: 5 segundos
```

## Endpoints REST para Motoristas Gerenciarem Corridas

### PATCH `/v1/drivers/rides/{rideId}/on-the-way`

Motorista indica que está a caminho do ponto de embarque.

**Request:** Sem body

**Response:** `204 No Content`

### PATCH `/v1/drivers/rides/{rideId}/nearby`

Motorista indica que está próximo do ponto de embarque (máximo 500m).

**Request:**
```json
{
  "lat": -23.5505,
  "lng": -46.6333
}
```

**Response:** `204 No Content`

**Validação:** Distância até ponto de embarque deve ser ≤ 500m

### PATCH `/v1/drivers/rides/{rideId}/arrived`

Motorista indica que chegou no ponto de embarque (máximo 100m).

**Request:**
```json
{
  "lat": -23.5505,
  "lng": -46.6333
}
```

**Response:** `204 No Content`

**Validação:** Distância até ponto de embarque deve ser ≤ 100m

### PATCH `/v1/drivers/rides/{rideId}/boarded`

Motorista indica que passageiro embarcou.

**Request:** Sem body

**Response:** `204 No Content`

### PATCH `/v1/drivers/rides/{rideId}/in-route`

Motorista indica que está em rota para o destino.

**Request:** Sem body

**Response:** `204 No Content`

### PATCH `/v1/drivers/rides/{rideId}/near-destination`

Motorista indica que está próximo do destino (máximo 500m).

**Request:**
```json
{
  "lat": -23.5510,
  "lng": -46.6340
}
```

**Response:** `204 No Content`

**Validação:** Distância até destino deve ser ≤ 500m

### PATCH `/v1/drivers/rides/{rideId}/complete`

Motorista finaliza a corrida e informa o preço final.

**Request:**
```json
{
  "finalPrice": 28.50
}
```

**Response:** `204 No Content`

## Máquina de Estados da Corrida

```
AGUARDANDO_MOTORISTA
  ↓ (sistema encontra motoristas)
MOTORISTA_ENCONTRADO
  ↓ (motorista aceita)
MOTORISTA_ACEITOU
  ↓ (motorista indica)
MOTORISTA_A_CAMINHO
  ↓ (motorista próximo - valida 500m)
MOTORISTA_PROXIMO
  ↓ (motorista chegou - valida 100m)
MOTORISTA_CHEGOU
  ↓ (motorista indica)
PASSAGEIRO_EMBARCADO
  ↓ (motorista indica)
EM_ROTA
  ↓ (motorista próximo ao destino - valida 500m)
PROXIMO_DESTINO
  ↓ (motorista finaliza)
CORRIDA_FINALIZADA
  ↓ (aguarda avaliação)
AGUARDANDO_AVALIACAO
  ↓
CONCLUIDA
```

**Estados de Cancelamento:**
- `CANCELADA_PASSAGEIRO`: Cancelada pelo passageiro
- `CANCELADA_MOTORISTA`: Cancelada pelo motorista
- `CANCELADA_NO_SHOW`: Passageiro não compareceu
- `EXPIRADA`: Nenhum motorista aceitou no tempo limite

## Validação de Distância

O sistema valida distâncias usando a fórmula de Haversine:

- **Próximo ao embarque**: Máximo 500m
- **Chegou no embarque**: Máximo 100m
- **Próximo ao destino**: Máximo 500m

Validações são feitas automaticamente quando motorista tenta atualizar status que requer proximidade.

## Changelog

### v1.0.0 (2025-12-01)
- Implementação inicial do sistema WebSocket
- Suporte a localização em tempo real
- Sistema de heartbeat
- Gerenciamento de status operacional
- Integração com Redis GEO e H3

### v2.0.0 (2025-12-03)
- Sistema de matching e dispatch de corridas
- Ofertas de corrida enviadas aos motoristas via WebSocket
- Respostas de aceite/recusa via WebSocket
- Locks Redis para operações atômicas
- Worker de timeout para ofertas expiradas
- WebSocket para passageiros (notificações em tempo real)
- Endpoints REST para motoristas atualizarem status de corrida
- Validação de distância geográfica (Haversine)
- Notificações automáticas ao passageiro em cada mudança de status

### v2.1.0 (2025-12-03)
- **Expansão progressiva do raio de busca**: Sistema agora expande automaticamente o raio de busca de motoristas até encontrar candidatos ou atingir limite máximo (50km)
- **Compartilhamento de localização do passageiro**: Passageiros podem enviar localização via WebSocket, que é automaticamente enviada ao motorista durante corridas ativas
- **Worker de broadcast de localização**: Worker periódico envia localização do passageiro para o motorista a cada 5 segundos durante corridas ativas
- **Notificação de corrida expirada**: Passageiro é notificado quando nenhum motorista é encontrado após expandir busca

## Compartilhamento de Localização do Passageiro

### Visão Geral

Durante uma corrida ativa, o motorista pode ver a localização do passageiro em tempo real. O passageiro envia sua localização via WebSocket, que é armazenada no Redis GEO e automaticamente enviada ao motorista.

### Fluxo

1. **Passageiro envia localização** → Via WebSocket (`location_update`)
2. **Sistema armazena no Redis GEO** → Chave `passengers_live` com TTL de 30 segundos
3. **Worker periódico** → A cada 5 segundos, envia localização do passageiro para o motorista
4. **Motorista recebe via WebSocket** → Mensagem `passenger_location` com coordenadas

### Mensagens do Passageiro

#### Atualização de Localização

**Formato:**
```json
{
  "type": "location_update",
  "lat": -23.5505,
  "lng": -46.6333,
  "heading": 90.0,
  "speed": 45.5
}
```

**Campos:**
- `type` (string, obrigatório): Sempre `"location_update"`
- `lat` (number, obrigatório): Latitude em graus decimais (-90 a 90)
- `lng` (number, obrigatório): Longitude em graus decimais (-180 a 180)
- `heading` (number, opcional): Direção em graus (0-360)
- `speed` (number, opcional): Velocidade em km/h

**Resposta de Sucesso:**
```json
{
  "type": "location_updated",
  "message": "Localização atualizada com sucesso"
}
```

**Comportamento:**
- Localização é armazenada no Redis GEO (`passengers_live`)
- TTL de 30 segundos (expira automaticamente se não atualizar)
- Worker envia automaticamente para motorista a cada 5 segundos durante corridas ativas

### Mensagens Recebidas pelo Motorista

#### Localização do Passageiro

Enviada automaticamente durante corridas ativas quando o passageiro está compartilhando localização.

**Formato:**
```json
{
  "type": "passenger_location",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "passengerId": "018f1234-5678-9abc-def0-123456789def",
  "lat": -23.5505,
  "lng": -46.6333
}
```

**Campos:**
- `type` (string): Sempre `"passenger_location"`
- `rideId` (UUID): ID da corrida ativa
- `passengerId` (UUID): ID do passageiro
- `lat` (number): Latitude do passageiro
- `lng` (number): Longitude do passageiro

**Comportamento:**
- Enviada automaticamente a cada 5 segundos durante corridas ativas
- Apenas para corridas nos estados: `MOTORISTA_ACEITOU`, `MOTORISTA_A_CAMINHO`, `MOTORISTA_PROXIMO`, `MOTORISTA_CHEGOU`, `PASSAGEIRO_EMBARCADO`, `EM_ROTA`, `PROXIMO_DESTINO`
- Se passageiro não estiver compartilhando localização, mensagem não é enviada

### Estrutura Redis para Passageiros

```
passengers_live (GEO)
  → Armazena posições dos passageiros usando Redis GEO
  → Chave: "passengers_live"
  → Valor: GeoLocation com passengerId como membro
  → TTL: 30 segundos (renovado a cada atualização)
```

## Expansão Progressiva do Raio de Busca

### Visão Geral

O sistema agora implementa expansão progressiva do raio de busca de motoristas. Se não encontrar motoristas próximos, o sistema expande automaticamente o raio até encontrar motoristas ou atingir o limite máximo.

### Estratégia de Busca

1. **Tentativa 1: H3 com ring inicial (ring=2)**
   - Busca rápida em células H3 próximas
   - Ideal para áreas com muitos motoristas

2. **Tentativa 2: Expansão progressiva do H3 ring (ring=3 até 10)**
   - Expande o anel de células H3 progressivamente
   - Aumenta a área de busca mantendo eficiência

3. **Tentativa 3: Redis GEO com raio crescente (5km até 50km)**
   - Usa Redis GEO para busca mais abrangente
   - Incrementa raio em 5km a cada tentativa
   - Máximo de 50km de raio

### Configurações

```java
H3_RING_SIZE_INITIAL = 2      // Anel inicial
H3_RING_SIZE_MAX = 10         // Anel máximo
GEO_RADIUS_INITIAL_KM = 5.0   // Raio inicial em km
GEO_RADIUS_MAX_KM = 50.0      // Raio máximo em km
GEO_RADIUS_INCREMENT_KM = 5.0 // Incremento do raio
```

### Logs

O sistema registra qual estratégia encontrou motoristas:

```
Encontrados 3 motoristas candidatos com H3 (ring=2) para origem (-23.5505, -46.6333)
Encontrados 5 motoristas candidatos com Redis GEO (raio=15km) para origem (-23.5505, -46.6333)
```

