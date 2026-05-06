const loginMessages = {
  welcomeTitle: 'Bem-vindo',
  welcomeSubtitle: 'Entre com suas credenciais para acessar sua conta',
  emailLabel: 'E-mail',
  emailPlaceholder: 'seu@email.com',
  passwordLabel: 'Senha',
  passwordPlaceholder: 'Digite sua senha',
  forgotPassword: 'Esqueci minha senha',
  forgotPasswordTitle: 'Recuperar Senha',
  forgotPasswordMessage: 'Entre em contato com o suporte para recuperar sua senha.',
  submit: 'Entrar',
  noAccount: 'Não tem uma conta?',
  register: 'Cadastre-se',
  requiredEmail: 'Email é obrigatório',
  invalidEmail: 'Email inválido',
  requiredPassword: 'Senha é obrigatória',
  minPasswordLength: 'Senha deve ter no mínimo 8 caracteres',
  invalidCredentials: 'Email ou senha incorretos',
  loginErrorTitle: 'Erro no Login',
  loginErrorFallback: 'Não foi possível fazer login. Verifique suas credenciais.',
  unexpectedErrorTitle: 'Erro',
  unexpectedErrorMessage: 'Ocorreu um erro inesperado. Tente novamente.',
  ok: 'OK',
} as const;

export type LoginMessageKey = keyof typeof loginMessages;

export function tl(key: LoginMessageKey): string {
  return loginMessages[key];
}
