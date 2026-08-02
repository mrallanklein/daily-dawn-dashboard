import { describe, expect, it } from "vitest";
import { expectedProgress, isDone, projectRisk, projectSpent } from "@/lib/project-risk";
import type { Project, Task } from "@/lib/data";

const TODAY = new Date("2026-03-10T09:00:00Z");

function project(over: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "Projet test",
    description: null,
    status: "en_cours",
    priority: "moyenne",
    category: null,
    client: null,
    progress: 50,
    budget: null,
    budget_spent: 0,
    start_date: null,
    deadline: null,
    color: "#000",
    cover_url: null,
    next_step: null,
    position: 0,
    tags: [],
    contact_id: null,
    work_date: null,
    onedrive_url: null,
    local_folder: null,
    depends_on_id: null,
    ...over,
  } as Project;
}

function task(over: Partial<Task> = {}): Task {
  return {
    id: "t1",
    project_id: "p1",
    title: "Tâche",
    notes: null,
    description: null,
    status: "a_faire",
    priority: "moyenne",
    scheduled_date: null,
    due_date: null,
    start_time: null,
    duration_minutes: null,
    completed_at: null,
    parent_task_id: null,
    assignee_id: null,
    position: 0,
    ...over,
  } as Task;
}

describe("isDone", () => {
  it("reconnaît les statuts terminaux", () => {
    expect(isDone("termine")).toBe(true);
    expect(isDone("publier")).toBe(true);
    expect(isDone("en_cours")).toBe(false);
  });
});

describe("expectedProgress", () => {
  it("renvoie null sans dates", () => {
    expect(expectedProgress(project(), TODAY)).toBeNull();
  });

  it("calcule la part du calendrier écoulée", () => {
    const p = project({ start_date: "2026-03-01", deadline: "2026-03-11" });
    expect(expectedProgress(p, TODAY)).toBe(90);
  });

  it("borne entre 0 et 100", () => {
    const past = project({ start_date: "2026-01-01", deadline: "2026-01-10" });
    expect(expectedProgress(past, TODAY)).toBe(100);
    const future = project({ start_date: "2026-06-01", deadline: "2026-06-10" });
    expect(expectedProgress(future, TODAY)).toBe(0);
  });
});

describe("projectRisk", () => {
  it("ne signale rien pour un projet sain", () => {
    const risk = projectRisk(project({ deadline: "2026-06-01" }), [], { today: TODAY });
    expect(risk.level).toBe("none");
    expect(risk.reasons).toEqual([]);
  });

  it("marque en retard une échéance dépassée", () => {
    const risk = projectRisk(project({ deadline: "2026-03-05" }), [], { today: TODAY });
    expect(risk.level).toBe("late");
    expect(risk.overdue).toBe(true);
    expect(risk.daysLeft).toBe(-5);
  });

  it("ignore les retards des projets terminés", () => {
    const risk = projectRisk(project({ deadline: "2026-03-05", status: "termine" }), [], {
      today: TODAY,
    });
    expect(risk.level).toBe("none");
  });

  it("compte les tâches bloquantes du projet uniquement", () => {
    const tasks = [
      task({ id: "a", due_date: "2026-03-01" }),
      task({ id: "b", due_date: "2026-03-01", status: "termine" }),
      task({ id: "c", due_date: "2026-03-01", project_id: "autre" }),
      task({ id: "d", due_date: "2026-04-01" }),
    ];
    const risk = projectRisk(project(), tasks, { today: TODAY });
    expect(risk.blockingTasks).toBe(1);
    expect(risk.level).toBe("late");
  });

  it("signale un projet amont non terminé", () => {
    const upstream = project({ id: "p0", name: "Amont", status: "en_cours" });
    const risk = projectRisk(project({ depends_on_id: "p0" }), [], {
      today: TODAY,
      projects: [upstream],
    });
    expect(risk.blockedByProject).toBe("Amont");
    expect(risk.level).toBe("late");
  });

  it("ne bloque pas quand le projet amont est terminé", () => {
    const upstream = project({ id: "p0", name: "Amont", status: "termine" });
    const risk = projectRisk(project({ depends_on_id: "p0" }), [], {
      today: TODAY,
      projects: [upstream],
    });
    expect(risk.blockedByProject).toBeNull();
    expect(risk.level).toBe("none");
  });

  it("passe en surveillance sur dépassement de budget", () => {
    const risk = projectRisk(project({ budget: 1000 }), [], { today: TODAY, spent: 1200 });
    expect(risk.budgetOverrun).toBe(true);
    expect(risk.level).toBe("watch");
  });

  it("détecte un avancement en retard sur le calendrier", () => {
    const p = project({ start_date: "2026-03-01", deadline: "2026-03-11", progress: 20 });
    const risk = projectRisk(p, [], { today: TODAY });
    expect(risk.behindSchedule).toBe(true);
    expect(risk.level).toBe("watch");
  });

  it("annonce une échéance imminente", () => {
    const risk = projectRisk(project({ deadline: "2026-03-12" }), [], { today: TODAY });
    expect(risk.level).toBe("watch");
    expect(risk.reasons.join()).toContain("2 j");
  });
});

describe("projectSpent", () => {
  it("ne somme que les dépenses du projet", () => {
    const rows = [
      { project_id: "p1", kind: "depense", amount: 100 },
      { project_id: "p1", kind: "revenu", amount: 900 },
      { project_id: "p2", kind: "depense", amount: 50 },
      { project_id: null, kind: "depense", amount: 20 },
    ];
    expect(projectSpent("p1", rows)).toBe(100);
  });
});
