const homeMessages = {
  // Search bar
  searchPlaceholder: 'Para onde você vai?',
  helperText: 'Digite para escolher o destino...',
  resultsTitle: 'Resultados',
  noResultsInCity: 'Nenhum local encontrado',

  // Bottom sheet
  newRideTitle: 'Nova corrida',
  destinationLabel: 'Destino',
  selectDestination: 'Selecione um destino',
  estimatedTimeLabel: 'Tempo estimado',
  estimatedTimeValue: '30 min',

  // CTA
  requestTripButton: 'Solicitar corrida',

  // Payment
  paymentLabel: 'Pagamento',
  changePayment: 'Alterar',
  paymentSheetTitle: 'Como deseja pagar?',
  confirmPayment: 'Confirmar pagamento',
  addCard: '+ Adicionar cartão',
  cashOption: 'Dinheiro',
  cashSubtitle: 'Com troco',
  pixSubtitle: 'Instantâneo',

  // Alerts
  permissionDeniedTitle: 'Permissão negada',
  permissionDeniedDescription: 'Precisamos da sua localização para melhorar a experiência.',
  waitLocationTitle: 'Atenção',
  waitLocationDescription: 'Por favor, aguarde a localização ser detectada.',
  chooseDestinationTitle: 'Atenção',
  chooseDestinationDescription: 'Selecione um destino primeiro.',
  resolveLocationTitle: 'Erro ao obter localização',
  resolveLocationDescription: 'Não foi possível obter as coordenadas deste local. Tente novamente ou escolha outro destino.',

  // Ride-type carousel
  rideTypesSectionLabel: 'nova corrida',
  loadingCategories: 'Calculando preços...',
  noCategoriesAvailable: 'Nenhuma categoria disponível.',
  selectCategoryFirst: 'Selecione uma categoria',
  etaUnit: 'min',
  couponButton: 'Cupom',
} as const;

type HomeMessageKey = keyof typeof homeMessages;

export function th(key: HomeMessageKey): string {
  return String(homeMessages[key]);
}
