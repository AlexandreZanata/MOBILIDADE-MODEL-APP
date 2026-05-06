const waitingForDriverMessages = {
  searchingTitle: 'Procurando motorista',
  searchingSubtitle: 'Estamos buscando o melhor motorista para sua corrida.',
  driverAssignedTitle: 'Motorista encontrado',
  fareLabel: 'Tarifa estimada',
  statusLabel: 'Status',
  cancelRide: 'Cancelar corrida',
  openChat: 'Abrir chat',
  closeChat: 'Fechar chat',
  rateTitle: 'Avalie seu motorista',
  rateCommentPlaceholder: 'Conte como foi a viagem (opcional)',
  submitRating: 'Enviar avaliacao',
  skipRating: 'Pular',
  cancelConfirmTitle: 'Cancelar Corrida',
  cancelConfirmMessage: 'Tem certeza que deseja cancelar esta corrida?',
  yesCancel: 'Sim, Cancelar',
  no: 'Nao',
  errorTitle: 'Erro',
  missingRide: 'Nenhuma corrida ativa foi encontrada.',
  ratingUnavailable: 'A avaliacao so pode ser enviada apos a corrida ser finalizada.',
  ratingFailed: 'Nao foi possivel enviar a avaliacao.',
} as const;

export type WaitingForDriverMessageKey = keyof typeof waitingForDriverMessages;

export function twfd(key: WaitingForDriverMessageKey): string {
  return waitingForDriverMessages[key];
}
