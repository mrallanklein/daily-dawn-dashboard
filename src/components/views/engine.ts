import {
  OPTION_COLORS,
  type ColorRule,
  type FilterOperator,
  type FilterRule,
  type NumberFormat,
  type PropertyDef,
  type PropertyType,
  type Row,
  type SortRule,
  type ViewConfig,
} from "./types";

export function colorTokens(color: string) {
  return OPTION_COLORS.find((c) => c.id === color) ?? OPTION_COLORS[0];
}

export function operatorsFor(type: PropertyType): { op: FilterOperator; label: string }[] {
  if (["number", "rollup", "id"].includes(type))
    return [
      { op: "eq", label: "=" },
      { op: "neq", label: "≠" },
      { op: "gt", label: ">" },
      { op: "lt", label: "<" },
      { op: "gte", label: "≥" },
      { op: "lte", label: "≤" },
      { op: "empty", label: "Est vide" },
      { op: "not_empty", label: "N'est pas vide" },
    ];
  if (["date", "created_time", "last_edited_time"].includes(type))
    return [
      { op: "is", label: "Est" },
      { op: "before", label: "Avant" },
      { op: "after", label: "Après" },
      { op: "today", label: "Aujourd'hui" },
      { op: "this_week", label: "Cette semaine" },
      { op: "this_month", label: "Ce mois" },
      { op: "empty", label: "Est vide" },
      { op: "not_empty", label: "N'est pas vide" },
    ];
  if (["select", "status", "multi_select", "person", "relation"].includes(type))
    return [
      { op: "is", label: "Est" },
      { op: "is_not", label: "N'est pas" },
      { op: "empty", label: "Est vide" },
      { op: "not_empty", label: "N'est pas vide" },
    ];
  if (type === "checkbox")
    return [
      { op: "checked", label: "Est coché" },
      { op: "unchecked", label: "N'est pas coché" },
    ];
  return [
    { op: "contains", label: "Contient" },
    { op: "not_contains", label: "Ne contient pas" },
    { op: "is", label: "Est" },
    { op: "is_not", label: "N'est pas" },
    { op: "starts_with", label: "Commence par" },
    { op: "ends_with", label: "Se termine par" },
    { op: "empty", label: "Est vide" },
    { op: "not_empty", label: "N'est pas vide" },
  ];
}

function asText(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function startOfWeek(d: Date) {
  const day = (d.getDay() + 6) % 7;
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - day);
  return out;
}

export function matchRule(value: unknown, op: FilterOperator, target: string | undefined): boolean {
  const text = asText(value).toLowerCase();
  const needle = (target ?? "").toLowerCase();
  const empty = text.trim() === "";
  switch (op) {
    case "empty":
      return empty;
    case "not_empty":
      return !empty;
    case "contains":
      return text.includes(needle);
    case "not_contains":
      return !text.includes(needle);
    case "is":
      return Array.isArray(value)
        ? value.map((v) => String(v).toLowerCase()).includes(needle)
        : text === needle;
    case "is_not":
      return Array.isArray(value)
        ? !value.map((v) => String(v).toLowerCase()).includes(needle)
        : text !== needle;
    case "starts_with":
      return text.startsWith(needle);
    case "ends_with":
      return text.endsWith(needle);
    case "checked":
      return value === true;
    case "unchecked":
      return value !== true;
    case "eq":
    case "neq":
    case "gt":
    case "lt":
    case "gte":
    case "lte": {
      const a = Number(value);
      const b = Number(target);
      if (Number.isNaN(a) || Number.isNaN(b)) return false;
      if (op === "eq") return a === b;
      if (op === "neq") return a !== b;
      if (op === "gt") return a > b;
      if (op === "lt") return a < b;
      if (op === "gte") return a >= b;
      return a <= b;
    }
    case "before":
    case "after": {
      if (empty || !target) return false;
      const a = new Date(text).getTime();
      const b = new Date(target).getTime();
      return op === "before" ? a < b : a > b;
    }
    case "today":
    case "this_week":
    case "this_month": {
      if (empty) return false;
      const d = new Date(text);
      const now = new Date();
      if (op === "today") return d.toDateString() === now.toDateString();
      if (op === "this_month")
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      const from = startOfWeek(now);
      const to = new Date(from.getTime() + 7 * 86_400_000);
      return d >= from && d < to;
    }
    default:
      return true;
  }
}

