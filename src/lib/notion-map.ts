import { PROJECT_STATUSES } from "./project-status";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Étiquette de statut Notion -> identifiant de statut projet interne. */
export function mapProjectStatus(label: string): string {
  const n = norm(label);
  if (!n) return "pas_commence";
  const exact = PROJECT_STATUSES.find((s) => norm(s.label) === n || s.id === n.replace(/ /g, "_"));
  if (exact) return exact.id;
  const table: Array<[RegExp, string]> = [
    [/^(pas commence|non commence|not started|todo|a faire|backlog|idee)/, "pas_commence"],
    [/(ecriture|writing|script)/, "ecriture"],
    [/(en cours|in progress|doing|active)/, "en_cours"],
    [/(tournage|shooting|shoot)/, "tournage"],
    [/(montage|edit)/, "montage"],
    [/(validation|review|relecture)/, "validation"],
    [/(publier|publish|live|diffusion)/, "publier"],
    [/(termine|fini|done|complete|acheve)/, "termine"],
    [/(archiv)/, "archiver"],
  ];
  for (const [re, id] of table) if (re.test(n)) return id;
  return "pas_commence";
}

/** Étiquette Notion -> statut de tâche interne (`a_faire` | `en_cours` | `termine`). */
export function mapTaskStatus(label: string, checked: boolean | null): string {
  if (checked === true) return "termine";
  const n = norm(label);
  if (/(termine|fini|done|complete)/.test(n)) return "termine";
  if (/(en cours|in progress|doing)/.test(n)) return "en_cours";
  return "a_faire";
}

/** Étiquette Notion -> priorité interne (`basse` | `moyenne` | `haute`). */
export function mapPriority(label: string): string {
  const n = norm(label);
  if (/(haute|high|urgent|p1|elevee|critique)/.test(n)) return "haute";
  if (/(basse|low|p3|faible)/.test(n)) return "basse";
  return "moyenne";
}
