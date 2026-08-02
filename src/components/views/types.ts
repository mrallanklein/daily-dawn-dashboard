export const PROPERTY_TYPES = [
  { type: "text", label: "Texte", group: "Texte et contenu" },
  { type: "title", label: "Titre", group: "Texte et contenu" },
  { type: "number", label: "Nombre", group: "Texte et contenu" },
  { type: "select", label: "Sélection", group: "Sélection et statut" },
  { type: "multi_select", label: "Sélection multiple", group: "Sélection et statut" },
  { type: "status", label: "État", group: "Sélection et statut" },
  { type: "checkbox", label: "Case à cocher", group: "Sélection et statut" },
  { type: "person", label: "Personne", group: "Personnes et dates" },
  { type: "date", label: "Date", group: "Personnes et dates" },
  { type: "created_time", label: "Date de création", group: "Personnes et dates" },
  { type: "created_by", label: "Créé par", group: "Personnes et dates" },
  { type: "last_edited_time", label: "Dernière modification", group: "Personnes et dates" },
  { type: "last_edited_by", label: "Modifié par", group: "Personnes et dates" },
  { type: "files", label: "Fichiers et médias", group: "Avancé et relationnel" },
  { type: "url", label: "URL", group: "Avancé et relationnel" },
  { type: "email", label: "Email", group: "Avancé et relationnel" },
  { type: "phone", label: "Téléphone", group: "Avancé et relationnel" },
  { type: "relation", label: "Relation", group: "Avancé et relationnel" },
  { type: "rollup", label: "Rollup", group: "Avancé et relationnel" },
  { type: "formula", label: "Formule", group: "Avancé et relationnel" },
  { type: "id", label: "Identifiant", group: "Avancé et relationnel" },
  { type: "button", label: "Bouton", group: "Avancé et relationnel" },
  { type: "place", label: "Lieu", group: "Avancé et relationnel" },
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number]["type"];

/** Palette d'options douce, calquée sur Notion. */
export const OPTION_COLORS = [
  { id: "gray", label: "Gris", bg: "oklch(0.92 0 0)", fg: "oklch(0.35 0 0)" },
  { id: "brown", label: "Marron", bg: "oklch(0.9 0.03 60)", fg: "oklch(0.4 0.06 60)" },
  { id: "orange", label: "Orange", bg: "oklch(0.92 0.06 65)", fg: "oklch(0.45 0.12 55)" },
  { id: "yellow", label: "Jaune", bg: "oklch(0.94 0.07 95)", fg: "oklch(0.45 0.1 85)" },
  { id: "green", label: "Vert", bg: "oklch(0.92 0.06 150)", fg: "oklch(0.4 0.1 150)" },
  { id: "blue", label: "Bleu", bg: "oklch(0.92 0.05 240)", fg: "oklch(0.42 0.11 250)" },
  { id: "purple", label: "Violet", bg: "oklch(0.92 0.05 300)", fg: "oklch(0.42 0.11 300)" },
  { id: "pink", label: "Rose", bg: "oklch(0.93 0.05 350)", fg: "oklch(0.44 0.11 350)" },
  { id: "red", label: "Rouge", bg: "oklch(0.92 0.06 20)", fg: "oklch(0.45 0.14 25)" },
] as const;

export type OptionColor = (typeof OPTION_COLORS)[number]["id"];

export type SelectOption = { id: string; label: string; color: OptionColor };

export type NumberFormat = "plain" | "eur" | "usd" | "gbp" | "percent";

/** Sous-mode d'une propriété date : jour seul, période, ou date + heure. */
export type DateMode = "date" | "range" | "datetime";

export type PropertyDef = {
  id: string;
  name: string;
  type: PropertyType;
  hidden?: boolean;
  /** Propriété native du module (non supprimable) ou personnalisée. */
  custom?: boolean;
  options?: SelectOption[];
  format?: NumberFormat;
  dateMode?: DateMode;
  formula?: string;
  relationModule?: string;
  rollup?: { property: string; fn: "sum" | "count" | "min" | "max" };
};

export type Row = { id: string; values: Record<string, unknown> };

export type FilterOperator =
  | "contains"
  | "not_contains"
  | "is"
  | "is_not"
  | "starts_with"
  | "ends_with"
  | "empty"
  | "not_empty"
  | "eq"
  | "neq"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "before"
  | "after"
  | "today"
  | "this_week"
  | "this_month"
  | "checked"
  | "unchecked";

export type FilterRule = {
  id: string;
  propertyId: string;
  op: FilterOperator;
  value?: string;
};

export type SortRule = { id: string; propertyId: string; dir: "asc" | "desc" };

export type ColorRule = {
  id: string;
  propertyId: string;
  op: FilterOperator;
  value?: string;
  color: OptionColor;
};

export type Layout = "table" | "kanban" | "calendar" | "timeline" | "gallery" | "list";

export const LAYOUTS: { id: Layout; label: string }[] = [
  { id: "table", label: "Table" },
  { id: "kanban", label: "Kanban" },
  { id: "calendar", label: "Calendrier" },
  { id: "timeline", label: "Chronologie" },
  { id: "gallery", label: "Galerie" },
  { id: "list", label: "Liste" },
];

export type Density = "compact" | "comfortable" | "spacious";

export type ViewConfig = {
  filters: FilterRule[];
  filterJoin: "and" | "or";
  sorts: SortRule[];
  colors: ColorRule[];
  hiddenProps: string[];
  density: Density;
  /** 0 = sans limite */
  pageSize: number;
  groupBy?: string;
};

export const DEFAULT_CONFIG: ViewConfig = {
  filters: [],
  filterJoin: "and",
  sorts: [],
  colors: [],
  hiddenProps: [],
  density: "comfortable",
  pageSize: 25,
};

export type ModuleView = {
  id: string;
  module: string;
  name: string;
  emoji: string;
  layout: Layout;
  position: number;
  hidden: boolean;
  share_token: string | null;
  config: ViewConfig;
};

/** Description d'une base exploitable par le moteur de vues. */
export type DataSource = {
  module: string;
  label: string;
  properties: PropertyDef[];
  rows: Row[];
  titleProp: string;
  statusProp?: string;
  dateProp?: string;
  endDateProp?: string;
  coverProp?: string;
  isLoading?: boolean;
  onCreate?: () => void;
  onOpen?: (rowId: string) => void;
  onPatch?: (rowId: string, patch: Record<string, unknown>) => void;
};
