import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { listMessagesSchema, sendMessageSchema } from "./mail.schemas";
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
  .inputValidator(listMessagesSchema)
  .handler(async ({ data }): Promise<MailMessage[]> => fetchMessages(data));

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(sendMessageSchema)
  .handler(async ({ data }) => sendGmail(data));
