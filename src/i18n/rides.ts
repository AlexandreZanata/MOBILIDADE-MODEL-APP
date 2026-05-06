const ridesMessages = {
  title: 'Corridas',
  guestSubtitle: 'Faça login para ver seu histórico de corridas',
  driverSubtitle: 'Histórico de corridas realizadas',
  passengerSubtitle: 'Suas viagens recentes',
  loginTitle: 'Faça login para continuar',
  loginMessage: 'Você precisa estar logado para ver seu histórico de corridas',
  loginButton: 'Fazer Login',
  emptyTitle: 'Nenhuma corrida ainda',
  emptyMessage: 'Suas corridas aparecerão aqui assim que você realizar sua primeira viagem',
  loadMore: 'Carregar mais',
  priceLabel: 'Valor',
  passengerFallback: 'Passageiro',
  driverFallback: 'Motorista',
} as const;

export type RidesMessageKey = keyof typeof ridesMessages;

export function trd(key: RidesMessageKey): string {
  return ridesMessages[key];
}
