import { DriverStatus } from '@/models/profile/types';

const profileMessages = {
  screenTitle: 'Perfil',
  personalInfoTitle: 'Informacoes pessoais',
  personalInfoSubtitle: 'Dados cadastrados na sua conta',
  menuTitle: 'Configuracoes',
  loadingData: 'Carregando dados...',
  noInfo: 'Nao informado',
  unknownUser: 'Usuario',
  ratingEmpty: '(Sem avaliacoes ainda)',
  ratingCount: '({{count}} {{label}})',
  ratingSingle: 'avaliacao',
  ratingPlural: 'avaliacoes',
  name: 'Nome',
  email: 'E-mail',
  cpf: 'CPF',
  phone: 'Telefone',
  birthDate: 'Data de nascimento',
  accountType: 'Tipo de conta',
  cnhNumber: 'Numero da CNH',
  cnhCategory: 'Categoria da CNH',
  cnhExpirationDate: 'Validade da CNH',
  driverStatus: 'Status',
  uploadCnh: 'Enviar CNH',
  updateCnh: 'Atualizar CNH',
  chooseImageTitle: 'Selecionar imagem',
  chooseImageDescription: 'Escolha uma opcao:',
  gallery: 'Galeria',
  camera: 'Camera',
  cancel: 'Cancelar',
  openSettings: 'Abrir configuracoes',
  permissionTitle: 'Permissao necessaria',
  mediaPermissionDescription: 'Precisamos de permissao para acessar suas fotos.',
  cameraPermissionDescription: 'Precisamos de permissao para acessar sua camera.',
  uploadSuccessTitle: 'Sucesso',
  uploadCnhSuccessDescription: 'CNH enviada com sucesso! Aguarde a analise.',
  logoutTitle: 'Sair',
  logoutDescription: 'Tem certeza que deseja sair da sua conta?',
  logoutConfirm: 'Sair',
  genericErrorTitle: 'Erro',
  genericErrorDescription: 'Nao foi possivel concluir a acao. Tente novamente.',
  imageSelectionError: 'Nao foi possivel acessar as imagens. Tente novamente.',
  cameraError: 'Nao foi possivel acessar a camera. Tente novamente.',
  uploadPhotoTitle: 'Atualizar foto',
  history: 'Historico',
  paymentMethods: 'Metodos de pagamento',
  savedAddresses: 'Enderecos salvos',
  coupons: 'Cupons e descontos',
  help: 'Ajuda',
  about: 'Sobre',
  userType: {
    admin: 'Administrador',
    funcionario: 'Funcionario',
    motorista: 'Motorista',
    passageiro: 'Passageiro',
    driver: 'Motorista',
    passenger: 'Passageiro',
  } satisfies Record<string, string>,
  driverStatusMap: {
    ONBOARDING: 'Cadastro em andamento',
    AWAITING_CNH: 'Aguardando CNH',
    CNH_REVIEW: 'CNH em analise',
    AWAITING_VEHICLE: 'Aguardando veiculo',
    VEHICLE_REVIEW: 'Veiculo em analise',
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    SUSPENDED: 'Suspenso',
  } satisfies Record<DriverStatus, string>,
} as const;

type ProfileMessageKey = Exclude<keyof typeof profileMessages, 'userType' | 'driverStatusMap'>;

export function tp(key: ProfileMessageKey, params?: Record<string, string>): string {
  const base = String(profileMessages[key]);
  if (!params) return base;
  return Object.entries(params).reduce(
    (value, [placeholder, replacement]) => value.replace(`{{${placeholder}}}`, replacement),
    base
  );
}

export function tProfileUserType(type: string): string {
  const map: Record<string, string> = profileMessages.userType;
  return map[type] ?? type;
}

export function tProfileDriverStatus(status: DriverStatus): string {
  return profileMessages.driverStatusMap[status];
}
