import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Workspace = "alias" | "allan";

export const WORKSPACES: { id: Workspace; name: string; tag: string; initials: string }[] = [
  { id: "alias", name: "ALIAS", tag: "Entreprise", initials: "AL" },
  { id: "allan", name: "ALLAN KLEIN", tag: "Freelance", initials: "AK" },
];

type Ctx = { workspace: Workspace; setWorkspace: (w: Workspace) => void };

const WorkspaceContext = createContext<Ctx>({ workspace: "allan", setWorkspace: () => {} });

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace>("allan");

  useEffect(() => {
    const stored = window.localStorage.getItem("ak-workspace");
    if (stored === "alias" || stored === "allan") setWorkspace(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("ak-workspace", workspace);
    const root = document.documentElement;
    root.classList.remove("ws-alias", "ws-allan");
    root.classList.add(workspace === "alias" ? "ws-alias" : "ws-allan");
  }, [workspace]);

  const value = useMemo(() => ({ workspace, setWorkspace }), [workspace]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

export function workspaceMeta(id: Workspace) {
  return WORKSPACES.find((w) => w.id === id)!;
}
