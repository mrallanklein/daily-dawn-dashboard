export const PROJECT_STATUSES = [
  { id: "pas_commence", label: "Pas commencé", tone: "text-muted-foreground" },
  { id: "ecriture", label: "Écriture", tone: "text-gold" },
  { id: "en_cours", label: "En cours", tone: "text-gold" },
  { id: "tournage", label: "Tournage", tone: "text-destructive" },
  { id: "montage", label: "Montage", tone: "text-gold" },
  { id: "validation", label: "Validation", tone: "text-gold" },
  { id: "publier", label: "Publier", tone: "text-gold" },
  { id: "termine", label: "Terminé", tone: "text-muted-foreground" },
  { id: "archiver", label: "Archiver", tone: "text-muted-foreground" },
] as const;

export type ProjectStatusId = (typeof PROJECT_STATUSES)[number]["id"];

export function statusLabel(status: string): string {
  return PROJECT_STATUSES.find((s) => s.id === status)?.label ?? status;
}

export function statusTone(status: string): string {
  return PROJECT_STATUSES.find((s) => s.id === status)?.tone ?? "text-muted-foreground";
}

/** Le nom des projets Notion est préfixé par sa famille : "Film - Long Métrage 1939". */
export function projectFamily(name: string, category: string | null): string {
  if (category) return category;
  const [prefix, rest] = name.split(" - ");
  return rest && prefix ? prefix.trim() : "Sans famille";
}