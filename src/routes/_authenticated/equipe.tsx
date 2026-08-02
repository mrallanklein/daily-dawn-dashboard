import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Panel, EmptyState } from "@/components/app/panel";
import { teamQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatabaseView } from "@/components/views/database-view";
import { useTeamSource } from "@/components/views/sources/team-source";

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

  const source = useTeamSource(team ?? []);

  if (workspace !== "alias") {
    return (
      <AppShell>
        <PageHeader title="Équipe" subtitle="Disponible sur le profil ALIAS" />
        <EmptyState>
          La gestion d'équipe est réservée au profil ALIAS. Basculez de profil dans la barre
          latérale.
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

      <DatabaseView source={source} />
    </AppShell>
  );
}
