'use client';

import { useEffect, useState } from 'react';
import { getAvailableDeliveryDates } from '@/lib/utils/delivery';

export function useDeliveryAvailability() {
  const [availableDates, setAvailableDates] = useState<string[] | null>(null);

  useEffect(() => {
    let mounted = true;

    fetch('/api/availabilities', {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error('Availability request failed');
        if (mounted) setAvailableDates(getAvailableDeliveryDates(payload));
      })
      .catch((error) => {
        if (!mounted) return;
        console.error('Failed to load delivery availability:', error);
        setAvailableDates([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return availableDates;
}
