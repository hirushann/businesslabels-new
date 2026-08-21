import { describe, expect, it } from 'vitest';
import { MESSAGES_V4 } from './messages';

describe('checkout translations', () => {
  it('provides the optional address label in both locales', () => {
    expect(MESSAGES_V4.en.checkout.optional).toBe('Optional');
    expect(MESSAGES_V4.nl.checkout.optional).toBe('Optioneel');
  });

  it('provides brand metadata titles and descriptions in both locales', () => {
    expect(MESSAGES_V4.nl.pages.brandMetadataTitle).toBe('{brand} producten voor jouw labelprinter | BusinessLabels');
    expect(MESSAGES_V4.en.pages.brandMetadataTitle).toBe('{brand} products for your label printer | BusinessLabels');
    expect(MESSAGES_V4.nl.pages.brandDescription).toContain('labelprinter bij BusinessLabels');
    expect(MESSAGES_V4.en.pages.brandDescription).toContain('label printer at BusinessLabels');
  });

  it('provides distinct metadata for previously hardcoded/duplicate pages in both locales', () => {
    const keys = [
      'categoriesMetadataTitle',
      'categoriesMetadataDescription',
      'shopMetadataTitle',
      'shopMetadataDescription',
      'printSampleMetadataTitle',
      'printSampleMetadataDescription',
      'supportSamplesMetadataTitle',
      'supportSamplesMetadataDescription',
      'badgeMakenMetadataTitle',
      'badgeMakenMetadataDescription',
      'epsonColorworksMetadataTitle',
      'epsonColorworksMetadataDescription',
      'epsonCwc4000MetadataTitle',
      'epsonCwc4000MetadataDescription',
    ] as const;

    for (const key of keys) {
      expect(MESSAGES_V4.en.pages[key]).toBeDefined();
      expect(MESSAGES_V4.nl.pages[key]).toBeDefined();
      expect(typeof MESSAGES_V4.en.pages[key]).toBe('string');
      expect(typeof MESSAGES_V4.nl.pages[key]).toBe('string');
    }
  });
});

