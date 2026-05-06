/**
 * @file profile.ts
 * @description i18n strings for the Profile screen (PT-BR).
 * All user-visible text must come from here — no hardcoded strings in components.
 */
import { DriverStatus } from '@/models/profile/types';

const profileMessages = {
  // ── Screen / sections ────────────────────────────────────────────────────
  screenTitle: 'Perfil',
  screenSubtitle: 'Conta, dados e preferências',
  personalInfoTitle: 'Informações pessoais',
  personalInfoSubtitle: 'Dados cadastrados na sua conta',
  menuTitle: 'Configurações',
  featureUnavailable: 'Função disponível em breve.',
  profileUpdateUnavailable: 'Atualização de dados indisponível no momento.',
  languageCurrentPtBr: 'Português (BR)',
  revealSensitive: 'Mostrar dado',
  hideSensitive: 'Ocultar dado',
  loadingData: 'Carregando dados...',
  noInfo: 'Não informado',
  /** Fallback quando nome e e-mail ainda não estão disponíveis */
  defaultProfileDisplayName: 'Passageiro',
  /** Tipo de conta quando a API não envia `type` (conta de passageiro) */
  defaultPassengerLabel: 'Passageiro',
  /** Tipo de conta quando a API não envia `type` mas o perfil é motorista */
  defaultDriverLabel: 'Motorista',
  ratingCardTitle: 'Sua avaliação',

  // ── Rating ───────────────────────────────────────────────────────────────
  ratingEmpty: '(Sem avaliações ainda)',
  ratingCount: '({{count}} {{label}})',
  ratingSingle: 'avaliação',
  ratingPlural: 'avaliações',
  ridesCount: '{{count}} corridas',
  ratingWithRides: '★ {{rating}} · {{count}} corridas',
  ratingReviewsParen: '({{count}})',

  // ── Personal info fields ─────────────────────────────────────────────────
  name: 'Nome',
  email: 'E-mail',
  cpf: 'CPF',
  phone: 'Telefone',
  birthDate: 'Data de nascimento',
  accountType: 'Tipo de conta',
  cnhNumber: 'Número da CNH',
  cnhCategory: 'Categoria da CNH',
  cnhExpirationDate: 'Validade da CNH',
  driverStatus: 'Status',

  // ── Edit mode ────────────────────────────────────────────────────────────
  editButton: 'Editar',
  saveButton: 'Salvar',
  cancelButton: 'Cancelar',

  // ── Privacy / masking ────────────────────────────────────────────────────
  verifyEmail: 'Verificar e-mail',

  // ── Photo ────────────────────────────────────────────────────────────────
  uploadPhotoTitle: 'Atualizar foto',
  chooseImageTitle: 'Selecionar imagem',
  chooseImageDescription: 'Escolha uma opção:',
  gallery: 'Galeria',
  camera: 'Câmera',
  openSettings: 'Abrir configurações',
  permissionTitle: 'Permissão necessária',
  mediaPermissionDescription: 'Precisamos de permissão para acessar suas fotos.',
  cameraPermissionDescription: 'Precisamos de permissão para acessar sua câmera.',
  notificationsPermissionDescription: 'Precisamos de permissão para enviar notificações.',

  // ── CNH upload ───────────────────────────────────────────────────────────
  uploadCnh: 'Enviar CNH',
  updateCnh: 'Atualizar CNH',
  uploadSuccessTitle: 'Sucesso',
  uploadCnhSuccessDescription: 'CNH enviada com sucesso! Aguarde a análise.',

  // ── Settings groups ──────────────────────────────────────────────────────
  groupMyAccount: 'Minha conta',
  groupActivity: 'Atividade',
  groupPreferences: 'Preferências',
  groupSupport: 'Suporte',

  // ── Settings items ───────────────────────────────────────────────────────
  paymentMethods: 'Métodos de pagamento',
  changePassword: 'Alterar senha',
  savedAddresses: 'Endereços salvos',
  coupons: 'Cupons e descontos',
  history: 'Histórico de corridas',
  ratings: 'Avaliações',
  notifications: 'Notificações',
  language: 'Idioma',
  darkMode: 'Modo escuro',
  notificationsOffTitle: 'Notificações',
  notificationsOffBody: 'Para desativar, ajuste nas configurações do sistema.',
  helpCenter: 'Central de ajuda',
  contactUs: 'Fale conosco',
  termsPrivacy: 'Termos e privacidade',

  // ── Danger zone ──────────────────────────────────────────────────────────
  logoutButton: 'Sair da conta',
  deleteAccount: 'Excluir conta',

  // ── Logout dialog ────────────────────────────────────────────────────────
  logoutTitle: 'Sair da conta?',
  logoutDescription: 'Você precisará fazer login novamente.',
  logoutConfirm: 'Sair',
  cancel: 'Cancelar',

  // ── Delete account dialog ────────────────────────────────────────────────
  deleteAccountTitle: 'Excluir conta?',
  deleteAccountDescription: 'Esta ação é irreversível. Todos os seus dados serão removidos.',
  deleteAccountConfirm: 'Excluir',

  // ── Errors ───────────────────────────────────────────────────────────────
  genericErrorTitle: 'Erro',
  genericErrorDescription: 'Não foi possível concluir a ação. Tente novamente.',
  imageSelectionError: 'Não foi possível acessar as imagens. Tente novamente.',
  cameraError: 'Não foi possível acessar a câmera. Tente novamente.',

  // ── Permissions ──────────────────────────────────────────────────────────
  permissionDeniedTitle: 'Permissão negada',
  permissionDeniedDescription: 'Ative a permissão de localização nas configurações.',

  // ── Account type map ─────────────────────────────────────────────────────
  userType: {
    admin: 'Administrador',
    funcionario: 'Funcionário',
    motorista: 'Motorista',
    passageiro: 'Passageiro',
    driver: 'Motorista',
    passenger: 'Passageiro',
  } satisfies Record<string, string>,

  // ── Driver status map ────────────────────────────────────────────────────
  driverStatusMap: {
    ONBOARDING: 'Cadastro em andamento',
    AWAITING_CNH: 'Aguardando CNH',
    CNH_REVIEW: 'CNH em análise',
    AWAITING_VEHICLE: 'Aguardando veículo',
    VEHICLE_REVIEW: 'Veículo em análise',
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    SUSPENDED: 'Suspenso',
  } satisfies Record<DriverStatus, string>,
} as const;

type ProfileMessageKey = Exclude<
  keyof typeof profileMessages,
  'userType' | 'driverStatusMap'
>;

/** Type-safe i18n accessor for the Profile domain. */
export function tp(key: ProfileMessageKey, params?: Record<string, string>): string {
  const base = String(profileMessages[key]);
  if (!params) return base;
  return Object.entries(params).reduce(
    (value, [placeholder, replacement]) => value.replace(`{{${placeholder}}}`, replacement),
    base,
  );
}

export function tProfileUserType(type: string): string {
  const map: Record<string, string> = profileMessages.userType;
  return map[type] ?? type;
}

export function tProfileDriverStatus(status: DriverStatus): string {
  return profileMessages.driverStatusMap[status];
}
