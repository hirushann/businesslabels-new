import { useState, useEffect } from 'react';

export interface ShippingRule {
  id: number;
  country_code: string;
  country_name: string;
  shipping_cost: number;
  free_shipping_threshold: number;
  is_active: boolean;
}

export function useShippingRules() {
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/shipping-rules/active')
      .then(r => r.json())
      .then(res => {
        if (mounted && res?.data) {
          setShippingRules(res.data);
        }
      })
      .catch(e => {
        console.error('Failed to fetch shipping rules', e);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const defaultRule = shippingRules.find(r => r.country_code === 'NL') ?? shippingRules[0];

  return { shippingRules, defaultRule, loading };
}
