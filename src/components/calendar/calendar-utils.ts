import {
  addDays,
  addMonths,
  addYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type { CalendarEvent } from "@/lib/agenda.functions";

export type CalendarViewMode = "day" | "week" | "month" | "year";

export const VIEW_LABELS: { value: CalendarViewMode; label: string }[] = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "year", label: "Année" },
];

/** Plage chargée depuis Google pour la vue courante (grille complète incluse). */
export function viewBounds(view: CalendarViewMode, cursor: Date) {
  switch (view) {
    case "day":
      return { from: startOfDay(cursor), to: addDays(startOfDay(cursor), 1) };
    case "week":
      return {
        from: startOfWeek(cursor, { weekStartsOn: 1 }),
        to: addDays(endOfWeek(cursor, { weekStartsOn: 1 }), 1),
      };
    case "month":
      return {
        from: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
        to: addDays(endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }), 1),
      };
    case "year":
      return { from: startOfYear(cursor), to: addDays(endOfYear(cursor), 1) };
  }
}

export function shiftCursor(view: CalendarViewMode, cursor: Date, direction: -1 | 1) {
  switch (view) {
    case "day":
      return addDays(cursor, direction);
    case "week":
      return addDays(cursor, 7 * direction);
    case "month":
      return addMonths(cursor, direction);
    case "year":
      return addYears(cursor, direction);
  }
}

export function eventKey(ev: CalendarEvent) {
  return `${ev.accountKey}::${ev.calendarId}`;
}

export function eventsOnDay(events: CalendarEvent[], day: Date) {
  return events
    .filter((ev) => {
      const start = parseISO(ev.start);
      if (isSameDay(start, day)) return true;
      if (!ev.end) return false;
      const end = parseISO(ev.end);
      // Évènements multi-jours : la fin est exclusive pour les journées entières.
      return start < startOfDay(addDays(day, 1)) && end > startOfDay(day);
    })
    .sort((a, b) => {
      if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
      return a.start.localeCompare(b.start);
    });
}

/** Position verticale (en heures décimales) d'un évènement dans la journée. */
export function eventSpan(ev: CalendarEvent, day: Date) {
  const start = parseISO(ev.start);
  const end = ev.end ? parseISO(ev.end) : addDays(start, 0);
  const dayStart = startOfDay(day);
  const top = Math.max(0, (start.getTime() - dayStart.getTime()) / 3600000);
  const rawEnd = end.getTime() > start.getTime() ? end : new Date(start.getTime() + 3600000);
  const bottom = Math.min(24, (rawEnd.getTime() - dayStart.getTime()) / 3600000);
  return { top, height: Math.max(0.5, bottom - top) };
}

export const HOURS = Array.from({ length: 24 }, (_, i) => i);

/** Vrai si l'évènement couvre la journée entière ou déborde sur plusieurs jours. */
export function isDayBand(ev: CalendarEvent, day: Date) {
  if (ev.allDay) return true;
  if (!ev.end) return false;
  const start = parseISO(ev.start);
  const end = parseISO(ev.end);
  const dayStart = startOfDay(day);
  const nextDay = startOfDay(addDays(day, 1));
  // Multi-jours : commence avant ce jour ou finit après.
  return start < dayStart || end > nextDay;
}

/** Fenêtre d'heures utiles pour les vues Jour/Semaine (pas de scroll inutile). */
export function usefulHourRange(events: CalendarEvent[], days: Date[]) {
  let min = 8;
  let max = 20;
  for (const day of days) {
    for (const ev of eventsOnDay(events, day)) {
      if (isDayBand(ev, day)) continue;
      const { top, height } = eventSpan(ev, day);
      min = Math.min(min, Math.floor(top));
      max = Math.max(max, Math.ceil(top + height));
    }
  }
  min = Math.max(0, min);
  max = Math.min(24, Math.max(max, min + 6));
  return { min, max };
}
