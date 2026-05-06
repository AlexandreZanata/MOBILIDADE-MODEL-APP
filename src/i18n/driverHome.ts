const driverHomeMessages = {
  permissionTitle: 'Permissao necessaria',
  permissionDescription: 'Precisamos da sua localizacao para funcionar corretamente.',
  unavailableActivationTitle: 'Nao e possivel ativar disponibilidade',
  pendingDocsTitle: 'Documentos Pendentes',
  connectionErrorTitle: 'Erro de Conexao',
  connectionErrorDescription:
    'Nao foi possivel conectar ao servidor. Verifique sua conexao com a internet e tente novamente.',
  locationErrorTitle: 'Erro de Localizacao',
  locationErrorDescription:
    'Nao foi possivel obter sua localizacao. Verifique as permissoes de GPS e tente novamente.',
  unknownPaymentMethod: 'Nao especificado',
  newRideTitle: 'Nova corrida disponivel',
  newRideBody: 'Ha um passageiro aguardando corrida',
  newRideWithPassengerBody: 'Passageiro {{name}} aguardando',
  newRideValueBody: '{{name}} aguardando. Valor estimado: R$ {{value}}',
  cnhPending: 'CNH em analise. Voce so podera fazer corridas apos a aprovacao.',
  cnhRejected: 'CNH rejeitada: {{reason}}. Envie uma nova CNH para continuar.',
  awaitingCnh: 'Envie sua CNH para comecar a receber corridas.',
  awaitingVehicle: 'Cadastre um veiculo para comecar a receber corridas.',
  vehiclePending: 'Veiculo em analise. Voce so podera fazer corridas apos a aprovacao.',
  vehicleRejected: 'Veiculo rejeitado. Cadastre um novo veiculo para continuar.',
  loadingEligibility: 'Carregando informacoes...',
  activateNeedAll:
    'Envie os documentos do carro, cadastre um veiculo e envie a CNH para ativar a disponibilidade.',
  activateCnhPending: 'CNH em analise. Aguarde a aprovacao para ativar a disponibilidade.',
  activateCnhRejected: 'CNH rejeitada. Envie uma nova CNH para continuar.',
  activateNeedVehicle: 'Cadastre um veiculo para ativar a disponibilidade.',
  activateVehiclePending: 'Veiculo em analise. Aguarde a aprovacao para ativar a disponibilidade.',
  activateVehicleRejected: 'Veiculo rejeitado. Cadastre um novo veiculo para continuar.',
  activateNeedCarDocs: 'Complete o envio dos documentos do carro para ativar a disponibilidade.',
  activateNeedRegistration: 'Complete o cadastro para ativar a disponibilidade.',
  updateAvailabilityError: 'Nao foi possivel atualizar a disponibilidade. Tente novamente.',
  tooManyRequestsDeferred: 'Muitas requisicoes. A requisicao sera enviada em 1 minuto.',
  enableAvailabilityError: 'Erro ao ativar disponibilidade',
  disableAvailabilityError: 'Erro ao desativar disponibilidade',
  defaultCnhRejectedReason: 'CNH rejeitada',
  pendingDocsDefault:
    'Voce tem documentos pendentes de aprovacao. So podera fazer corridas apos a aprovacao.',
  // ─── Status card ────────────────────────────────────────────────────────────
  statusAvailable: 'Disponivel para corridas',
  statusUnavailable: 'Indisponivel',
  statusConnecting: 'Conectando com o servidor...',
  statusRateLimitedAvailability: 'Aguardando 1 minuto para enviar requisicao...',
  statusRateLimited: 'Aguardando antes de continuar...',
  statusUpdatingLocation: 'Atualizando localizacao...',
  statusReady: 'Pronto para receber corridas',
  statusPendingDocsDefault: 'Documentos pendentes de aprovacao',
  // ─── Info card ───────────────────────────────────────────────────────────────
  infoCardTitle: 'Voce esta indisponivel',
  infoCardSubtitle:
    'Ative o modo disponivel para comecar a receber corridas e ganhar dinheiro. Sua localizacao sera compartilhada quando voce estiver online.',
  infoCardButtonActivate: 'Ativar Disponibilidade',
  infoCardButtonConnecting: 'Conectando...',
  yes: 'Sim',
  no: 'Nao',
  /** Linha única com dados de GET /v1/drivers/operational-status */
  operationalSnapshotLine:
    'Servidor: {{status}} · Pode receber corridas: {{canReceive}} · Conectado: {{online}}',
  cannotReceiveRidesExplain:
    'A API indica que voce nao pode receber novas corridas agora (veja os dados do servidor abaixo). Se o cadastro estiver ok, tente novamente ou entre em contato com o suporte.',
  operationalOpAvailable: 'Disponivel',
  operationalOpBusy: 'Em corrida',
  operationalOpPaused: 'Pausado',
  operationalOpOffline: 'Offline',
} as const;

type DriverHomeMessageKey = keyof typeof driverHomeMessages;

const OPERATIONAL_STATUS_LABEL_KEYS = {
  AVAILABLE: 'operationalOpAvailable',
  BUSY: 'operationalOpBusy',
  PAUSED: 'operationalOpPaused',
  OFFLINE: 'operationalOpOffline',
} as const satisfies Record<string, DriverHomeMessageKey>;

/** Rótulo amigável para `operationalStatus` retornado pela API. */
export function tdhOperationalStatus(status: string): string {
  const key = OPERATIONAL_STATUS_LABEL_KEYS[status as keyof typeof OPERATIONAL_STATUS_LABEL_KEYS];
  return key ? String(driverHomeMessages[key]) : status;
}

/**
 * Resolve strings da Home do motorista com interpolacao simples.
 */
export function tdh(key: DriverHomeMessageKey, params?: Record<string, string>): string {
  const base = String(driverHomeMessages[key]);
  if (!params) {
    return base;
  }

  let value = base;
  Object.entries(params).forEach(([placeholder, replacement]) => {
    value = value.replace(`{{${placeholder}}}`, replacement);
  });
  return value;
}
