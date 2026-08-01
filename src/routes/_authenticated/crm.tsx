import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ModuleCard } from "@/components/module-card";
import { contactsQuery, type Contact } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { fmtShortDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({
    meta: [
      { title: "CRM — Atelier" },
      {
        name: "description",
        content: "Base de contacts : entreprises, rôles, statut de relation et dernier échange.",
      },
      { property: "og:title", content: "CRM — Atelier" },
      { property: "og:description", content: "Suivi de vos contacts et relations." },
    ],
  }),
  component: CrmPage,
});

const STATUSES = ["prospect", "actif", "client", "inactif"];

function CrmPage() {
  const queryClient = useQueryClient();
  const { data: contacts } = useQuery(contactsQuery());
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["contacts"] });
  const fail = (e: Error) => toast.error(e.message);

  const create = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase.from("contacts").insert({
        full_name: fullName,
        user_id: auth.user.id,
        company: company || null,
        email: email || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setFullName("");
      setCompany("");
      setEmail("");
      invalidate();
    },
    onError: fail,
  });

  const patch = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string } & Partial<Contact>) => {
      const { error } = await supabase.from("contacts").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: fail,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: fail,
  });

  return (
    <AppShell>
      <h1 className="mb-6 text-3xl font-medium">CRM</h1>

      <ModuleCard eyebrow="Nouvelle entrée" title="Ajouter un contact" className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (fullName.trim()) create.mutate();
          }}
          className="grid gap-3 md:grid-cols-[1.5fr_1fr_1.5fr_auto]"
        >
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nom" />
          <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Structure" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <Button type="submit">
            <Plus className="mr-1 size-4" /> Ajouter
          </Button>
        </form>
      </ModuleCard>

      <ModuleCard eyebrow={`${contacts?.length ?? 0} contact(s)`} title="Base de contacts">
        {(contacts ?? []).length === 0 ? (
          <EmptyState>Aucun contact enregistré.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Coordonnées</th>
                  <th className="pb-3">Statut</th>
                  <th className="pb-3">Dernier échange</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody>
                {(contacts ?? []).map((contact) => (
                  <tr key={contact.id} className="border-t border-border/50">
                    <td className="py-3 pr-4">
                      <p>{contact.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[contact.role, contact.company].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">
                      {contact.email ? <span className="block">{contact.email}</span> : null}
                      {contact.phone ? <span className="block">{contact.phone}</span> : null}
                      {!contact.email && !contact.phone ? "—" : null}
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={contact.status}
                        onChange={(e) => patch.mutate({ id: contact.id, status: e.target.value })}
                        className="rounded-md border border-input bg-transparent px-2 py-1 text-xs capitalize"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {contact.last_contact_date ? fmtShortDate(contact.last_contact_date) : "—"}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => remove.mutate(contact.id)}
                        aria-label="Supprimer le contact"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ModuleCard>
    </AppShell>
  );
}