const serviceSelectionMessages = {
  confirmButton: 'Confirmar',
} as const;

type ServiceSelectionMessageKey = keyof typeof serviceSelectionMessages;

export function tss(key: ServiceSelectionMessageKey): string {
  return serviceSelectionMessages[key];
}
