'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export function OpeningStatus() {
  const t = useTranslations('openingStatus');
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    const checkStatus = () => {
      // Get current date/time in Amsterdam time
      const now = new Date();
      const options = { timeZone: 'Europe/Amsterdam' };
      
      const dayFormat = new Intl.DateTimeFormat('en-US', { ...options, weekday: 'long' });
      const hourFormat = new Intl.DateTimeFormat('en-US', { ...options, hour: 'numeric', hour12: false });
      const minFormat = new Intl.DateTimeFormat('en-US', { ...options, minute: 'numeric' });
      
      const currentDayName = dayFormat.format(now); // e.g. "Monday"
      const currentHour = parseInt(hourFormat.format(now), 10);
      const currentMinute = parseInt(minFormat.format(now), 10);
      
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayIndex = days.indexOf(currentDayName); // 0 = Monday, 6 = Sunday
      
      const currentMinutesSinceMidnight = currentHour * 60 + currentMinute;
      const openMinutes = 8 * 60 + 30; // 08:30
      const closeMinutes = 17 * 60; // 17:00
      
      // Determine if currently open
      let isOpen = false;
      if (dayIndex >= 0 && dayIndex <= 4) { // Mon-Fri
        if (currentMinutesSinceMidnight >= openMinutes && currentMinutesSinceMidnight < closeMinutes) {
          isOpen = true;
        }
      }

      if (isOpen) {
        setStatusText(t('openedNow'));
      } else {
        let nextOpenDayIndex = dayIndex;
        let isToday = false;
        let isTomorrow = false;
        
        if (dayIndex >= 0 && dayIndex <= 4 && currentMinutesSinceMidnight < openMinutes) {
          // It's a weekday, before opening time -> opens today
          nextOpenDayIndex = dayIndex;
          isToday = true;
        } else {
          // We're closed for the rest of the day, find next day
          nextOpenDayIndex = (dayIndex + 1) % 7;
          
          if (nextOpenDayIndex === 5 || nextOpenDayIndex === 6) {
            // If next day is Saturday or Sunday, skip to Monday
            nextOpenDayIndex = 0;
            isTomorrow = (dayIndex === 6); // If it's Sunday, Monday is tomorrow
          } else {
            isTomorrow = true;
          }
        }
        
        let dayName = '';
        if (isToday) {
          dayName = t('today');
        } else if (isTomorrow) {
          dayName = t('tomorrow');
        } else {
          const nextDayKey = days[nextOpenDayIndex].toLowerCase();
          dayName = t(nextDayKey);
        }
        
        setStatusText(t('closedOpenAt', { day: dayName, time: '08:30' }));
      }
    };

    checkStatus();
    // Recheck every minute to keep it updated
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, [t]);

  // Prevent hydration mismatch by returning a placeholder or empty during SSR
  if (!statusText) {
    return <span className="opacity-0">Loading...</span>;
  }

  return (
    <span className="text-sm text-slate-400 font-medium">
      {statusText}
    </span>
  );
}
