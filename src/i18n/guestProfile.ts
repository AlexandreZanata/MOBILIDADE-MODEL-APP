const guestProfileMessages = {
  anonymousTitle: 'Navegacao Anonima',
  anonymousSubtitle: 'Voce esta explorando o aplicativo. Faca login para acessar todas as funcionalidades',
  welcomeTitle: 'Bem-vindo ao VAMU',
  welcomeSubtitle: 'Crie uma conta ou faca login para comecar a usar nossos servicos',
  loginButton: 'Fazer Login',
  registerButton: 'Criar Conta',
} as const;

type GuestProfileMessageKey = keyof typeof guestProfileMessages;

export function tgp(key: GuestProfileMessageKey): string {
  return guestProfileMessages[key];
}
