export const MIN_DISTANCE_METERS = 50;

export const ROUTING_MESSAGES = {
  DISTANCE_TOO_SHORT: 'Origem e destino muito próximos para calcular rota.',
  ROUTE_ERROR: 'Não foi possível calcular a rota.',
  ROUTE_ASYNC_ERROR: 'Não foi possível enfileirar o cálculo de rota.',
  RATE_LIMIT_ERROR: 'Não foi possível consultar o rate limit.',
} as const;
