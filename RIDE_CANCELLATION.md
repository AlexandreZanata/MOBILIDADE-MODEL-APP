# Sistema de Cancelamento de Corridas

## Visão Geral

O sistema de cancelamento permite que tanto passageiros quanto motoristas cancelem corridas em diferentes estágios do processo. As penalidades são aplicadas através do sistema de avaliações após a corrida (ver documentação de avaliações).

## Endpoints

### Passageiro - Cancelar Corrida

**Endpoint:** `POST /v1/passengers/rides/{rideId}/cancel`

**Autenticação:** Requerida (JWT com role `passenger`)

**Request Body:**
```json
{
  "reason": "Mudança de planos"
}
```

**Campos:**
- `reason` (string, obrigatório): Motivo do cancelamento (máximo 500 caracteres)

**Response 200 OK:**
```json
{
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "status": "CANCELADA_PASSAGEIRO",
  "cancellationReason": "Mudança de planos",
  "cancelledBy": "018f1234-5678-9abc-def0-123456789def",
  "cancelledAt": "2025-12-01T08:01:00Z",
  "cancellationFee": 0.00,
  "penaltyApplied": false,
  "message": "Corrida cancelada com sucesso. Penalidades serão aplicadas através do sistema de avaliações."
}
```

**Response 400 Bad Request:**
```json
{
  "error": {
    "message": "Corrida não pode ser cancelada. Status atual: CONCLUIDA",
    "code": "RIDE_NOT_CANCELLABLE"
  }
}
```

### Motorista - Cancelar Corrida

**Endpoint:** `POST /v1/drivers/rides/{rideId}/cancel`

**Autenticação:** Requerida (JWT com role `driver`)

**Request Body:**
```json
{
  "reason": "Emergência pessoal"
}
```

**Campos:**
- `reason` (string, obrigatório): Motivo do cancelamento (máximo 500 caracteres)

**Response 200 OK:**
```json
{
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "status": "CANCELADA_MOTORISTA",
  "cancellationReason": "Emergência pessoal",
  "cancelledBy": "018f1234-5678-9abc-def0-123456789def",
  "cancelledAt": "2025-12-01T08:15:00Z",
  "cancellationFee": 0.00,
  "penaltyApplied": false,
  "message": "Corrida cancelada com sucesso. Penalidades serão aplicadas através do sistema de avaliações."
}
```

## Validações

### Quando uma corrida pode ser cancelada?

Uma corrida **pode ser cancelada** se estiver em qualquer um dos seguintes status:
- `AGUARDANDO_MOTORISTA`
- `MOTORISTA_ENCONTRADO`
- `MOTORISTA_ACEITOU`
- `MOTORISTA_A_CAMINHO`
- `MOTORISTA_PROXIMO`
- `MOTORISTA_CHEGOU`
- `PASSAGEIRO_EMBARCADO`
- `EM_ROTA`
- `PROXIMO_DESTINO`

Uma corrida **não pode ser cancelada** se estiver em:
- `CANCELADA_PASSAGEIRO`
- `CANCELADA_MOTORISTA`
- `CANCELADA_NO_SHOW`
- `EXPIRADA`
- `CONCLUIDA`
- `CORRIDA_FINALIZADA`
- `AGUARDANDO_AVALIACAO`

### Validações de Autorização

- **Passageiro:** Apenas o passageiro que solicitou a corrida pode cancelá-la
- **Motorista:** Apenas o motorista atribuído à corrida pode cancelá-la

## Sistema de Penalidades

As penalidades por cancelamento são aplicadas através do **sistema de avaliações** após a corrida. Quando um usuário cancela uma corrida, o outro usuário pode avaliá-lo negativamente, o que reduzirá sua nota no sistema.

**Nota:** Ver documentação de avaliações (`RATINGS.md`) para detalhes sobre como as notas são calculadas e aplicadas.

## Comportamento do Sistema

### Ao Cancelar uma Corrida

1. **Atualização do Status:**
   - Status muda para `CANCELADA_PASSAGEIRO` ou `CANCELADA_MOTORISTA`
   - Campos `cancelledAt`, `cancelledBy` e `cancellationReason` são preenchidos

2. **Status Operacional do Motorista:**
   - Se houver motorista atribuído, seu status operacional é alterado para `AVAILABLE`
   - Motorista fica disponível para receber novas corridas

3. **Notificações:**
   - Passageiro recebe notificação via WebSocket se cancelado pelo motorista
   - Motorista recebe notificação via WebSocket se cancelado pelo passageiro
   - Tipo de notificação: `ride_cancelled`

4. **Cobrança de Taxa:**
   - A taxa de cancelamento é calculada e retornada na resposta
   - **Nota:** A cobrança efetiva da taxa deve ser implementada no sistema de pagamentos (fora do escopo deste documento)

### Notificações WebSocket

Quando uma corrida é cancelada, o usuário afetado recebe uma notificação via WebSocket:

```json
{
  "type": "ride_cancelled",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "message": "Corrida cancelada pelo passageiro",
  "data": {
    "status": "CANCELADA_PASSAGEIRO",
    "cancelledBy": "018f1234-5678-9abc-def0-123456789def",
    "cancellationReason": "Mudança de planos"
  }
}
```

## Códigos de Erro

| Código HTTP | Código de Erro | Descrição |
|-------------|----------------|-----------|
| 400 | `RIDE_NOT_FOUND` | Corrida não encontrada |
| 400 | `RIDE_NOT_CANCELLABLE` | Corrida não pode ser cancelada (já finalizada, cancelada ou concluída) |
| 403 | `UNAUTHORIZED_CANCELLATION` | Usuário não tem permissão para cancelar esta corrida |
| 400 | `INVALID_CANCELLATION_REASON` | Motivo do cancelamento inválido (vazio ou muito longo) |

