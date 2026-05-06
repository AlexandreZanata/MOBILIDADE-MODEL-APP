const paymentMethodMessages = {
  screenTitle: 'Metodo de Pagamento',
  screenSubtitle: 'Selecione como deseja pagar pela viagem',
  loadingMethods: 'Carregando metodos de pagamento...',
  loadingBrands: 'Carregando bandeiras...',
  noMethodsAvailable: 'Nenhum metodo de pagamento disponivel no momento.',
  confirmRide: 'Confirmar e Solicitar Corrida',
  creatingRide: 'Criando corrida...',
  attentionTitle: 'Atencao',
  errorTitle: 'Erro',
  selectMethod: 'Por favor, selecione um metodo de pagamento',
  selectBrand: 'Por favor, selecione a bandeira do cartao',
  tripDataNotFound: 'Dados da viagem nao encontrados',
  estimateIdNotFound: 'ID da estimativa nao encontrado. Por favor, tente novamente.',
  estimateRenewFailed: 'A estimativa expirou e nao foi possivel obter uma nova. Por favor, tente novamente.',
  createRideFailed: 'Nao foi possivel criar a corrida. Tente novamente.',
  createRideMissingId: 'A corrida foi criada mas nao foi possivel obter o ID. Tente novamente.',
  loadMethodsFailed: 'Nao foi possivel carregar os metodos de pagamento',
} as const;

type PaymentMethodMessageKey = keyof typeof paymentMethodMessages;

export function tpm(key: PaymentMethodMessageKey): string {
  return String(paymentMethodMessages[key]);
}
