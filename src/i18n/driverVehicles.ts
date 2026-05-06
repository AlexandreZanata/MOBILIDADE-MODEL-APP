const driverVehiclesMessages = {
  screenTitle: 'Meus Veiculos',
  screenSubtitle: 'Gerencie seus veiculos cadastrados',
  emptyTitle: 'Nenhum veiculo cadastrado',
  emptySubtitle: 'Cadastre seu primeiro veiculo para comecar a receber corridas',
  addVehicle: 'Cadastrar Veiculo',
  newVehicleTitle: 'Novo Veiculo',
  vehicleDataSection: 'Dados do Veiculo',
  categorySection: 'Categoria',
  licensePlateLabel: 'Placa do Veiculo',
  licensePlatePlaceholder: 'ABC-1234',
  brandLabel: 'Marca',
  brandPlaceholder: 'Selecione a marca',
  modelLabel: 'Modelo',
  modelPlaceholder: 'Selecione o modelo',
  modelBrandRequiredPlaceholder: 'Selecione uma marca primeiro',
  yearLabel: 'Ano',
  yearPlaceholder: '2020',
  colorLabel: 'Cor',
  colorPlaceholder: 'Branco',
  serviceCategoryLabel: 'Categoria de Servico',
  categoriesLoading: 'Carregando categorias...',
  noBrandFound: 'Nenhuma marca encontrada',
  loadingBrands: 'Buscando marcas...',
  noModelFound: 'Nenhum modelo encontrado',
  loadingModels: 'Buscando modelos...',
  uploadDocument: 'Enviar Documento',
  uploadDocumentDescription: 'Selecione como deseja enviar o CRLV do veiculo:',
  gallery: 'Galeria',
  camera: 'Camera',
  cancel: 'Cancelar',
  openSettings: 'Abrir Configuracoes',
  permissionRequired: 'Permissao necessaria',
  mediaPermissionDescription: 'Precisamos de permissao para acessar suas fotos.',
  cameraPermissionDescription: 'Precisamos de permissao para acessar sua camera.',
  errorTitle: 'Erro',
  successTitle: 'Sucesso',
  vehicleCreated: 'Veiculo cadastrado com sucesso!',
  vehicleCreateError: 'Nao foi possivel cadastrar o veiculo.',
  genericRetryError: 'Nao foi possivel concluir a acao. Tente novamente.',
  loadCategoriesError: 'Nao foi possivel carregar as categorias de servico.',
  uploadSuccess: 'CRLV enviado com sucesso! Aguarde a analise.',
  uploadError: 'Nao foi possivel enviar o CRLV. Tente novamente.',
  documentsBadge: 'DOCUMENTOS',
  uploadCrlv: 'Enviar CRLV',
  plateLabel: 'Placa:',
  yearInfoLabel: 'Ano:',
  colorInfoLabel: 'Cor:',
  brandRequired: 'Selecione uma marca',
  modelRequired: 'Selecione um modelo',
  plateRequired: 'Placa e obrigatoria',
  plateInvalid: 'Placa invalida (formato: ABC-1234 ou ABC1D23)',
  yearRequired: 'Ano e obrigatorio',
  yearInvalid: 'Ano invalido',
  colorRequired: 'Cor e obrigatoria',
  serviceCategoryRequired: 'Categoria de servico e obrigatoria',
  statusPendingDocs: 'Aguardando Documentos',
  statusAwaitingVehicle: 'Aguardando Documento do Veiculo',
  statusPending: 'Em Analise',
  statusApproved: 'Aprovado',
  statusRejected: 'Rejeitado',
} as const;

type DriverVehiclesMessageKey = keyof typeof driverVehiclesMessages;

export function tdv(key: DriverVehiclesMessageKey, params?: Record<string, string>): string {
  const base = String(driverVehiclesMessages[key]);
  if (!params) return base;

  let value = base;
  Object.entries(params).forEach(([placeholder, replacement]) => {
    value = value.replace(`{{${placeholder}}}`, replacement);
  });
  return value;
}
