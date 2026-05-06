/**
 * Masks CPF and phone for profile privacy (PT-BR display conventions).
 */

const CPF_MASK_PREFIX = '•••.•••.';

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Returns CPF masked as `•••.•••.XXX-XX` (last 5 digits visible per spec example).
 */
export function maskCpfDisplay(cpf: string): string {
  const digits = onlyDigits(cpf);
  if (digits.length < 5) return cpf.trim() || '';
  const tail = digits.slice(-5);
  const tri = tail.slice(0, 3);
  const duo = tail.slice(3, 5);
  return `${CPF_MASK_PREFIX}${tri}-${duo}`;
}

/**
 * Returns phone masked as `(DD) •••••-XXXX` when DDD present.
 */
export function maskPhoneDisplay(phone: string): string {
  const digits = onlyDigits(phone);
  if (digits.length < 4) return phone.trim() || '';
  const last4 = digits.slice(-4);
  if (digits.length >= 10) {
    const ddd = digits.slice(0, 2);
    return `(${ddd}) •••••-${last4}`;
  }
  return `•••••-${last4}`;
}
