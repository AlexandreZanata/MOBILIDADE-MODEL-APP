/**
 * @file waitingForDriver.ts
 * @description i18n strings for the WaitingForDriver screen (PT-BR).
 * All user-visible text must come from here — no hardcoded strings in components.
 */
const waitingForDriverMessages = {
  // ── Searching state ──────────────────────────────────────────────────────
  searchingTitle: 'Procurando motorista',
  searchingSubtitle: 'Buscando o melhor motorista para você',
  waitingTimeLabel: 'tempo de espera',

  // ── Driver found state ───────────────────────────────────────────────────
  driverFoundChip: 'Motorista encontrado!',
  driverAssignedTitle: 'Motorista encontrado',
  followMapCta: 'Acompanhar no mapa',

  // ── Driver info ──────────────────────────────────────────────────────────
  fareLabel: 'Tarifa estimada',
  statusLabel: 'Status',
  etaUnit: 'min',

  // ── Actions ──────────────────────────────────────────────────────────────
  chatButton: 'Chat de suporte',
  cancelButton: 'Cancelar corrida',
  openChat: 'Abrir chat',
  closeChat: 'Fechar chat',

  // ── Cancel dialog ────────────────────────────────────────────────────────
  cancelDialogTitle: 'Cancelar corrida?',
  cancelDialogBody: 'Cancelamentos frequentes podem afetar sua conta.',
  cancelConfirmTitle: 'Cancelar Corrida',
  cancelConfirmMessage: 'Tem certeza que deseja cancelar esta corrida?',
  yesCancel: 'Sim, cancelar',
  goBack: 'Voltar',
  no: 'Não',

  // ── Rating modal ─────────────────────────────────────────────────────────
  rateTitle: 'Avalie seu motorista',
  rateCommentPlaceholder: 'Conte como foi a viagem (opcional)',
  submitRating: 'Enviar avaliação',
  skipRating: 'Pular',

  // ── Errors ───────────────────────────────────────────────────────────────
  errorTitle: 'Erro',
  missingRide: 'Nenhuma corrida ativa foi encontrada.',
  ratingUnavailable: 'A avaliação só pode ser enviada após a corrida ser finalizada.',
  ratingFailed: 'Não foi possível enviar a avaliação.',
} as const;

export type WaitingForDriverMessageKey = keyof typeof waitingForDriverMessages;

/** Type-safe i18n accessor for the WaitingForDriver domain. */
export function twfd(key: WaitingForDriverMessageKey): string {
  return waitingForDriverMessages[key];
}
