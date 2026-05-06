/**
 * @file waitingForDriverHelpers.test.ts
 * @description Unit tests for pure helper logic used in the WaitingForDriver feature.
 * Tests i18n keys, elapsed timer formatting, and fare formatting.
 */
import { twfd } from '@/i18n/waitingForDriver';

// ── i18n ─────────────────────────────────────────────────────────────────────

describe('twfd (i18n accessor)', () => {
  it('returns the correct PT-BR string for searchingTitle', () => {
    expect(twfd('searchingTitle')).toBe('Procurando motorista');
  });

  it('returns the correct PT-BR string for searchingSubtitle', () => {
    expect(twfd('searchingSubtitle')).toBe('Buscando o melhor motorista para você');
  });

  it('returns the correct PT-BR string for cancelDialogTitle', () => {
    expect(twfd('cancelDialogTitle')).toBe('Cancelar corrida?');
  });

  it('returns the correct PT-BR string for cancelDialogBody', () => {
    expect(twfd('cancelDialogBody')).toBe(
      'Cancelamentos frequentes podem afetar sua conta.',
    );
  });

  it('returns the correct PT-BR string for driverFoundChip', () => {
    expect(twfd('driverFoundChip')).toBe('Motorista encontrado!');
  });

  it('returns the correct PT-BR string for yesCancel', () => {
    expect(twfd('yesCancel')).toBe('Sim, cancelar');
  });

  it('returns the correct PT-BR string for goBack', () => {
    expect(twfd('goBack')).toBe('Voltar');
  });

  it('returns the correct PT-BR string for followMapCta', () => {
    expect(twfd('followMapCta')).toBe('Acompanhar no mapa');
  });

  it('returns the correct PT-BR string for chatButton', () => {
    expect(twfd('chatButton')).toBe('Chat de suporte');
  });

  it('returns the correct PT-BR string for cancelButton', () => {
    expect(twfd('cancelButton')).toBe('Cancelar corrida');
  });

  it('returns the correct PT-BR string for waitingTimeLabel', () => {
    expect(twfd('waitingTimeLabel')).toBe('tempo de espera');
  });
});

// ── Elapsed timer formatting ──────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(1, '0')}:${String(s).padStart(2, '0')}`;
}

describe('formatElapsed', () => {
  it('formats 0 seconds as 0:00', () => {
    expect(formatElapsed(0)).toBe('0:00');
  });

  it('formats 5 seconds as 0:05', () => {
    expect(formatElapsed(5)).toBe('0:05');
  });

  it('formats 59 seconds as 0:59', () => {
    expect(formatElapsed(59)).toBe('0:59');
  });

  it('formats 60 seconds as 1:00', () => {
    expect(formatElapsed(60)).toBe('1:00');
  });

  it('formats 90 seconds as 1:30', () => {
    expect(formatElapsed(90)).toBe('1:30');
  });

  it('formats 600 seconds as 10:00', () => {
    expect(formatElapsed(600)).toBe('10:00');
  });
});

// ── Fare formatting ───────────────────────────────────────────────────────────

function formatFare(fare: number | null): string {
  return fare != null ? `R$ ${fare.toFixed(2)}` : '-';
}

describe('formatFare', () => {
  it('formats a numeric fare correctly', () => {
    expect(formatFare(25.5)).toBe('R$ 25.50');
  });

  it('formats zero as R$ 0.00', () => {
    expect(formatFare(0)).toBe('R$ 0.00');
  });

  it('returns dash for null fare', () => {
    expect(formatFare(null)).toBe('-');
  });

  it('formats large fare correctly', () => {
    expect(formatFare(150.99)).toBe('R$ 150.99');
  });
});

// ── Vehicle display line ──────────────────────────────────────────────────────

function buildVehicleLine(
  vehicle?: { brand?: string; model?: string; plate?: string; color?: string },
): string {
  if (!vehicle) return '';
  const line = [vehicle.brand, vehicle.model, vehicle.color].filter(Boolean).join(' ');
  const plate = vehicle.plate ?? '';
  return [line, plate].filter(Boolean).join(' · ');
}

describe('buildVehicleLine', () => {
  it('builds full vehicle line', () => {
    expect(
      buildVehicleLine({ brand: 'Toyota', model: 'Corolla', color: 'Prata', plate: 'ABC-1234' }),
    ).toBe('Toyota Corolla Prata · ABC-1234');
  });

  it('handles missing color', () => {
    expect(buildVehicleLine({ brand: 'Honda', model: 'Civic', plate: 'XYZ-9999' })).toBe(
      'Honda Civic · XYZ-9999',
    );
  });

  it('returns empty string for undefined vehicle', () => {
    expect(buildVehicleLine(undefined)).toBe('');
  });

  it('handles vehicle with only plate', () => {
    expect(buildVehicleLine({ plate: 'DEF-5678' })).toBe('DEF-5678');
  });
});
