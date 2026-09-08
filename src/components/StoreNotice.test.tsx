// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StoreNotice from './StoreNotice';

vi.mock('next-intl', () => ({
  useTranslations: () => ({
    rich: (key: string, values?: Record<string, (chunks: string) => React.ReactNode>) => {
      if (key === 'message') {
        const phone = values?.phone ? values.phone('Bel') : 'Bel';
        const email = values?.email ? values.email('mail') : 'mail';
        return (
          <span>
            Wegens serverproblemen functioneert de website momenteel niet zoals hoort. {phone} of {email} ons en wij helpen u graag met uw order.
          </span>
        );
      }
      return key;
    },
  }),
}));

describe('StoreNotice Component', () => {
  it('renders store notice with message and contact links', () => {
    render(<StoreNotice />);

    expect(
      screen.getByText(/Wegens serverproblemen functioneert de website momenteel niet zoals hoort/i)
    ).toBeDefined();

    const telLink = screen.getAllByRole('link', { name: /bel|\+31 318 590 465/i })[0];
    expect(telLink).toBeDefined();
    expect(telLink.getAttribute('href')).toBe('tel:+31318590465');

    const mailLink = screen.getAllByRole('link', { name: /mail|verkoop@businesslabels\.nl/i })[0];
    expect(mailLink).toBeDefined();
    expect(mailLink.getAttribute('href')).toBe('mailto:verkoop@businesslabels.nl');
  });
});
