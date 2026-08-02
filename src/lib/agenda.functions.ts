import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  eventInputSchema,
  eventRefSchema,
  eventResponseSchema,
  eventsRangeSchema,
} from "./agenda.schemas";
import {
  listEvents,
  listSources,
  removeEvent,
  respondEvent,
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
  .inputValidator(eventsRangeSchema)
  .handler(async ({ data }): Promise<CalendarEvent[]> => listEvents(data));

export const saveCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(eventInputSchema)
  .handler(async ({ data }) => upsertEvent(data));

export const deleteCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(eventRefSchema)
  .handler(async ({ data }) => removeEvent(data));

export const respondCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(eventResponseSchema)
  .handler(async ({ data }) => respondEvent(data));
