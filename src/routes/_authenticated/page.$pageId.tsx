import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Table2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Breadcrumbs } from "@/components/app/breadcrumbs";
import { EmptyState, ListSkeleton } from "@/components/app/empty-state";
import { BlockEditor } from "@/components/blocks/block-editor";
import type { Block } from "@/components/blocks/blocks";
import { DatabaseView } from "@/components/views/database-view";
import type { DataSource, PropertyDef, Row } from "@/components/views/types";
import {
  createPageEntry,
  pageEntriesQuery,
  pagesQuery,
  updatePage,
  updatePageEntry,
} from "@/lib/pages";
import { useWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/_authenticated/page/$pageId")({
  head: () => ({
    meta: [
      { title: "Page de travail — espace personnalisé" },
      {
        name: "description",
        content:
          "Page dynamique de l'espace de travail : éditeur de blocs ou base de données avec vues, filtres et propriétés personnalisées.",
      },
      { property: "og:title", content: "Page de travail — espace personnalisé" },
      {
        property: "og:description",
        content: "Éditeur de blocs ou base de données avec vues et propriétés personnalisées.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DynamicPage,
});

function DynamicPage() {
  const { pageId } = Route.useParams();
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { data: pages, isLoading } = useQuery(pagesQuery(workspace));
  const page = (pages ?? []).find((p) => p.id === pageId) ?? null;
  const isDatabase = page?.kind === "database";
  const entries = useQuery({ ...pageEntriesQuery(pageId), enabled: Boolean(isDatabase) });
  const [creating, setCreating] = useState(false);

  const saveBlocks = useMutation({
    mutationFn: async (blocks: Block[]) => updatePage(pageId, { content: { blocks } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace_pages", workspace] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Enregistrement impossible"),
  });

  const properties = useMemo<PropertyDef[]>(
    () => [{ id: "title", name: "Nom", type: "title" }],
    [],
  );

  const rows = useMemo<Row[]>(
    () => (entries.data ?? []).map((e) => ({ id: e.id, values: { title: e.title, ...e.values } })),
    [entries.data],
  );

  const source: DataSource = {
    module: `page:${pageId}`,
    label: page?.name ?? "Page",
    properties,
    rows,
    titleProp: "title",
    isLoading: entries.isLoading || creating,
    onCreate: async () => {
      setCreating(true);
      try {
        await createPageEntry(pageId, "Sans titre", rows.length);
        await queryClient.invalidateQueries({ queryKey: ["page_entries", pageId] });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Création impossible");
      } finally {
        setCreating(false);
      }
    },
    onPatch: async (rowId, patch) => {
      const clean = { ...patch };
      const title = clean["title"];
      delete clean["title"];
      await updatePageEntry(rowId, {
        ...(title === undefined ? {} : { title: String(title) }),
        ...(Object.keys(clean).length ? { values: clean } : {}),
      });
      await queryClient.invalidateQueries({ queryKey: ["page_entries", pageId] });
    },
  };

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: "Espace" }, { label: page?.name ?? "Page" }]} />
      <PageHeader
        title={page ? `${page.emoji ? `${page.emoji} ` : ""}${page.name}` : "Page"}
        icon={isDatabase ? Table2 : FileText}
        subtitle={
          isDatabase
            ? `${rows.length} entrée(s) — vues, filtres et propriétés personnalisables`
            : "Page libre — éditeur de blocs"
        }
      />

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : !page ? (
        <EmptyState
          icon={FileText}
          title="Page introuvable"
          description="Cette page a été supprimée ou appartient à un autre espace de travail."
        />
      ) : isDatabase ? (
        <DatabaseView source={source} />
      ) : (
        <BlockEditor
          blocks={page.content.blocks ?? []}
          onChange={(next) => saveBlocks.mutate(next)}
        />
      )}
    </AppShell>
  );
}
