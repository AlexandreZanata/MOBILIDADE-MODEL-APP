const historyMessages = {
  title: 'Pagamentos',
  subtitleAuthenticated: 'Gerencie seus métodos de pagamento',
  subtitleGuest: 'Faça login para ver seu histórico de pagamentos',
  loginTitle: 'Faça login para continuar',
  loginMessage: 'Você precisa estar logado para ver seu histórico de pagamentos',
  emptyTitle: 'Nenhum pagamento ainda',
  emptyMessage: 'Seus métodos de pagamento aparecerão aqui quando você adicionar um',
  loginButton: 'Fazer Login',
} as const;

export type HistoryMessageKey = keyof typeof historyMessages;

export function th(key: HistoryMessageKey): string {
  return historyMessages[key];
}
