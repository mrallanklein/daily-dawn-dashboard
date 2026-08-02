import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

export type RangeDays = 1 | 3 | 7 | 30;

export const RANGE_OPTIONS: { value: RangeDays; label: string }[] = [
  { value: 1, label: "Aujourd'hui" },
  { value: 3, label: "3 jours" },
  { value: 7, label: "7 jours" },
  { value: 30, label: "30 jours" },
];

export function rangeBounds(days: RangeDays) {
  const from = startOfDay(new Date());
  const to = addDays(from, days);
  return { from, to };
}

export function inRange(dateStr: string | null, days: RangeDays) {
  if (!dateStr) return false;
  const { from, to } = rangeBounds(days);
  const d = parseISO(dateStr);
  return d >= from && d < to;
}

export function fmtDay(dateStr: string) {
  const d = parseISO(dateStr);
  if (isSameDay(d, new Date())) return "Aujourd'hui";
  if (isSameDay(d, addDays(new Date(), 1))) return "Demain";
  return format(d, "EEEE d MMMM", { locale: fr });
}

export function fmtTime(iso: string) {
  return format(parseISO(iso), "HH:mm");
}

export function fmtShortDate(dateStr: string) {
  return format(parseISO(dateStr), "d MMM", { locale: fr });
}

export function daysUntil(dateStr: string) {
  const diff = startOfDay(parseISO(dateStr)).getTime() - startOfDay(new Date()).getTime();
  return Math.round(diff / 86400000);
}

export function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}
