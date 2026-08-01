import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  listEvents,
  listSources,
  removeEvent,
  upsertEvent,
  type CalendarEvent,
  type CalendarSource,
  type EventInput,
} from "./agenda.server";

export type { CalendarEvent, CalendarSource };

export const listCalendars = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<CalendarSource[]> => listSources());

export const getCalendarEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { timeMin: string; timeMax: string; calendarIds?: string[] }) => {
    if (!input?.timeMin || !input?.timeMax) throw new Error("Plage de dates invalide");
    return input;
  })
  .handler(async ({ data }): Promise<CalendarEvent[]> => listEvents(data));

export const saveCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: EventInput) => {
    if (!input?.title?.trim()) throw new Error("Le titre est requis");
    if (!input.calendarId || !input.accountKey) throw new Error("Agenda cible manquant");
    return input;
  })
  .handler(async ({ data }) => upsertEvent(data));

export const deleteCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { accountKey: string; calendarId: string; eventId: string }) => {
    if (!input?.eventId) throw new Error("Évènement introuvable");
    return input;
  })
  .handler(async ({ data }) => removeEvent(data));
