import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  fetchAccounts,
  fetchMessages,
  gatewayHeaders,
  sendGmail,
  type MailAccount,
  type MailAccountId,
  type MailMessage,
} from "./mail.server";

export type { MailAccount, MailAccountId, MailMessage };

export const getMailStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({ connected: gatewayHeaders() !== null }));

export const listMailAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<MailAccount[]> => fetchAccounts());

export const listMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { query?: string; maxResults?: number; account?: MailAccountId }) => input ?? {},
  )
  .handler(async ({ data }): Promise<MailMessage[]> => fetchMessages(data));

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { to: string; subject: string; body: string; account?: MailAccountId }) => {
      if (!input?.to || !input.subject) throw new Error("Destinataire et objet requis");
      return input;
    },
  )
  .handler(async ({ data }) => sendGmail(data));
