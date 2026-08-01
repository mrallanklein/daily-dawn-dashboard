import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Panel, EmptyState } from "@/components/app/panel";
import { teamQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Équipe — Membres & permissions ALIAS" },
      {
        name: "description",
        content:
          "Gestion des membres de l'équipe ALIAS : rôles, permissions administrateur, membre ou lecteur.",
      },
      { property: "og:title", content: "Équipe — Membres & permissions ALIAS" },
      { property: "og:description", content: "Membres, rôles et permissions de l'équipe." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { data: team } = useQuery(teamQuery(workspace));
  const [form, setForm] = useState({ full_name: "", email: "", role: "", permission: "membre" });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["team_members"] });
  const onError = (e: Error) => toast.error(e.message);

  const create = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase.from("team_members").insert({
        user_id: auth.user.id,
        workspace,
        full_name: form.full_name,
        email: form.email || null,
        role: form.role || null,
        permission: form.permission,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setForm({ full_name: "", email: "", role: "", permission: "membre" });
      invalidate();
    },
    onError,
  });

  const patch = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("team_members").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError,
  });

  if (workspace !== "alias") {
    return (
      <AppShell>
        <PageHeader title="Équipe" subtitle="Disponible sur le profil ALIAS" />
        <EmptyState>
          La gestion d'équipe est réservée au profil ALIAS. Basculez de profil dans la barre latérale.
        </EmptyState>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Équipe" subtitle={`${(team ?? []).length} membre(s) chez ALIAS`} />

      <Panel eyebrow="Inviter" title="Ajouter un membre" className="mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.full_name.trim()) create.mutate();
          }}
          className="grid gap-2 md:grid-cols-5"
        >
          <Input
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Nom complet"
          />
          <Input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email"
            type="email"
          />
          <Input
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            placeholder="Rôle (monteur, DA…)"
          />
          <Select
            value={form.permission}
            onValueChange={(v) => setForm((f) => ({ ...f, permission: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrateur</SelectItem>
              <SelectItem value="membre">Membre</SelectItem>
              <SelectItem value="viewer">Lecteur</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" className="gap-1.5">
            <Plus className="size-4" /> Ajouter
          </Button>
        </form>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {(team ?? []).map((m) => (
          <div key={m.id} className="surface group p-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 shrink-0">
                <AvatarImage src={m.avatar_url ?? undefined} alt={m.full_name} />
                <AvatarFallback className="bg-secondary text-xs">
                  {m.full_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{m.email ?? m.role ?? "—"}</p>
              </div>
              <button
                onClick={() => remove.mutate(m.id)}
                aria-label="Retirer le membre"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Input
                defaultValue={m.role ?? ""}
                onBlur={(e) => patch.mutate({ id: m.id, role: e.target.value || null })}
                placeholder="Rôle"
                className="h-8 text-xs"
              />
              <Select
                value={m.permission}
                onValueChange={(v) => patch.mutate({ id: m.id, permission: v })}
              >
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="membre">Membre</SelectItem>
                  <SelectItem value="viewer">Lecteur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
        {(team ?? []).length === 0 ? (
          <EmptyState>Aucun membre pour l'instant.</EmptyState>
        ) : null}
      </div>
    </AppShell>
  );
}
