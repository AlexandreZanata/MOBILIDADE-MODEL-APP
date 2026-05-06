import { BillingCycleStatus } from '@/models/billing/types';

const billingMessages = {
  title: 'Pagamentos',
  subtitle: 'Gerencie seus pagamentos e ciclos de cobrança',
  loading: 'Carregando informações...',
  historyTitle: 'Histórico de Ciclos',
  totalPending: 'Total Pendente',
  pendingRides: 'Corridas pendentes:',
  currentCycle: 'Ciclo atual:',
  blockedWarning:
    'Você está bloqueado devido a pagamentos em atraso. Pague suas pendências para continuar recebendo corridas.',
  cycleRides: 'Corridas:',
  cyclePricePerRide: 'Valor por corrida:',
  cyclePaid: 'Pago:',
  cycleRemaining: 'Restante:',
  cyclePixDue: 'Vencimento PIX:',
  emptyCycles: 'Nenhum ciclo de cobrança encontrado.',
  loadMore: 'Carregar mais',
  modalTitle: 'QR Code PIX',
  modalExpiresIn: 'Vence em: {{date}}',
  modalInstructions:
    'Escaneie o QR Code com o app do seu banco ou copie o código PIX para pagar.',
  generatePix: 'Gerar QR Code PIX',
  copyPix: 'Copiar Código PIX',
  payAll: 'Pagar Tudo ({{amount}})',
  errorTitle: 'Erro',
  warningTitle: 'Aviso',
  serverErrorTitle: 'Erro no Servidor',
  successTitle: 'Sucesso',
  serverErrorMessage:
    'O servidor encontrou um erro ao processar sua solicitação. Por favor, tente novamente em alguns instantes ou entre em contato com o suporte.',
  statusLoadError: 'Não foi possível carregar o status de cobrança.',
  cyclesLoadError: 'Não foi possível carregar os ciclos de cobrança.',
  cycleNoPendingAmount: 'Este ciclo não possui valor pendente para pagamento.',
  noPendingDebt: 'Não há débito pendente para pagamento.',
  pixGenerateError: 'Não foi possível gerar o QR Code PIX. Tente novamente.',
  pixCopied: 'Código PIX copiado para a área de transferência!',
  backButton: 'Voltar',
  pendingCycles: 'Ciclos pendentes:',
  nextDueDate: 'Próximo vencimento:',
  viewActivePix: 'Ver PIX gerado',
  generatingPix: 'Gerando PIX...',
  status: {
    PENDING: 'Pendente',
    PROCESSING: 'Processando',
    AWAITING_PAYMENT: 'Aguardando Pagamento',
    PAID: 'Pago',
    PARTIALLY_PAID: 'Pago Parcialmente',
    OVERDUE: 'Vencido',
    GRACE_PERIOD: 'Período de Carência',
    BLOCKED: 'Bloqueado',
    CANCELLED: 'Cancelado',
  } satisfies Record<BillingCycleStatus, string>,
} as const;

type BillingMessageKey = Exclude<keyof typeof billingMessages, 'status'>;

export function tb(key: BillingMessageKey, params?: Record<string, string>): string {
  const base = String(billingMessages[key]);
  if (!params) {
    return base;
  }

  let value = base;
  Object.entries(params).forEach(([placeholder, replacement]) => {
    value = value.replace(`{{${placeholder}}}`, replacement);
  });
  return value;
}

export function tBillingStatus(status: BillingCycleStatus): string {
  return billingMessages.status[status];
}
