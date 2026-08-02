export const BLOCK_TYPES = [
  { type: "text", label: "Texte" },
  { type: "heading", label: "Titre 1" },
  { type: "heading2", label: "Titre 2" },
  { type: "heading3", label: "Titre 3" },
  { type: "bullet", label: "Liste à puces" },
  { type: "numbered", label: "Liste numérotée" },
  { type: "todo", label: "Case à cocher" },
  { type: "quote", label: "Citation" },
  { type: "code", label: "Code" },
  { type: "image", label: "Image" },
  { type: "divider", label: "Séparateur" },
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number]["type"];

export type Block = {
  id: string;
  type: BlockType;
  text: string;
  checked?: boolean;
  /** URL pour les blocs image. */
  url?: string;
};

export function emptyBlock(type: BlockType = "text"): Block {
  return { id: crypto.randomUUID(), type, text: "" };
}
