import { z } from "zod";

/** Schémas de validation partagés entre le client et les fonctions serveur agenda. */
const isoDate = z.string().min(4, "Date invalide");

export const eventsRangeSchema = z.object({
  timeMin: isoDate,
  timeMax: isoDate,
  calendarIds: z.array(z.string().min(1)).optional(),
});

export const eventInputSchema = z.object({
  accountKey: z.string().min(1, "Compte manquant"),
  calendarId: z.string().min(1, "Agenda cible manquant"),
  eventId: z.string().min(1).optional(),
  title: z.string().trim().min(1, "Le titre est requis"),
  description: z.string().optional(),
  location: z.string().optional(),
  start: isoDate,
  end: isoDate,
  allDay: z.boolean(),
});

export const eventRefSchema = z.object({
  accountKey: z.string().min(1),
  calendarId: z.string().min(1),
  eventId: z.string().min(1, "Évènement introuvable"),
});

export const eventResponseSchema = eventRefSchema.extend({
  response: z.enum(["accepted", "declined", "tentative"]),
});
