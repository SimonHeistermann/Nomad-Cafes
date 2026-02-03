// src/lib/utils/opening-hours.ts
import type { OpeningHoursEntry } from '@/types/cafe';

/**
 * Formats a time string (24h format) based on locale.
 *
 * @param time24h - Time in 24h format (e.g., "07:00", "19:30")
 * @param locale - Locale code ('en' or 'de')
 * @returns Formatted time string
 *
 * @example
 * formatTimeForLocale("07:00", "en") // "7:00 AM"
 * formatTimeForLocale("19:00", "en") // "7:00 PM"
 * formatTimeForLocale("07:00", "de") // "07:00"
 * formatTimeForLocale("19:00", "de") // "19:00"
 */
export function formatTimeForLocale(time24h: string, locale: string): string {
  // Parse 24h format
  const match = time24h.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return time24h; // Return original if parsing fails
  }

  const hour = parseInt(match[1], 10);
  const minute = match[2];

  // For German, return 24h format
  if (locale === 'de') {
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }

  // For English, convert to 12h format with AM/PM
  if (hour === 0) {
    return `12:${minute} AM`;
  } else if (hour < 12) {
    return `${hour}:${minute} AM`;
  } else if (hour === 12) {
    return `12:${minute} PM`;
  } else {
    return `${hour - 12}:${minute} PM`;
  }
}

export type OpenState = {
  isOpenNow: boolean;
  opensAt?: string; // z.B. "7:00 AM" (heute), Original-String
  hasOpeningHours: boolean;
};

/**
 * Parst Zeitangaben wie "7:00 AM" oder "19:30" zu "Minuten seit Mitternacht".
 */
function parseTimeStringToMinutes(timeStr: string): number | null {
  const trimmed = timeStr.trim().toUpperCase();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);

  if (!match) {
    return null;
  }

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const suffix = match[3]; // "AM" | "PM" | undefined

  if (suffix) {
    if (suffix === 'PM' && hour < 12) hour += 12;
    if (suffix === 'AM' && hour === 12) hour = 0; // 12 AM = 00:xx
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

/**
 * Liefert Wochentag + "Minuten seit Mitternacht" in der Zeitzone des Cafés.
 */
function getLocalTimeInfo(timeZone?: string): {
  weekday: string;
  minutesSinceMidnight: number;
} {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(new Date());

  const weekday =
    parts.find((p) => p.type === 'weekday')?.value ?? 'Monday';
  const hourStr =
    parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minuteStr =
    parts.find((p) => p.type === 'minute')?.value ?? '00';

  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  return {
    weekday,
    minutesSinceMidnight: hour * 60 + minute,
  };
}

/**
 * Berechnet anhand der aktuellen Uhrzeit (in der Café-Zeitzone),
 * ob ein Listing geöffnet ist.
 *
 * - nutzt `timeZone` (IANA) auf dem Café, wenn vorhanden
 * - akzeptiert Stunden im Format "7:00 AM", "10:30 PM" oder "19:00"
 */
export function getOpenStateForNow(
  entries: OpeningHoursEntry[] = [],
  fallbackIsOpen = false,
  timeZone?: string,
): OpenState {
  if (!entries || entries.length === 0) {
    return {
      isOpenNow: fallbackIsOpen,
      hasOpeningHours: false,
    };
  }

  const { weekday, minutesSinceMidnight } = getLocalTimeInfo(timeZone);

  // OpeningHoursEntry.day muss denselben String wie weekday haben (z.B. "Monday")
  const today = entries.find((e) => e.day === weekday);

  if (!today || today.isClosed) {
    return {
      isOpenNow: false,
      hasOpeningHours: true,
    };
  }

  const openMinutes = parseTimeStringToMinutes(today.open);
  const closeMinutes = parseTimeStringToMinutes(today.close);

  if (openMinutes == null || closeMinutes == null) {
    return {
      isOpenNow: fallbackIsOpen,
      hasOpeningHours: true,
    };
  }

  const isOpenNow =
    minutesSinceMidnight >= openMinutes &&
    minutesSinceMidnight <= closeMinutes;

  if (!isOpenNow) {
    return {
      isOpenNow: false,
      opensAt: today.open, // Original-String, z.B. "7:00 AM"
      hasOpeningHours: true,
    };
  }

  return {
    isOpenNow: true,
    hasOpeningHours: true,
  };
}