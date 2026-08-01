export const PROJECT_STATUSES = [
  { id: "pas_commence", label: "Pas commencé", tone: "text-status-gray", dot: "bg-status-gray" },
  { id: "ecriture", label: "Écriture", tone: "text-status-gold", dot: "bg-status-gold" },
  { id: "en_cours", label: "En cours", tone: "text-status-gold", dot: "bg-status-gold" },
  { id: "tournage", label: "Tournage", tone: "text-status-red", dot: "bg-status-red" },
  { id: "montage", label: "Montage", tone: "text-status-purple", dot: "bg-status-purple" },
  { id: "validation", label: "Validation", tone: "text-status-blue", dot: "bg-status-blue" },
  { id: "publier", label: "Publier", tone: "text-status-green", dot: "bg-status-green" },
  { id: "termine", label: "Terminé", tone: "text-status-green", dot: "bg-status-green" },
  { id: "archiver", label: "Archiver", tone: "text-status-gray", dot: "bg-status-gray" },
] as const;

export type ProjectStatusId = (typeof PROJECT_STATUSES)[number]["id"];

export function statusLabel(status: string): string {
  return PROJECT_STATUSES.find((s) => s.id === status)?.label ?? status;
}

export function statusTone(status: string): string {
  return PROJECT_STATUSES.find((s) => s.id === status)?.tone ?? "text-muted-foreground";
}

export function statusDot(status: string): string {
  return PROJECT_STATUSES.find((s) => s.id === status)?.dot ?? "bg-status-gray";
}

/** Le nom des projets Notion est préfixé par sa famille : "Film - Long Métrage 1939". */
export function projectFamily(name: string, category: string | null): string {
  if (category) return category;
  const [prefix, rest] = name.split(" - ");
  return rest && prefix ? prefix.trim() : "Sans famille";
}
/** Couleur CSS du statut, utilisable en style inline (pastilles calendrier). */
export function statusColor(status: string): string {
  const dot = statusDot(status).replace("bg-", "");
  return `var(--${dot})`;
}
