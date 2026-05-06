const rideDetailsMessages = {
  title: 'Detalhes da Corrida',
  notFound: 'Corrida não encontrada',
  statusSection: 'Status',
  finishedStatus: 'Corrida Finalizada',
  canceledByDriverStatus: 'Cancelada pelo Motorista',
  canceledByPassengerStatus: 'Cancelada pelo Passageiro',
  canceledStatus: 'Cancelada',
  expiredStatus: 'Corrida Expirada',
  passengerLabel: 'Passageiro',
  driverLabel: 'Motorista',
  passengerMissing: 'Passageiro não informado',
  driverMissing: 'Motorista não informado',
  vehicleTitle: 'Veiculo',
  vehiclePlate: 'Placa',
  vehicleColor: 'Cor',
  vehicleBrand: 'Marca',
  vehicleModel: 'Modelo',
  rideInfoSection: 'Informacoes da Corrida',
  distanceLabel: 'Distancia',
  durationLabel: 'Duracao',
  minutesSingle: 'minuto',
  minutesPlural: 'minutos',
  multiplierLabel: 'Multiplicador',
  requestedAtLabel: 'Data da Solicitacao',
  noInfo: 'Nao informado',
  valueSection: 'Valor',
  finalPriceLabel: 'Preco Final',
  estimatedPriceLabel: 'Preco Estimado',
  defaultCurrency: 'R$ 0,00',
} as const;

type RideDetailsKey = keyof typeof rideDetailsMessages;

export function trd(key: RideDetailsKey): string {
  return String(rideDetailsMessages[key]);
}
