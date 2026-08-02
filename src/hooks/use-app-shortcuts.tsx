import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

/** Raccourcis d'une lettre : la page cible est atteinte immédiatement. */
export const PAGE_SHORTCUTS: { key: string; to: string; label: string }[] = [
  { key: "h", to: "/", label: "Accueil" },
  { key: "p", to: "/projets", label: "Projets" },
  { key: "t", to: "/taches", label: "Tâches" },
  { key: "c", to: "/calendrier", label: "Calendrier" },
  { key: "m", to: "/mail", label: "Boîte mail" },
  { key: "r", to: "/crm", label: "CRM" },
  { key: "b", to: "/budget", label: "Budget" },
  { key: "e", to: "/equipe", label: "Équipe" },
];

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable ||
    Boolean(el.closest?.('[role="dialog"], [contenteditable="true"]'))
  );
}

/**
 * Navigation clavier globale. Aucun raccourci ne se déclenche pendant la saisie
 * ni avec un modificateur (⌘K reste géré par la palette).
 */
export function useAppShortcuts({ onPalette }: { onPalette: () => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "/") {
        e.preventDefault();
        onPalette();
        return;
      }
      const match = PAGE_SHORTCUTS.find((s) => s.key === key);
      if (!match) return;
      e.preventDefault();
      navigate({ to: match.to });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, onPalette]);
}