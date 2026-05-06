const verifyEmailMessages = {
  title: 'Verificar Email',
  subtitle: 'Digite o codigo de 6 digitos que enviamos para:',
  verifyButton: 'Verificar',
  resendPrompt: 'Nao recebeu o codigo?',
  resendCode: 'Reenviar codigo',
  alreadyVerified: 'Ja verifiquei',
  missingCode: 'Por favor, preencha todos os 6 digitos',
  missingEmailTitle: 'Erro',
  missingEmailMessage: 'Email nao encontrado. Por favor, faca o cadastro novamente.',
  successTitle: 'Email verificado!',
  successMessage: 'Seu email foi verificado com sucesso. Agora voce pode fazer login.',
  invalidCodeFallback: 'Codigo invalido. Verifique o codigo enviado para seu email.',
  verificationError: 'Erro ao verificar codigo. Tente novamente.',
  resendTitle: 'Reenviar codigo',
  resendMessage: 'Funcionalidade de reenvio de codigo sera implementada em breve.',
  ok: 'OK',
} as const;

export type VerifyEmailMessageKey = keyof typeof verifyEmailMessages;

export function tve(key: VerifyEmailMessageKey): string {
  return verifyEmailMessages[key];
}
