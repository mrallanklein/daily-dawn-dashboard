import { z } from "zod";

/** Schémas de validation partagés pour les fonctions serveur mail. */
export const mailAccountSchema = z.enum(["primary", "secondary"]);

export const listMessagesSchema = z.object({
  query: z.string().max(400).optional(),
  maxResults: z.number().int().min(1).max(100).optional(),
  account: mailAccountSchema.optional(),
});

export const sendMessageSchema = z.object({
  to: z.string().trim().min(3, "Destinataire requis"),
  subject: z.string().trim().min(1, "Objet requis"),
  body: z.string(),
  account: mailAccountSchema.optional(),
});
