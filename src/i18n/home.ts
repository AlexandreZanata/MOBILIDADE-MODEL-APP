const homeMessages = {
  searchPlaceholder: 'Para onde enviar?',
  helperText: '*Digite para escolher o destino....',
  resultsTitle: 'Resultados',
  noResultsInCity: 'Nenhum local encontrado em Sorriso, MT',
  newRideTitle: 'Nova Corrida',
  destinationLabel: 'Destino',
  selectDestination: 'Selecione um destino',
  estimatedTimeLabel: 'Tempo estimado',
  estimatedTimeValue: '30 min',
  requestTripButton: 'Solicitar corrida',
  permissionDeniedTitle: 'Permissao negada',
  permissionDeniedDescription: 'Precisamos da sua localizacao para melhorar a experiencia.',
  waitLocationTitle: 'Atencao',
  waitLocationDescription: 'Por favor, aguarde a localizacao ser detectada.',
  chooseDestinationTitle: 'Atencao',
  chooseDestinationDescription: 'Selecione um destino primeiro...',
  resolveLocationTitle: 'Erro ao obter localização',
  resolveLocationDescription: 'Não foi possível obter as coordenadas deste local. Tente novamente ou escolha outro destino.',
  // Ride-type carousel
  rideTypesSectionLabel: 'nova corrida',
  loadingCategories: 'Calculando precos...',
  noCategoriesAvailable: 'Nenhuma categoria disponivel.',
  selectCategoryFirst: 'Selecione uma categoria',
  etaUnit: 'min',
  couponButton: 'Cupom',
} as const;

type HomeMessageKey = keyof typeof homeMessages;

export function th(key: HomeMessageKey): string {
  return String(homeMessages[key]);
}
