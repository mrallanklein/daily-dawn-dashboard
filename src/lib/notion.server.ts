/**
 * Accès Notion via la passerelle connecteur Lovable.
 * Serveur uniquement : lit LOVABLE_API_KEY / NOTION_API_KEY.
 */
const GATEWAY = "https://connector-gateway.lovable.dev/notion";

type Json = Record<string, unknown>;

function keys() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const notion = process.env["NOTION_API_KEY"];
  if (!lovable) throw new Error("LOVABLE_API_KEY manquant");
  if (!notion) throw new Error("Connexion Notion absente (NOTION_API_KEY)");
  return { lovable, notion };
}

async function notionFetch(path: string, init?: RequestInit): Promise<Json> {
  const { lovable, notion } = keys();
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${lovable}`,
      "X-Connection-Api-Key": notion,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Notion gateway ${path} [${res.status}]: ${text}`);
    throw new Error(`Notion a répondu ${res.status} : ${text.slice(0, 300)}`);
  }
  return text ? (JSON.parse(text) as Json) : {};
}

export type NotionDatabase = {
  id: string;
  title: string;
  /** Identifiant à interroger (data source sur les versions récentes de l'API). */
  queryId: string;
  properties: string[];
  url: string | null;
};

function plain(rich: unknown): string {
  if (!Array.isArray(rich)) return "";
  return rich.map((r) => String((r as Json)["plain_text"] ?? "")).join("");
}

/** Bases de données Notion partagées avec l'intégration. */
export async function listDatabases(): Promise<NotionDatabase[]> {
  const found = new Map<string, NotionDatabase>();
  for (const value of ["data_source", "database"]) {
    let cursor: string | undefined;
    do {
      let body: Json;
      try {
        body = await notionFetch("/v1/search", {
          method: "POST",
          body: JSON.stringify({
            filter: { property: "object", value },
            page_size: 100,
            ...(cursor ? { start_cursor: cursor } : {}),
          }),
        });
      } catch {
        break; // cette version de l'API ne connaît pas ce type d'objet
      }
      const results = (body["results"] as Json[]) ?? [];
      for (const r of results) {
        const props = (r["properties"] as Json) ?? {};
        const parentDb = ((r["parent"] as Json)?.["database_id"] as string) ?? null;
        const id = (parentDb && value === "data_source" ? parentDb : (r["id"] as string)) ?? "";
        if (!id) continue;
        found.set(id, {
          id,
          queryId: r["id"] as string,
          title: plain(r["title"]) || "Sans titre",
          properties: Object.keys(props),
          url: (r["url"] as string) ?? null,
        });
      }
      cursor = (body["has_more"] as boolean) ? ((body["next_cursor"] as string) ?? undefined) : undefined;
    } while (cursor);
  }
  return [...found.values()].sort((a, b) => a.title.localeCompare(b.title));
}

async function resolveQueryId(databaseId: string): Promise<string> {
  const db = await notionFetch(`/v1/databases/${databaseId}`);
  const sources = (db["data_sources"] as Json[]) ?? [];
  return (sources[0]?.["id"] as string) ?? databaseId;
}

/** Toutes les pages d'une base, pagination suivie jusqu'au bout. */
export async function queryDatabasePages(databaseId: string): Promise<Json[]> {
  const paths = [`/v1/databases/${databaseId}/query`];
  const pages: Json[] = [];
  let cursor: string | undefined;
  let path = paths[0]!;
  let resolved = false;
  for (;;) {
    let body: Json;
    try {
      body = await notionFetch(path, {
        method: "POST",
        body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
      });
    } catch (err) {
      if (resolved) throw err;
      resolved = true;
      path = `/v1/data_sources/${await resolveQueryId(databaseId)}/query`;
      continue;
    }
    resolved = true;
    pages.push(...(((body["results"] as Json[]) ?? []) as Json[]));
    if (!body["has_more"]) break;
    cursor = (body["next_cursor"] as string) ?? undefined;
    if (!cursor) break;
  }
  return pages;
}

/* ------------------------------------------------------------------ */
/* Lecture des propriétés                                              */
/* ------------------------------------------------------------------ */

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export type PropValue = {
  type: string;
  text: string;
  number: number | null;
  date: string | null;
  dateEnd: string | null;
  checkbox: boolean | null;
  relations: string[];
};

function readProp(prop: Json): PropValue {
  const type = String(prop["type"] ?? "");
  const value: PropValue = {
    type,
    text: "",
    number: null,
    date: null,
    dateEnd: null,
    checkbox: null,
    relations: [],
  };
  switch (type) {
    case "title":
    case "rich_text":
      value.text = plain(prop[type]);
      break;
    case "select":
    case "status": {
      const sel = prop[type] as Json | null;
      value.text = String(sel?.["name"] ?? "");
      break;
    }
    case "multi_select":
      value.text = (((prop["multi_select"] as Json[]) ?? []).map((s) => String(s["name"]))).join(", ");
      break;
    case "number":
      value.number = prop["number"] === null ? null : Number(prop["number"]);
      break;
    case "checkbox":
      value.checkbox = Boolean(prop["checkbox"]);
      break;
    case "date": {
      const d = prop["date"] as Json | null;
      value.date = (d?.["start"] as string)?.slice(0, 10) ?? null;
      value.dateEnd = (d?.["end"] as string)?.slice(0, 10) ?? null;
      break;
    }
    case "people":
      value.text = (((prop["people"] as Json[]) ?? []).map((p) => String(p["name"] ?? ""))).join(", ");
      break;
    case "relation":
      value.relations = ((prop["relation"] as Json[]) ?? []).map((r) => String(r["id"]));
      break;
    case "url":
    case "email":
    case "phone_number":
      value.text = String(prop[type] ?? "");
      break;
    case "formula": {
      const f = prop["formula"] as Json;
      value.text = String(f?.["string"] ?? "");
      if (f?.["number"] != null) value.number = Number(f["number"]);
      if (f?.["boolean"] != null) value.checkbox = Boolean(f["boolean"]);
      if (f?.["date"]) value.date = String((f["date"] as Json)["start"]).slice(0, 10);
      break;
    }
    default:
      break;
  }
  return value;
}

export type NotionRow = {
  id: string;
  url: string | null;
  cover: string | null;
  title: string;
  props: Record<string, PropValue>;
};

export function toRow(page: Json): NotionRow {
  const properties = (page["properties"] as Record<string, Json>) ?? {};
  const props: Record<string, PropValue> = {};
  let title = "";
  for (const [name, raw] of Object.entries(properties)) {
    const value = readProp(raw);
    props[norm(name)] = value;
    if (value.type === "title") title = value.text;
  }
  const cover = page["cover"] as Json | null;
  return {
    id: String(page["id"]),
    url: (page["url"] as string) ?? null,
    cover:
      (cover?.["type"] === "external"
        ? ((cover["external"] as Json)["url"] as string)
        : ((cover?.["file"] as Json)?.["url"] as string)) ?? null,
    title: title || "Sans titre",
    props,
  };
}

/** Première propriété dont le nom correspond à l'un des alias, éventuellement filtrée par type. */
export function pick(row: NotionRow, aliases: string[], types?: string[]): PropValue | null {
  for (const alias of aliases) {
    const value = row.props[norm(alias)];
    if (value && (!types || types.includes(value.type))) return value;
  }
  return null;
}

/** Première propriété d'un type donné (repli quand aucun alias ne correspond). */
export function firstOfType(row: NotionRow, types: string[]): PropValue | null {
  for (const value of Object.values(row.props)) if (types.includes(value.type)) return value;
  return null;
}

export { norm as normalizeKey };