## Fluxo de Cancelamento

### Fluxo para Passageiro

```
1. Passageiro solicita cancelamento
   ↓
2. Sistema valida:
   - Corrida existe?
   - Corrida pertence ao passageiro?
   - Corrida pode ser cancelada?
   ↓
3. Sistema calcula penalidade baseada em:
   - Status atual da corrida
   - Tempo desde solicitação
   ↓
4. Sistema atualiza corrida:
   - Status → CANCELADA_PASSAGEIRO
   - Preenche campos de cancelamento
   ↓
5. Se houver motorista:
   - Status operacional → AVAILABLE
   - Envia notificação WebSocket
   ↓
6. Retorna resposta com detalhes da penalidade
```

### Fluxo para Motorista

```
1. Motorista solicita cancelamento
   ↓
2. Sistema valida:
   - Corrida existe?
   - Motorista está atribuído à corrida?
   - Corrida pode ser cancelada?
   ↓
3. Sistema calcula penalidade baseada em:
   - Status atual da corrida
   - Fator multiplicador para motorista (1.5x)
   ↓
4. Sistema atualiza corrida:
   - Status → CANCELADA_MOTORISTA
   - Preenche campos de cancelamento
   ↓
5. Sistema atualiza status operacional:
   - Status operacional → AVAILABLE
   ↓
6. Sistema notifica passageiro via WebSocket
   ↓
7. Retorna resposta com detalhes da penalidade
```

## Considerações de Implementação

### Cobrança de Taxas

As taxas de cancelamento são calculadas e retornadas na resposta, mas a **cobrança efetiva** deve ser implementada no sistema de pagamentos. Recomendações:

1. **Integração com Gateway de Pagamento:**
   - Criar transação de cobrança quando `penaltyApplied = true`
   - Usar o método de pagamento da corrida original
   - Processar cobrança de forma assíncrona

2. **Registro de Transações:**
   - Criar registro de transação de cancelamento
   - Associar à corrida cancelada
   - Manter histórico para auditoria

3. **Reembolsos:**
   - Se houver pagamento antecipado, processar reembolso (se aplicável)
   - Considerar políticas de reembolso baseadas no status da corrida

### Histórico e Auditoria

O sistema mantém histórico completo de cancelamentos através dos campos:
- `cancelledAt`: Data/hora do cancelamento
- `cancelledBy`: Usuário que cancelou
- `cancellationReason`: Motivo informado pelo usuário
- `status`: Status final da corrida

### Limites e Rate Limiting

Recomendações para prevenir abuso:

1. **Limite de Cancelamentos:**
   - Implementar limite de cancelamentos por período (ex: 3 cancelamentos em 24h)
   - Aplicar restrições temporárias após múltiplos cancelamentos

2. **Rate Limiting:**
   - Limitar requisições de cancelamento por usuário
   - Implementar cooldown entre cancelamentos

3. **Análise de Padrões:**
   - Monitorar usuários com alta taxa de cancelamento
   - Implementar alertas para comportamento suspeito

## Exemplos de Uso

### Exemplo 1: Cancelamento sem Taxa (Passageiro)

```bash
curl -X POST "https://api.vamu.com/v1/passengers/rides/018f1234-5678-9abc-def0-123456789abc/cancel" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Mudança de planos"
  }'
```

**Resposta:**
```json
{
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "status": "CANCELADA_PASSAGEIRO",
  "cancellationReason": "Mudança de planos",
  "cancelledBy": "018f1234-5678-9abc-def0-123456789def",
  "cancelledAt": "2025-12-01T08:01:00Z",
  "cancellationFee": 0.00,
  "penaltyApplied": false,
  "message": "Cancelamento realizado dentro do prazo de 2 minutos. Nenhuma taxa aplicada."
}
```

### Exemplo 2: Cancelamento com Taxa (Motorista)

```bash
curl -X POST "https://api.vamu.com/v1/drivers/rides/018f1234-5678-9abc-def0-123456789abc/cancel" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Emergência pessoal"
  }'
```

**Resposta:**
```json
{
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "status": "CANCELADA_MOTORISTA",
  "cancellationReason": "Emergência pessoal",
  "cancelledBy": "018f1234-5678-9abc-def0-123456789def",
  "cancelledAt": "2025-12-01T08:15:00Z",
  "cancellationFee": 15.00,
  "penaltyApplied": true,
  "message": "Taxa de cancelamento de R$ 15,00 aplicada (cancelamento após aceitar corrida)."
}
```

## Notas Importantes

1. **Janela de Cancelamento Gratuito:**
   - Passageiros têm 2 minutos após solicitar a corrida para cancelar sem taxa
   - Aplica-se apenas se o motorista ainda não aceitou a corrida

2. **Penalidades Progressivas:**
   - Taxas aumentam conforme a corrida avança
   - Penalidades são mais altas para motoristas que cancelam após aceitar

3. **Cancelamento Após Embarque:**
   - Taxas são calculadas como percentual do preço estimado
   - Garante compensação adequada para o motorista que já iniciou o trajeto

4. **Status Operacional:**
   - Motorista sempre volta para `AVAILABLE` após cancelamento
   - Permite que motorista receba novas corridas imediatamente

5. **Notificações em Tempo Real:**
   - Ambos os usuários são notificados via WebSocket
   - Garante transparência e comunicação imediata

