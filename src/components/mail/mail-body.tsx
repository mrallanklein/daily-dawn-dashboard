import { useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Rend le corps d'un mail : HTML assaini, images distantes bloquées par défaut. */
export function MailBody({ html, text }: { html: string; text: string }) {
  const [showImages, setShowImages] = useState(false);

  const { markup, hasImages } = useMemo(() => {
    if (!html.trim()) return { markup: "", hasImages: false };
    if (typeof window === "undefined") return { markup: "", hasImages: false };

    const clean = DOMPurify.sanitize(html, {
      FORBID_TAGS: ["style", "script", "iframe", "form", "input"],
      FORBID_ATTR: ["srcset"],
    });
    const doc = new DOMParser().parseFromString(clean, "text/html");
    const images = Array.from(doc.querySelectorAll("img"));
    for (const img of images) {
      const src = img.getAttribute("src") ?? "";
      if (!showImages && /^https?:/i.test(src)) {
        img.setAttribute("data-blocked-src", src);
        img.removeAttribute("src");
        img.setAttribute("alt", img.getAttribute("alt") || "Image bloquée");
      }
      img.style.maxWidth = "100%";
      img.style.height = "auto";
    }
    for (const a of Array.from(doc.querySelectorAll("a"))) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer nofollow");
    }
    return {
      markup: doc.body.innerHTML,
      hasImages: images.some((i) => /^https?:/i.test(i.getAttribute("data-blocked-src") ?? "")),
    };
  }, [html, showImages]);

  if (!markup) {
    return (
      <p className="mt-4 max-h-[42vh] overflow-y-auto whitespace-pre-wrap break-words text-sm">
        {text}
      </p>
    );
  }

  return (
    <div className="mt-4">
      {hasImages ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <ImageOff className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1">Images bloquées pour votre sécurité.</span>
          <Button size="sm" variant="secondary" onClick={() => setShowImages(true)}>
            Afficher les images
          </Button>
        </div>
      ) : null}
      <div
        className="mail-html max-h-[42vh] overflow-y-auto break-words text-sm [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_table]:max-w-full"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    </div>
  );
}
