export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  start: string;
  end: string | null;
  allDay: boolean;
  location: string | null;
  calendarId: string;
  calendarName: string | null;
  accountKey: string;
  accountEmail: string | null;
  color: string | null;
  htmlLink: string | null;
  organizer: string | null;
  /** Réponse du propriétaire de l'agenda : needsAction | accepted | declined | tentative */
  myResponse: string | null;
};

export type CalendarSource = {
  accountKey: string;
  accountEmail: string | null;
  calendarId: string;
  name: string;
  color: string | null;
  primary: boolean;
  writable: boolean;
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

/** Une clé de connexion par compte Google Agenda relié. */
function connectionKeys(): { accountKey: string; key: string }[] {
  const entries: { accountKey: string; key: string }[] = [];
  const base = process.env["GOOGLE_CALENDAR_API_KEY"];
  if (base) entries.push({ accountKey: "primary", key: base });
  for (const suffix of ["1", "2"]) {
    const extra = process.env[`GOOGLE_CALENDAR_API_KEY_${suffix}`];
    if (extra) entries.push({ accountKey: `account_${suffix}`, key: extra });
  }
  return entries;
}

function headersFor(key: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (!lovableKey) throw new Error("Passerelle indisponible");
  return { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": key };
}

function keyFor(accountKey: string) {
  const found = connectionKeys().find((e) => e.accountKey === accountKey);
  if (!found) throw new Error("Compte Google Agenda introuvable");
  return found.key;
}

async function gget<T>(key: string, path: string): Promise<T> {
  const res = await fetch(`${GATEWAY}${path}`, { headers: headersFor(key) });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Google Calendar GET ${path} [${res.status}]: ${body}`);
    throw new Error(`Google Agenda a répondu ${res.status}`);
  }
  return (await res.json()) as T;
}

type ApiCalendar = {
  id: string;
  summary?: string;
  summaryOverride?: string;
  backgroundColor?: string;
  primary?: boolean;
  accessRole?: string;
  selected?: boolean;
};

export async function listSources(): Promise<CalendarSource[]> {
  const accounts = connectionKeys();
  if (accounts.length === 0) throw new Error("Google Agenda n'est pas connecté");

  const perAccount = await Promise.all(
    accounts.map(async ({ accountKey, key }) => {
      const json = await gget<{ items?: ApiCalendar[] }>(key, "/users/me/calendarList");
      const items = json.items ?? [];
      const primaryEmail = items.find((c) => c.primary)?.id ?? null;
      return items.map((c): CalendarSource => ({
        accountKey,
        accountEmail: primaryEmail,
        calendarId: c.id,
        name: c.summaryOverride ?? c.summary ?? c.id,
        color: c.backgroundColor ?? null,
        primary: Boolean(c.primary),
        writable: c.accessRole === "owner" || c.accessRole === "writer",
      }));
    }),
  );
  return perAccount.flat();
}

export async function listEvents(input: {
  timeMin: string;
  timeMax: string;
  calendarIds?: string[] | undefined;
}): Promise<CalendarEvent[]> {
  const sources = await listSources();
  const wanted = input.calendarIds?.length
    ? sources.filter((s) => input.calendarIds!.includes(`${s.accountKey}::${s.calendarId}`))
    : sources;

  const params = new URLSearchParams({
    timeMin: input.timeMin,
    timeMax: input.timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "500",
  });

  const groups = await Promise.all(
    wanted.map(async (source) => {
      try {
        const json = await gget<{
          items?: Array<{
            id: string;
            summary?: string;
            description?: string;
            location?: string;
            htmlLink?: string;
            organizer?: { email?: string; displayName?: string };
            attendees?: Array<{ email?: string; self?: boolean; responseStatus?: string }>;
            start?: { dateTime?: string; date?: string };
            end?: { dateTime?: string; date?: string };
            iCalUID?: string;
            recurringEventId?: string;
            status?: string;
          }>;
        }>(
          keyFor(source.accountKey),
          `/calendars/${encodeURIComponent(source.calendarId)}/events?${params.toString()}`,
        );
        const mapped = (json.items ?? []).map((item) => {
          const start = item.start?.dateTime ?? item.start?.date ?? null;
          if (!start) return null;
          if (item.status === "cancelled") return null;
          const me = (item.attendees ?? []).find((a) => a.self);
          const event: CalendarEvent = {
            id: item.id,
            title: item.summary ?? "(Sans titre)",
            description: item.description ?? null,
            start,
            end: item.end?.dateTime ?? item.end?.date ?? null,
            allDay: !item.start?.dateTime,
            location: item.location ?? null,
            calendarId: source.calendarId,
            calendarName: source.name,
            accountKey: source.accountKey,
            accountEmail: source.accountEmail,
            color: source.color,
            htmlLink: item.htmlLink ?? null,
            organizer:
              item.organizer?.displayName ?? item.organizer?.email ?? source.accountEmail ?? null,
            myResponse: me?.responseStatus ?? null,
          };
          return { event, dedupe: `${item.iCalUID ?? item.id}|${start}` };
        });
        return mapped.filter((e): e is { event: CalendarEvent; dedupe: string } => e !== null);
      } catch (error) {
        console.error(`Agenda ${source.calendarId} indisponible: ${String(error)}`);
        return [];
      }
    }),
  );

  // Un même évènement peut apparaître dans plusieurs agendas (invitations
  // croisées entre les deux comptes) : on ne le garde qu'une fois.
  const seen = new Set<string>();
  const unique: CalendarEvent[] = [];
  for (const entry of groups.flat()) {
    if (seen.has(entry.dedupe)) continue;
    seen.add(entry.dedupe);
    unique.push(entry.event);
  }
  return unique.sort((a, b) => (a.start < b.start ? -1 : 1));
}

export type EventInput = {
  accountKey: string;
  calendarId: string;
  eventId?: string | undefined;
  title: string;
  description?: string | undefined;
  location?: string | undefined;
  allDay: boolean;
  /** yyyy-MM-dd pour allDay, ISO complet sinon */
  start: string;
  end: string;
};

function toApiBody(input: EventInput) {
  return {
    summary: input.title,
    description: input.description ?? undefined,
    location: input.location ?? undefined,
    start: input.allDay ? { date: input.start } : { dateTime: input.start },
    end: input.allDay ? { date: input.end } : { dateTime: input.end },
  };
}

export async function upsertEvent(input: EventInput) {
  const key = keyFor(input.accountKey);
  const base = `${GATEWAY}/calendars/${encodeURIComponent(input.calendarId)}/events`;
  const url = input.eventId ? `${base}/${encodeURIComponent(input.eventId)}` : base;
  const res = await fetch(url, {
    method: input.eventId ? "PATCH" : "POST",
    headers: { ...headersFor(key), "Content-Type": "application/json" },
    body: JSON.stringify(toApiBody(input)),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Google Calendar write failed [${res.status}]: ${body}`);
    throw new Error(`Enregistrement impossible (${res.status})`);
  }
  return { ok: true };
}

