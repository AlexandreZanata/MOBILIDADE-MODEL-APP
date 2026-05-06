const tripPriceMessages = {
  errorTitle: 'Erro',
  attentionTitle: 'Atencao',
  missingOriginDestination: 'Origem e destino sao necessarios',
  loadCategoriesFailed: 'Nao foi possivel carregar as categorias. Tente novamente.',
  invalidCategories: 'Nao foi possivel carregar as categorias. Tente novamente.',
  noCategorySelected: 'Por favor, selecione uma categoria',
  loadingPrices: 'Calculando precos...',
  title: 'Escolha sua viagem',
  subtitle: 'Selecione a categoria que melhor atende suas necessidades',
  finalPrice: 'Preco final',
  multiplier: 'Multiplicador',
  noDestination: 'Selecione um destino primeiro...',
  noCategoriesAvailable: 'Nenhuma categoria disponivel no momento.',
  confirmRide: 'Confirmar corrida',
  fallbackCategory: 'Categoria',
} as const;

type TripPriceMessageKey = keyof typeof tripPriceMessages;

export function ttp(key: TripPriceMessageKey): string {
  return tripPriceMessages[key];
}
