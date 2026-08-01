import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string | null;
  allDay: boolean;
  location: string | null;
  calendar: string | null;
  htmlLink: string | null;
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

export const getCalendarEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { timeMin: string; timeMax: string }) => {
    if (!input?.timeMin || !input?.timeMax) throw new Error("Plage de dates invalide");
    return input;
  })
  .handler(async ({ data }): Promise<CalendarEvent[]> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const connectionKey = process.env["GOOGLE_CALENDAR_API_KEY"];
    if (!lovableKey || !connectionKey) {
      throw new Error("Google Calendar n'est pas connecté");
    }
    const headers = {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
    };

    const params = new URLSearchParams({
      timeMin: data.timeMin,
      timeMax: data.timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    });
    const res = await fetch(`${GATEWAY}/calendars/primary/events?${params.toString()}`, {
      headers,
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Google Calendar error [${res.status}]: ${body}`);
      throw new Error(`Google Calendar a répondu ${res.status}: ${body}`);
    }
    const json = (await res.json()) as {
      summary?: string;
      items?: Array<{
        id: string;
        summary?: string;
        location?: string;
        htmlLink?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
      }>;
    };

    return (json.items ?? [])
      .map((item) => {
        const start = item.start?.dateTime ?? item.start?.date ?? null;
        if (!start) return null;
        return {
          id: item.id,
          title: item.summary ?? "(Sans titre)",
          start,
          end: item.end?.dateTime ?? item.end?.date ?? null,
          allDay: !item.start?.dateTime,
          location: item.location ?? null,
          calendar: json.summary ?? null,
          htmlLink: item.htmlLink ?? null,
        } satisfies CalendarEvent;
      })
      .filter((e): e is CalendarEvent => e !== null);
  });