export function applyFilters(rows: Row[], filters: FilterRule[], join: "and" | "or") {
  const active = filters.filter((f) => f.propertyId);
  if (active.length === 0) return rows;
  return rows.filter((row) => {
    const results = active.map((f) => matchRule(row.values[f.propertyId], f.op, f.value));
    return join === "and" ? results.every(Boolean) : results.some(Boolean);
  });
}

export function applySorts(rows: Row[], sorts: SortRule[], props: PropertyDef[]) {
  if (sorts.length === 0) return rows;
  const typeOf = (id: string) => props.find((p) => p.id === id)?.type;
  return [...rows].sort((a, b) => {
    for (const s of sorts) {
      const type = typeOf(s.propertyId);
      const av = a.values[s.propertyId];
      const bv = b.values[s.propertyId];
      let cmp = 0;
      if (["number", "rollup", "id"].includes(type ?? "")) {
        cmp = (Number(av) || 0) - (Number(bv) || 0);
      } else if (["date", "created_time", "last_edited_time"].includes(type ?? "")) {
        cmp = new Date(asText(av) || 0).getTime() - new Date(asText(bv) || 0).getTime();
      } else if (type === "checkbox") {
        cmp = Number(Boolean(av)) - Number(Boolean(bv));
      } else {
        cmp = asText(av).localeCompare(asText(bv), "fr", { sensitivity: "base" });
      }
      if (cmp !== 0) return s.dir === "asc" ? cmp : -cmp;
    }
    return 0;
  });
}

export function rowColor(row: Row, rules: ColorRule[]) {
  for (const rule of rules) {
    if (!rule.propertyId) continue;
    if (matchRule(row.values[rule.propertyId], rule.op, rule.value)) return rule.color;
  }
  return null;
}

export function searchRows(rows: Row[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    Object.values(row.values).some((v) => asText(v).toLowerCase().includes(q)),
  );
}

export function formatNumber(value: unknown, format: NumberFormat = "plain", locale = "fr-FR") {
  const n = Number(value);
  if (value == null || value === "" || Number.isNaN(n)) return "";
  if (format === "percent")
    return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(
      n / 100,
    );
  if (format === "plain") return new Intl.NumberFormat(locale).format(n);
  const currency = format === "eur" ? "EUR" : format === "usd" ? "USD" : "GBP";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(n);
}

/**
 * Évaluateur de formule minimal : opérations arithmétiques et comparaisons sur les
 * propriétés référencées entre accolades, par exemple `{budget} - {depense}`.
 */
export function evalFormula(expression: string, row: Row): string {
  if (!expression.trim()) return "";
  const replaced = expression.replace(/\{([^}]+)\}/g, (_m, key: string) => {
    const raw = row.values[key.trim()];
    const n = Number(raw);
    return Number.isNaN(n) ? JSON.stringify(String(raw ?? "")) : String(n);
  });
  if (!/^[-+*/()%.\d\s"'<>=!&|?:a-zA-Z_]*$/.test(replaced)) return "";
  try {
    const fn = new Function(`"use strict"; return (${replaced});`);
    const out = fn();
    return out == null ? "" : String(out);
  } catch {
    return "";
  }
}

export function displayValue(prop: PropertyDef, row: Row): string {
  const raw = row.values[prop.id];
  if (prop.type === "formula") return evalFormula(prop.formula ?? "", row);
  if (prop.type === "number" || prop.type === "rollup")
    return formatNumber(raw, prop.format ?? "plain");
  if (prop.type === "checkbox") return raw ? "Oui" : "Non";
  return asText(raw);
}

export function visibleProps(props: PropertyDef[], config: ViewConfig) {
  return props.filter((p) => !p.hidden && !config.hiddenProps.includes(p.id));
}

export const DENSITY_CLASS: Record<ViewConfig["density"], string> = {
  compact: "py-1 text-[0.8125rem]",
  comfortable: "py-2 text-[0.875rem]",
  spacious: "py-3.5 text-[0.9375rem]",
};
