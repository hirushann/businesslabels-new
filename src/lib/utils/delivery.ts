type DeliveryMessageParams = {
  stock: number;
  delivery_dates_in_stock: number;
  delivery_dates_no_stock: number;
  now?: Date;
  pickupTime?: string;
};

type DeliveryMessageResult = {
  message: string; // Keep for backward compatibility
  countdown: {
    hours: number;
    minutes: number;
    formattedMinutes: string; // Zero-padded: "00", "05", "30"
  };
  deliveryLabel: string; // "tomorrow" or "7th May"
  deliveryDate: Date;
};

function parsePickupTime(timeString: string): { hours: number; minutes: number } {
  const [hoursStr, minutesStr] = timeString.split(':');
  return {
    hours: parseInt(hoursStr, 10),
    minutes: parseInt(minutesStr, 10),
  };
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function formatDeliveryDate(date: Date, currentDate: Date): string {
  // Check if it's tomorrow
  const tomorrow = new Date(currentDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  ) {
    return 'tomorrow';
  }
  
  // Format as "7th May"
  const day = date.getDate();
  const monthName = date.toLocaleString('en-GB', { month: 'long' });
  return `${day}${getOrdinalSuffix(day)} ${monthName}`;
}

export function getExpectedDeliveryMessage({
  stock,
  delivery_dates_in_stock,
  delivery_dates_no_stock,
  now = new Date(),
  pickupTime = process.env.NEXT_PUBLIC_DELIVERY_PICKUP_TIME || process.env.DELIVERY_PICKUP_TIME || '13:00',
}: DeliveryMessageParams): DeliveryMessageResult {
  // Determine which delivery days to use
  const deliveryDays = stock > 0 ? delivery_dates_in_stock : delivery_dates_no_stock;
  
  // Parse pickup time
  const { hours: pickupHour, minutes: pickupMinute } = parsePickupTime(pickupTime);
  
  // Create cutoff time for today
  const todayCutoff = new Date(now);
  todayCutoff.setHours(pickupHour, pickupMinute, 0, 0);
  
  // Check if we've passed today's cutoff
  const passedCutoff = now >= todayCutoff;
  
  // Calculate countdown target
  let countdownTarget: Date;
  let extraDays = 0;
  
  if (passedCutoff) {
    // Use tomorrow's cutoff
    countdownTarget = new Date(todayCutoff);
    countdownTarget.setDate(countdownTarget.getDate() + 1);
    extraDays = 1; // Add extra day to delivery
  } else {
    // Use today's cutoff
    countdownTarget = todayCutoff;
  }
  
  // Calculate time remaining
  const timeRemaining = countdownTarget.getTime() - now.getTime();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  // Calculate delivery date
  const deliveryDate = new Date(now);
  deliveryDate.setDate(deliveryDate.getDate() + deliveryDays + extraDays);
  deliveryDate.setHours(0, 0, 0, 0); // Reset time to midnight for date comparison
  
  // Format the delivery date
  const deliveryDateLabel = formatDeliveryDate(deliveryDate, now);
  
  // Format minutes with zero padding
  const minutesStr = minutesRemaining.toString().padStart(2, '0');
  
  // Build the message
  const message = `Order within ${hoursRemaining} hours ${minutesStr} minutes for delivery ${deliveryDateLabel}`;
  
  return {
    message,
    countdown: {
      hours: hoursRemaining,
      minutes: minutesRemaining,
      formattedMinutes: minutesStr,
    },
    deliveryLabel: deliveryDateLabel,
    deliveryDate,
  };
}
