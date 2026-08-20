import { describe, expect, it } from 'vitest';
import { calculateDisplayedCheckoutTotals, shouldPromptForInvalidVat } from './vat';

describe('checkout VAT display totals', () => {
  it('recalculates every taxable amount when the backend VAT decision changes', () => {
    expect(calculateDisplayedCheckoutTotals(90, 10, 2.5, 0.21)).toEqual({
      taxAmount: 21.525,
      finalTotal: 124.025,
    });
    expect(calculateDisplayedCheckoutTotals(90, 10, 2.5, 0)).toEqual({
      taxAmount: 0,
      finalTotal: 102.5,
    });
  });

  it('warns once for an invalid VAT number', () => {
    expect(shouldPromptForInvalidVat('invalid', false)).toBe(true);
    expect(shouldPromptForInvalidVat('invalid', true)).toBe(false);
    expect(shouldPromptForInvalidVat('valid', false)).toBe(false);
    expect(shouldPromptForInvalidVat('unavailable', false)).toBe(false);
  });
});