export async function removeEvent(input: {
  accountKey: string;
  calendarId: string;
  eventId: string;
}) {
  const key = keyFor(input.accountKey);
  const res = await fetch(
    `${GATEWAY}/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`,
    { method: "DELETE", headers: headersFor(key) },
  );
  if (!res.ok && res.status !== 410) {
    const body = await res.text();
    console.error(`Google Calendar delete failed [${res.status}]: ${body}`);
    throw new Error(`Suppression impossible (${res.status})`);
  }
  return { ok: true };
}

/** Accepter / refuser une invitation reçue sur l'un des agendas reliés. */
export async function respondEvent(input: {
  accountKey: string;
  calendarId: string;
  eventId: string;
  response: "accepted" | "declined" | "tentative";
}) {
  const key = keyFor(input.accountKey);
  const url = `${GATEWAY}/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`;
  const current = await gget<{
    attendees?: Array<{ email?: string; self?: boolean; responseStatus?: string }>;
  }>(
    key,
    `/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`,
  );
  const attendees = (current.attendees ?? []).map((a) =>
    a.self ? { ...a, responseStatus: input.response } : a,
  );
  if (attendees.length === 0) throw new Error("Cet évènement n'a pas d'invités");
  const res = await fetch(`${url}?sendUpdates=all`, {
    method: "PATCH",
    headers: { ...headersFor(key), "Content-Type": "application/json" },
    body: JSON.stringify({ attendees }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Google Calendar RSVP failed [${res.status}]: ${body}`);
    throw new Error(`Réponse impossible (${res.status})`);
  }
  return { ok: true };
}
