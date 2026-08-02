import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Project, Task } from "@/lib/data";

export type RiskLevel = "none" | "watch" | "late";

export type ProjectRisk = {
  level: RiskLevel;
  /** Jours restants avant l'échéance (négatif si dépassée). */
  daysLeft: number | null;
  overdue: boolean;
  /** Tâches du projet dont l'échéance est dépassée : elles bloquent l'avancement. */
  blockingTasks: number;
  /** Le projet dont celui-ci dépend n'est pas terminé. */
  blockedByProject: string | null;
  budgetOverrun: boolean;
  /** Avancement inférieur au temps écoulé entre début et échéance. */
  behindSchedule: boolean;
  reasons: string[];
};

const DONE = ["termine", "publier", "archiver"];

export function isDone(status: string) {
  return DONE.includes(status);
}

/** Part du calendrier déjà écoulée entre le début et l'échéance, en pourcentage. */
export function expectedProgress(project: Project, today: Date): number | null {
  if (!project.start_date || !project.deadline) return null;
  const start = parseISO(project.start_date);
  const end = parseISO(project.deadline);
  const total = differenceInCalendarDays(end, start);
  if (total <= 0) return 100;
  const done = differenceInCalendarDays(today, start);
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

/**
 * Règle métier des indicateurs de retard.
 * `late` dès qu'une échéance est dépassée, qu'une tâche bloque ou qu'un projet amont
 * n'est pas terminé. `watch` pour un budget dépassé, un avancement en retard sur le
 * calendrier ou une échéance dans les 3 jours.
 */
export function projectRisk(
  project: Project,
  tasks: Task[],
  options: { today?: Date; spent?: number; projects?: Project[] } = {},
): ProjectRisk {
  const today = options.today ?? new Date();
  const reasons: string[] = [];

  const daysLeft = project.deadline
    ? differenceInCalendarDays(parseISO(project.deadline), today)
    : null;
  const done = isDone(project.status);
  const overdue = !done && daysLeft !== null && daysLeft < 0;
  if (overdue) reasons.push(`Échéance dépassée de ${Math.abs(daysLeft!)} j`);

  const blockingTasks = done
    ? 0
    : tasks.filter(
        (t) =>
          t.project_id === project.id &&
          t.status !== "termine" &&
          t.due_date !== null &&
          differenceInCalendarDays(parseISO(t.due_date), today) < 0,
      ).length;
  if (blockingTasks > 0) reasons.push(`${blockingTasks} tâche(s) bloquante(s)`);

  const upstream = project.depends_on_id
    ? (options.projects ?? []).find((p) => p.id === project.depends_on_id)
    : undefined;
  const blockedByProject = upstream && !isDone(upstream.status) ? upstream.name : null;
  if (blockedByProject) reasons.push(`En attente de « ${blockedByProject} »`);

  const spent = options.spent ?? Number(project.budget_spent ?? 0);
  const budgetOverrun = Boolean(project.budget && project.budget > 0 && spent > project.budget);
  if (budgetOverrun) reasons.push("Budget dépassé");

  const expected = done ? null : expectedProgress(project, today);
  const behindSchedule = expected !== null && project.progress < expected - 15;
  if (behindSchedule) reasons.push(`Avancement ${project.progress}% pour ${expected}% attendus`);

  if (!done && daysLeft !== null && daysLeft >= 0 && daysLeft <= 3) {
    reasons.push(daysLeft === 0 ? "Échéance aujourd'hui" : `Échéance dans ${daysLeft} j`);
  }

  const level: RiskLevel =
    overdue || blockingTasks > 0 || blockedByProject
      ? "late"
      : budgetOverrun || behindSchedule || (daysLeft !== null && daysLeft >= 0 && daysLeft <= 3)
        ? "watch"
        : "none";

  return {
    level,
    daysLeft,
    overdue,
    blockingTasks,
    blockedByProject,
    budgetOverrun,
    behindSchedule,
    reasons,
  };
}

/** Dépenses réellement enregistrées pour un projet (transactions de type dépense). */
export function projectSpent(
  projectId: string,
  transactions: { project_id: string | null; kind: string; amount: number }[],
): number {
  return transactions
    .filter((t) => t.project_id === projectId && t.kind === "depense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
}
