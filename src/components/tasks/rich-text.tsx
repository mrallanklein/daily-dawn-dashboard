import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Code, Italic, Link2, Strikethrough } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Éditeur de description en texte riche (TipTap) avec menu flottant au survol
 * de la sélection : gras, italique, barré, code et lien (⌘K).
 * Le contenu est stocké en HTML dans la colonne `description`.
 */
export function RichText({
  value,
  onSave,
  placeholder = "Description…",
  className,
}: {
  value: string | null;
  onSave: (html: string | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value ?? "",
    editorProps: {
      attributes: {
        class: cn(
          "prose-none min-h-[3.5rem] w-full text-sm leading-relaxed text-muted-foreground outline-none",
          "[&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1",
        ),
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          promptLink();
          return true;
        }
        return false;
      },
    },
    onBlur: ({ editor: e }) => {
      const html = e.isEmpty ? null : e.getHTML();
      if (html !== (value || null)) onSave(html);
    },
  });

  function promptLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Adresse du lien", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  useEffect(() => {
    if (editor && !editor.isFocused && (value ?? "") !== editor.getHTML()) {
      editor.commands.setContent(value ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const btn = (active: boolean) =>
    cn(
      "press grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground",
      active && "bg-muted text-foreground",
    );

  return (
    <div className={cn("relative", className)}>
      <BubbleMenu editor={editor}>
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-1 shadow-[var(--shadow-soft)]">
          <button
            type="button"
            aria-label="Gras"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={btn(editor.isActive("bold"))}
          >
            <Bold className="size-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Italique"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={btn(editor.isActive("italic"))}
          >
            <Italic className="size-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Barré"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={btn(editor.isActive("strike"))}
          >
            <Strikethrough className="size-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Code"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={btn(editor.isActive("code"))}
          >
            <Code className="size-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Lien (⌘K)"
            onClick={promptLink}
            className={btn(editor.isActive("link"))}
          >
            <Link2 className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </BubbleMenu>

      {editor.isEmpty ? (
        <p className="pointer-events-none absolute left-0 top-0 text-sm text-muted-foreground/60">
          {placeholder}
        </p>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}
