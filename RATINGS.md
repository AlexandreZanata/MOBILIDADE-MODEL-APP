# Sistema de Avaliações

## Visão Geral

O sistema de avaliações permite que motoristas e passageiros se avaliem mutuamente após uma corrida finalizada. O sistema utiliza um modelo de notas onde todos os usuários começam com nota **10.00** e a nota diminui conforme avaliações negativas são recebidas.

## Endpoints

### Passageiro - Avaliar Motorista

**Endpoint:** `POST /v1/passengers/rides/{rideId}/ratings`

**Autenticação:** Requerida (JWT com role `passenger`)

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excelente motorista, muito pontual!"
}
```

**Campos:**
- `rating` (integer, obrigatório): Nota de 1 a 5 (5 é a melhor)
- `comment` (string, opcional): Comentário (máximo 500 caracteres)

**Response 201 Created:**
```json
{
  "id": "018f1234-5678-9abc-def0-123456789abc",
  "rideId": "018f1234-5678-9abc-def0-123456789def",
  "raterId": "018f1234-5678-9abc-def0-123456789ghi",
  "ratedId": "018f1234-5678-9abc-def0-123456789jkl",
  "rating": 5,
  "comment": "Excelente motorista, muito pontual!",
  "createdAt": "2025-12-01T08:00:00Z"
}
```

### Motorista - Avaliar Passageiro

**Endpoint:** `POST /v1/drivers/rides/{rideId}/ratings`

**Autenticação:** Requerida (JWT com role `driver`)

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Passageiro muito educado e pontual!"
}
```

**Response 201 Created:**
```json
{
  "id": "018f1234-5678-9abc-def0-123456789abc",
  "rideId": "018f1234-5678-9abc-def0-123456789def",
  "raterId": "018f1234-5678-9abc-def0-123456789ghi",
  "ratedId": "018f1234-5678-9abc-def0-123456789jkl",
  "rating": 5,
  "comment": "Passageiro muito educado e pontual!",
  "createdAt": "2025-12-01T08:00:00Z"
}
```

### Consultar Minha Nota (Passageiro)

**Endpoint:** `GET /v1/passengers/ratings/me`

**Autenticação:** Requerida (JWT com role `passenger`)

**Response 200 OK:**
```json
{
  "userId": "018f1234-5678-9abc-def0-123456789abc",
  "currentRating": "9.50",
  "totalRatings": 15
}
```

### Consultar Minha Nota (Motorista)

**Endpoint:** `GET /v1/drivers/ratings/me`

**Autenticação:** Requerida (JWT com role `driver`)

**Response 200 OK:**
```json
{
  "userId": "018f1234-5678-9abc-def0-123456789abc",
  "currentRating": "9.50",
  "totalRatings": 15
}
```

## Validações

### Quando uma avaliação pode ser feita?

Uma avaliação **pode ser feita** apenas quando a corrida está em um dos seguintes status:
- `CORRIDA_FINALIZADA`
- `AGUARDANDO_AVALIACAO`
- `CONCLUIDA`

### Validações de Autorização

- **Passageiro:** Apenas o passageiro da corrida pode avaliar o motorista
- **Motorista:** Apenas o motorista atribuído à corrida pode avaliar o passageiro
- **Limite:** Cada usuário pode avaliar apenas uma vez por corrida

## Sistema de Notas

### Nota Inicial

Todos os usuários começam com nota **10.00** quando se cadastram no sistema.

### Cálculo da Nota

A nota diminui baseada na avaliação recebida (1 a 5):

| Nota Recebida | Redução na Nota | Descrição |
|---------------|------------------|-----------|
| 5 | 0.00 pontos | Excelente - não reduz a nota |
| 4 | 0.25 pontos | Bom - reduz pouco |
| 3 | 0.50 pontos | Regular - reduz moderadamente |
| 2 | 0.75 pontos | Ruim - reduz bastante |
| 1 | 1.00 ponto | Muito ruim - reduz muito |

### Fórmula

```
Nova Nota = Nota Atual - Fator de Redução
```

A nota nunca fica negativa (mínimo é 0.00).

### Exemplos de Cálculo

#### Exemplo 1: Usuário novo recebe primeira avaliação
- **Nota inicial:** 10.00
- **Avaliação recebida:** 5 (excelente)
- **Redução:** 0.00
- **Nova nota:** 10.00

#### Exemplo 2: Usuário recebe avaliação regular
- **Nota atual:** 10.00
- **Avaliação recebida:** 3 (regular)
- **Redução:** 0.50
- **Nova nota:** 9.50

#### Exemplo 3: Usuário recebe avaliação ruim
- **Nota atual:** 9.50
- **Avaliação recebida:** 2 (ruim)
- **Redução:** 0.75
- **Nova nota:** 8.75

#### Exemplo 4: Usuário recebe avaliação muito ruim
- **Nota atual:** 8.75
- **Avaliação recebida:** 1 (muito ruim)
- **Redução:** 1.00
- **Nova nota:** 7.75

#### Exemplo 5: Múltiplas avaliações
- **Nota inicial:** 10.00
- **Avaliação 1:** 5 → Nota: 10.00 (sem redução)
- **Avaliação 2:** 4 → Nota: 9.75 (reduz 0.25)
- **Avaliação 3:** 3 → Nota: 9.25 (reduz 0.50)
- **Avaliação 4:** 5 → Nota: 9.25 (sem redução)
- **Avaliação 5:** 2 → Nota: 8.50 (reduz 0.75)

