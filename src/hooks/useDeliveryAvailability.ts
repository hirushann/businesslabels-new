'use client';

import { useEffect, useState } from 'react';
import { getAvailableDeliveryDates } from '@/lib/utils/delivery';

export function useDeliveryAvailability() {
  const [availableDates, setAvailableDates] = useState<string[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/availabilities', {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error('Availability request failed');
        setAvailableDates(getAvailableDeliveryDates(payload));
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Failed to load delivery availability:', error);
        setAvailableDates([]);
      });

    return () => controller.abort();
  }, []);

  return availableDates;
}
