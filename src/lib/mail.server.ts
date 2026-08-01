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

export const MAIL_ACCOUNT_KEYS = ["primary", "secondary"] as const;
export type MailAccountId = (typeof MAIL_ACCOUNT_KEYS)[number];
export type MailAccount = { id: MailAccountId; email: string };

const GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

export function connectionKeyFor(account: MailAccountId) {
  return account === "secondary"
    ? process.env["GOOGLE_MAIL_API_KEY_2"]
    : process.env["GOOGLE_MAIL_API_KEY"];
}

export function gatewayHeaders(account: MailAccountId = "primary") {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = connectionKeyFor(account);
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

async function accountEmail(account: MailAccountId): Promise<string | null> {
  const headers = gatewayHeaders(account);
  if (!headers) return null;
  const res = await fetch(`${GATEWAY}/users/me/profile`, { headers });
  if (!res.ok) {
    console.error(`Gmail profile failed [${res.status}]: ${await res.text()}`);
    return null;
  }
  const json = (await res.json()) as { emailAddress?: string };
  return json.emailAddress ?? null;
}

export async function fetchAccounts(): Promise<MailAccount[]> {
  const results = await Promise.all(
    MAIL_ACCOUNT_KEYS.map(async (id) => {
      if (!connectionKeyFor(id)) return null;
      const email = await accountEmail(id);
      return email ? ({ id, email } satisfies MailAccount) : null;
    }),
  );
  return results.filter((a): a is MailAccount => a !== null);
}

export async function fetchMessages(input: {
  query?: string;
  maxResults?: number;
  account?: MailAccountId;
}): Promise<MailMessage[]> {
  const headers = gatewayHeaders(input.account ?? "primary");
  if (!headers) throw new Error("Gmail n'est pas connecté");

  const params = new URLSearchParams({
    maxResults: String(Math.min(input.maxResults ?? 20, 50)),
    q: input.query?.trim() || "in:inbox",
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
}

export async function sendGmail(input: {
  to: string;
  subject: string;
  body: string;
  account?: MailAccountId;
}) {
  const headers = gatewayHeaders(input.account ?? "primary");
  if (!headers) throw new Error("Gmail n'est pas connecté");
  const raw = Buffer.from(
    [
      `To: ${input.to}`,
      `Subject: ${input.subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      input.body,
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
}
