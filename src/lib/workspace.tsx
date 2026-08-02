import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { spacesQuery, type Space } from "@/lib/spaces";

export type Workspace = string;

type Ctx = {
  workspace: Workspace;
  setWorkspace: (w: Workspace) => void;
  spaces: Space[];
  space: Space | null;
};

const WorkspaceContext = createContext<Ctx>({
  workspace: "allan",
  setWorkspace: () => {},
  spaces: [],
  space: null,
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace>("allan");
  const { data: spaces } = useQuery({ ...spacesQuery(), retry: false });

  useEffect(() => {
    const stored = window.localStorage.getItem("ak-workspace");
    if (stored) setWorkspace(stored);
  }, []);

  const list = spaces ?? [];

  useEffect(() => {
    if (list.length === 0) return;
    if (!list.some((s) => s.slug === workspace)) setWorkspace(list[0]!.slug);
  }, [list.map((s) => s.slug).join(","), workspace]);

  useEffect(() => {
    window.localStorage.setItem("ak-workspace", workspace);
    const root = document.documentElement;
    root.classList.forEach((c) => {
      if (c.startsWith("ws-")) root.classList.remove(c);
    });
    root.classList.add(`ws-${workspace}`);
  }, [workspace]);

  const space = list.find((s) => s.slug === workspace) ?? null;
  const value = useMemo(
    () => ({ workspace, setWorkspace, spaces: list, space }),
    [workspace, list, space],
  );
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
