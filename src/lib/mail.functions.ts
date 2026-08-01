import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MailMessage = {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
  body: string;
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

function gatewayHeaders() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_MAIL_API_KEY"];
  if (!lovableKey || !connectionKey) return null;
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
  };
}

function decodeBase64Url(data: string) {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

type GmailPart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
};

function extractBody(part: GmailPart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) return decodeBase64Url(part.body.data);
  for (const child of part.parts ?? []) {
    const found = extractBody(child);
    if (found) return found;
  }
  if (part.body?.data) return decodeBase64Url(part.body.data);
  return "";
}

export const getMailStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({ connected: gatewayHeaders() !== null }));

export const listMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query?: string; maxResults?: number }) => input ?? {})
  .handler(async ({ data }): Promise<MailMessage[]> => {
    const headers = gatewayHeaders();
    if (!headers) throw new Error("Gmail n'est pas connecté");

    const params = new URLSearchParams({
      maxResults: String(Math.min(data.maxResults ?? 20, 50)),
      q: data.query?.trim() || "in:inbox",
    });
    const listRes = await fetch(`${GATEWAY}/users/me/messages?${params.toString()}`, { headers });
    if (!listRes.ok) {
      const body = await listRes.text();
      console.error(`Gmail list failed [${listRes.status}]: ${body}`);
      throw new Error(`Gmail a répondu ${listRes.status}: ${body}`);
    }
    const list = (await listRes.json()) as { messages?: Array<{ id: string }> };

    const details = await Promise.all(
      (list.messages ?? []).map(async (m) => {
        const res = await fetch(`${GATEWAY}/users/me/messages/${m.id}?format=full`, { headers });
        if (!res.ok) return null;
        const json = (await res.json()) as {
          id: string;
          threadId: string;
          snippet?: string;
          labelIds?: string[];
          internalDate?: string;
          payload?: GmailPart & { headers?: Array<{ name: string; value: string }> };
        };
        const header = (name: string) =>
          json.payload?.headers?.find((h) => h.name.toLowerCase() === name)?.value ?? "";
        return {
          id: json.id,
          threadId: json.threadId,
          from: header("from"),
          to: header("to"),
          subject: header("subject") || "(Sans objet)",
          snippet: json.snippet ?? "",
          date: json.internalDate
            ? new Date(Number(json.internalDate)).toISOString()
            : new Date().toISOString(),
          unread: (json.labelIds ?? []).includes("UNREAD"),
          body: extractBody(json.payload),
        } satisfies MailMessage;
      }),
    );

    return details.filter((m): m is MailMessage => m !== null);
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { to: string; subject: string; body: string }) => {
    if (!input?.to || !input.subject) throw new Error("Destinataire et objet requis");
    return input;
  })
  .handler(async ({ data }) => {
    const headers = gatewayHeaders();
    if (!headers) throw new Error("Gmail n'est pas connecté");
    const raw = Buffer.from(
      [
        `To: ${data.to}`,
        `Subject: ${data.subject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        "",
        data.body,
      ].join("\r\n"),
      "utf8",
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await fetch(`${GATEWAY}/users/me/messages/send`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Gmail send failed [${res.status}]: ${body}`);
      throw new Error(`Envoi impossible (${res.status}): ${body}`);
    }
    return { ok: true };
  });