## Comportamento do Sistema

### Ao Criar uma Avaliação

1. **Validação:**
   - Verifica se a corrida está finalizada
   - Verifica se o avaliador é passageiro ou motorista da corrida
   - Verifica se já existe avaliação para esta corrida por este avaliador

2. **Criação da Avaliação:**
   - Cria registro na tabela `ratings`
   - Associa à corrida, avaliador e avaliado

3. **Atualização da Nota:**
   - Busca ou cria registro na tabela `user_ratings` para o usuário avaliado
   - Calcula nova nota baseada na avaliação recebida
   - Atualiza `current_rating` e `total_ratings`

4. **Atualização do Status da Corrida:**
   - Se ambos (passageiro e motorista) já avaliaram, a corrida muda para `AGUARDANDO_AVALIACAO`

### Consulta de Nota

Quando um usuário consulta sua nota:
- Se já recebeu avaliações: retorna a nota atual e total de avaliações
- Se nunca recebeu avaliações: retorna nota inicial de 10.00 e total de 0

## Códigos de Erro

| Código HTTP | Código de Erro | Descrição |
|-------------|----------------|-----------|
| 400 | `RIDE_NOT_FOUND` | Corrida não encontrada |
| 400 | `RIDE_NOT_FINALIZED` | Corrida não está finalizada |
| 400 | `RATING_ALREADY_EXISTS` | Avaliação já foi feita para esta corrida |
| 403 | `UNAUTHORIZED_RATING` | Usuário não tem permissão para avaliar esta corrida |
| 400 | `INVALID_RATING` | Nota inválida (deve ser entre 1 e 5) |

## Fluxo de Avaliação

### Fluxo Completo

```
1. Corrida é finalizada (status → CORRIDA_FINALIZADA)
   ↓
2. Passageiro avalia motorista
   - Sistema cria avaliação
   - Sistema atualiza nota do motorista
   ↓
3. Motorista avalia passageiro
   - Sistema cria avaliação
   - Sistema atualiza nota do passageiro
   ↓
4. Se ambos avaliaram:
   - Status da corrida → AGUARDANDO_AVALIACAO
```

### Exemplo de Uso

#### 1. Passageiro avalia motorista

```bash
curl -X POST "https://api.vamu.com/v1/passengers/rides/018f1234-5678-9abc-def0-123456789abc/ratings" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Excelente motorista!"
  }'
```

**Resposta:**
```json
{
  "id": "018f1234-5678-9abc-def0-123456789def",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "raterId": "018f1234-5678-9abc-def0-123456789ghi",
  "ratedId": "018f1234-5678-9abc-def0-123456789jkl",
  "rating": 5,
  "comment": "Excelente motorista!",
  "createdAt": "2025-12-01T08:00:00Z"
}
```

#### 2. Motorista avalia passageiro

```bash
curl -X POST "https://api.vamu.com/v1/drivers/rides/018f1234-5678-9abc-def0-123456789abc/ratings" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "comment": "Passageiro educado"
  }'
```

#### 3. Consultar minha nota

```bash
curl -X GET "https://api.vamu.com/v1/passengers/ratings/me" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Resposta:**
```json
{
  "userId": "018f1234-5678-9abc-def0-123456789abc",
  "currentRating": "9.75",
  "totalRatings": 1
}
```

## Notas Importantes

1. **Avaliação Única:**
   - Cada usuário pode avaliar apenas uma vez por corrida
   - Tentar avaliar novamente retorna erro

2. **Nota Inicial:**
   - Todos começam com 10.00
   - Nota só diminui, nunca aumenta
   - Nota mínima é 0.00

3. **Avaliação Após Cancelamento:**
   - Se uma corrida foi cancelada, não pode ser avaliada
   - Apenas corridas finalizadas podem ser avaliadas

4. **Transparência:**
   - Usuários podem consultar sua própria nota a qualquer momento
   - Nota é atualizada imediatamente após receber avaliação

5. **Impacto das Notas:**
   - Notas baixas podem impactar a capacidade de receber corridas (implementação futura)
   - Notas muito baixas podem resultar em restrições ou suspensão (implementação futura)

## Considerações de Implementação

### Uso de Notas no Sistema

As notas podem ser usadas para:

1. **Priorização de Corridas:**
   - Motoristas com notas mais altas podem receber mais ofertas
   - Passageiros com notas mais altas podem ter prioridade em alta demanda

2. **Filtros e Restrições:**
   - Motoristas podem filtrar passageiros por nota mínima
   - Sistema pode restringir usuários com notas muito baixas

3. **Programas de Incentivo:**
   - Usuários com notas altas podem receber benefícios
   - Programas de fidelidade baseados em notas

4. **Monitoramento:**
   - Alertas para usuários com notas em declínio
   - Análise de padrões de avaliação

### Histórico e Auditoria

O sistema mantém histórico completo através da tabela `ratings`:
- Todas as avaliações são registradas
- Comentários são armazenados
- Timestamps de criação são mantidos

### Performance

- Índices criados para consultas frequentes:
  - `idx_ratings_rated_id`: Para buscar avaliações de um usuário
  - `idx_ratings_ride_id`: Para buscar avaliações de uma corrida
  - `idx_user_ratings_rating`: Para ordenar usuários por nota

