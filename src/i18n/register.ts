const registerMessages = {
  title: 'Criar conta',
  subtitle: 'Preencha os dados para criar sua conta',
  passenger: 'Passageiro',
  driver: 'Motorista',
  submit: 'Criar conta',
  hasAccount: 'Já tem uma conta?',
  login: 'Fazer login',
  registerErrorTitle: 'Erro no Cadastro',
  registerErrorFallback: 'Não foi possível realizar o cadastro.',
  unexpectedErrorTitle: 'Erro',
  unexpectedErrorMessage: 'Ocorreu um erro inesperado. Tente novamente.',
} as const;

export type RegisterMessageKey = keyof typeof registerMessages;

export function tr(key: RegisterMessageKey): string {
  return registerMessages[key];
}
