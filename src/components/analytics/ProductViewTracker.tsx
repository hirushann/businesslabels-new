"use client";

import { useEffect, useRef } from "react";
import { trackViewItem, type GA4Item } from "@/lib/analytics/dataLayer";

type ProductViewTrackerProps = {
  item: GA4Item;
};

export default function ProductViewTracker({ item }: ProductViewTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!trackedRef.current && (item.item_id || item.item_name)) {
      trackedRef.current = true;
      trackViewItem({ item });
    }
  }, [item]);

  return null;
}
