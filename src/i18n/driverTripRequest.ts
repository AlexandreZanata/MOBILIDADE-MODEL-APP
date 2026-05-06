const driverTripRequestMessages = {
  title: 'Nova Corrida',
  subtitle: 'Responda à oferta para continuar',
  routeTitle: 'Percurso',
  originLabel: 'Origem',
  destinationLabel: 'Destino',
  detailsTitle: 'Detalhes',
  estimatedFareLabel: 'Valor estimado',
  rejectButton: 'Recusar',
  acceptButton: 'Aceitar Corrida',
  defaultPassengerName: 'Passageiro',
} as const;

type DriverTripRequestKey = keyof typeof driverTripRequestMessages;

export function tdtr(key: DriverTripRequestKey): string {
  return String(driverTripRequestMessages[key]);
}
