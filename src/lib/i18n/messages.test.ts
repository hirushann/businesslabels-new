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
    expect(MESSAGES_V4.en.brands.metadataTitle).toBe('Label Printer Brands | BusinessLabels.nl');
    expect(MESSAGES_V4.nl.brands.metadataTitle).toBe('Labelprinter merken bekijken | Businesslabels');
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
    }

    expect(MESSAGES_V4.en.favoritesPage.metadataTitle).toBeDefined();
    expect(MESSAGES_V4.nl.favoritesPage.metadataTitle).toBeDefined();
    expect(MESSAGES_V4.en.favoritesPage.metadataDescription).toBeDefined();
    expect(MESSAGES_V4.nl.favoritesPage.metadataDescription).toBeDefined();

    expect(MESSAGES_V4.en.pages.epsonCwc4000MetadataTitle).not.toBe(MESSAGES_V4.nl.pages.epsonCwc4000MetadataTitle);
  });

  it('keeps important page meta titles between 30 and 60 characters for SEO', () => {
    const pagesToCheck = [
      'homeMetadataTitle',
      'supportSamplesMetadataTitle',
      'epsonColorworksMetadataTitle',
      'epsonCwc4000MetadataTitle',
    ] as const;

    for (const key of pagesToCheck) {
      const enTitle = MESSAGES_V4.en.pages[key] as string;
      const nlTitle = MESSAGES_V4.nl.pages[key] as string;

      expect(enTitle.length).toBeGreaterThanOrEqual(30);
      expect(enTitle.length).toBeLessThanOrEqual(60);

      expect(nlTitle.length).toBeGreaterThanOrEqual(30);
      expect(nlTitle.length).toBeLessThanOrEqual(60);
    }

    const enFaqTitle = MESSAGES_V4.en.faqPage.metadataTitle;
    const nlFaqTitle = MESSAGES_V4.nl.faqPage.metadataTitle;
    expect(enFaqTitle.length).toBeGreaterThanOrEqual(30);
    expect(enFaqTitle.length).toBeLessThanOrEqual(60);
    expect(nlFaqTitle.length).toBeGreaterThanOrEqual(30);
    expect(nlFaqTitle.length).toBeLessThanOrEqual(60);
  });
});

