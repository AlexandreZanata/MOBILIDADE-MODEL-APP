const driverMessages = {
  driverName: 'Joao Silva',
  ratingText: '5.0 (247 avaliacoes)',
  vehicleTitle: 'Detalhes do Veiculo',
  deliveryTitle: 'Entrega',
  vehicleModelLabel: 'Modelo',
  vehiclePlateLabel: 'Placa',
  vehicleColorLabel: 'Cor',
  deliveryLocationLabel: 'Local',
  deliveryTimeLabel: 'Tempo',
  deliveryPriceLabel: 'Valor',
  rejectButton: 'Recusar',
  acceptButton: 'Aceitar',
} as const;

type DriverMessageKey = keyof typeof driverMessages;

export function td(key: DriverMessageKey): string {
  return driverMessages[key];
}
