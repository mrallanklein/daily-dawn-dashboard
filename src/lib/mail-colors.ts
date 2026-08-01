import { useCallback, useEffect, useState } from "react";
import type { MailAccountId } from "@/lib/mail.functions";

/** Palette Notion pour les pastilles de compte. */
export const NOTION_DOT_COLORS = [
  { name: "Bleu", value: "#009fff" },
  { name: "Rouge", value: "#ff351f" },
  { name: "Orange", value: "#F97316" },
  { name: "Jaune", value: "#EAB308" },
  { name: "Vert", value: "#22C55E" },
  { name: "Violet", value: "#A855F7" },
  { name: "Rose", value: "#EC4899" },
  { name: "Marron", value: "#92400E" },
  { name: "Gris", value: "#6B7280" },
] as const;

export const DEFAULT_MAIL_COLORS: Record<MailAccountId, string> = {
  primary: "#009fff",
  secondary: "#ff351f",
};

const KEY = "ak-mail-colors";

function read(): Record<string, string> {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

/** Couleurs de pastille par compte, persistées localement et modifiables. */
export function useMailColors() {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => setOverrides(read()), []);

  const colorFor = useCallback(
    (account: MailAccountId) => overrides[account] ?? DEFAULT_MAIL_COLORS[account] ?? "#6B7280",
    [overrides],
  );

  const setColor = useCallback((account: MailAccountId, color: string) => {
    const next = { ...read(), [account]: color };
    window.localStorage.setItem(KEY, JSON.stringify(next));
    setOverrides(next);
  }, []);

  return { colorFor, setColor };
}
