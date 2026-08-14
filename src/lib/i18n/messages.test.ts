import { describe, expect, it } from 'vitest';
import { MESSAGES_V4 } from './messages';

describe('checkout translations', () => {
  it('provides the optional address label in both locales', () => {
    expect(MESSAGES_V4.en.checkout.optional).toBe('Optional');
    expect(MESSAGES_V4.nl.checkout.optional).toBe('Optioneel');
  });
});
