import { maskCpfDisplay, maskPhoneDisplay } from '@/models/profile/maskSensitive';

describe('maskSensitive', () => {
  it('maskCpfDisplay masks CPF leaving last five digits visible', () => {
    expect(maskCpfDisplay('123.456.789-01')).toBe('•••.•••.789-01');
  });

  it('maskPhoneDisplay masks phone keeping DDD and last four digits', () => {
    expect(maskPhoneDisplay('(98) 99123-4567')).toBe('(98) •••••-4567');
  });
});
