import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, Phone, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Panel, EmptyState } from "@/components/app/panel";
import { contactsQuery, interactionsQuery, type Contact } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { todayISO } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({
    meta: [
      { title: "CRM — Contacts, tags & interactions" },
      {
        name: "description",
        content:
          "Base de contacts avec fiches détaillées, statuts, tags, pays, source et historique des interactions.",
      },
      { property: "og:title", content: "CRM — Contacts, tags & interactions" },
      { property: "og:description", content: "Contacts, statuts, tags et historique." },
    ],
  }),
  component: CrmPage,
});

const STATUSES = [
  { id: "prospect", label: "Prospect" },
  { id: "en_discussion", label: "En discussion" },
  { id: "client", label: "Client" },
  { id: "partenaire", label: "Partenaire" },
  { id: "inactif", label: "Inactif" },
];

function CrmPage() {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { data: contacts } = useQuery(contactsQuery(workspace));
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", company: "", email: "", phone: "" });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["contacts"] });
  const onError = (e: Error) => toast.error(e.message);

  const create = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase.from("contacts").insert({
        user_id: auth.user.id,
        workspace,
        full_name: form.full_name,
        company: form.company || null,
        email: form.email || null,
        phone: form.phone || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setForm({ full_name: "", company: "", email: "", phone: "" });
      invalidate();
    },
    onError,
  });

  const patch = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("contacts").update(rest as never).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setOpenId(null);
      invalidate();
    },
    onError,
  });

  const list = (contacts ?? []).filter((c) =>
    `${c.full_name} ${c.company ?? ""} ${c.email ?? ""} ${(c.tags ?? []).join(" ")}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  const current = (contacts ?? []).find((c) => c.id === openId) ?? null;

  return (
    <AppShell>
      <PageHeader
        title="CRM"
        subtitle={`${list.length} contact(s) sur ce profil`}
        actions={
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher…"
              className="h-9 w-48 pl-8"
            />
          </div>
        }
      />

      <Panel eyebrow="Ajout rapide" title="Nouveau contact" className="mb-4">
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
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            placeholder="Société"
          />
          <Input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email"
            type="email"
          />
          <Input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Téléphone"
          />
          <Button type="submit" className="gap-1.5">
            <Plus className="size-4" /> Ajouter
          </Button>
        </form>
      </Panel>

      <Panel eyebrow="Base de contacts" title="Contacts" bodyClassName="p-3">
        {list.length === 0 ? (
          <EmptyState>Aucun contact.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-2 py-2 font-normal">Nom</th>
                  <th className="px-2 py-2 font-normal">Société</th>
                  <th className="px-2 py-2 font-normal">Statut</th>
                  <th className="px-2 py-2 font-normal">Tags</th>
                  <th className="px-2 py-2 font-normal">Contact</th>
                  <th className="px-2 py-2 font-normal">Dernier échange</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-2 py-2">
                      <button onClick={() => setOpenId(c.id)} className="hover:underline">
                        {c.full_name}
                      </button>
                      {c.role ? (
                        <span className="ml-1.5 text-xs text-muted-foreground">{c.role}</span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">{c.company ?? "—"}</td>
                    <td className="px-2 py-2">
                      <Select
                        value={c.status}
                        onValueChange={(v) => patch.mutate({ id: c.id, status: v })}
                      >
                        <SelectTrigger className="h-7 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags ?? []).map((t) => (
                          <span key={t} className="pill text-muted-foreground">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {c.email ? (
                          <a href={`mailto:${c.email}`} aria-label={`Écrire à ${c.full_name}`}>
                            <Mail className="size-3.5 hover:text-brand" />
                          </a>
                        ) : null}
                        {c.phone ? (
                          <a href={`tel:${c.phone}`} aria-label={`Appeler ${c.full_name}`}>
                            <Phone className="size-3.5 hover:text-brand" />
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-xs tabular-nums text-muted-foreground">
                      {c.last_contact_date
                        ? format(parseISO(c.last_contact_date), "d MMM yyyy", { locale: fr })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {current ? (
        <ContactSheet
          contact={current}
          onClose={() => setOpenId(null)}
          onPatch={(values) => patch.mutate({ id: current.id, ...values })}
          onDelete={() => remove.mutate(current.id)}
        />
      ) : null}
    </AppShell>
  );
}

function ContactSheet({
  contact,
  onClose,
  onPatch,
  onDelete,
}: {
  contact: Contact;
  onClose: () => void;
  onPatch: (values: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: interactions } = useQuery(interactionsQuery(contact.id));
  const [kind, setKind] = useState("note");
  const [body, setBody] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase.from("contact_interactions").insert({
        user_id: auth.user.id,
        contact_id: contact.id,
        kind,
        body,
        occurred_on: todayISO(),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setBody("");
      onPatch({ last_contact_date: todayISO() });
      queryClient.invalidateQueries({ queryKey: ["contact_interactions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-left font-display">{contact.full_name}</SheetTitle>
          <p className="text-left text-xs text-muted-foreground">
            {contact.company ?? "Indépendant"}
            {contact.country ? ` · ${contact.country}` : ""}
          </p>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-8">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["role", "Rôle"],
                ["email", "Email"],
                ["phone", "Téléphone"],
                ["country", "Pays"],
                ["source", "Source"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={`c-${key}`}>{label}</Label>
                <Input
                  id={`c-${key}`}
                  defaultValue={(contact[key] as string | null) ?? ""}
                  onBlur={(e) => {
                    if (e.target.value !== (contact[key] ?? ""))
                      onPatch({ [key]: e.target.value || null });
                  }}
                />
              </div>
            ))}
            <div>
              <Label htmlFor="c-tags">Tags (séparés par une virgule)</Label>
              <Input
                id="c-tags"
                defaultValue={(contact.tags ?? []).join(", ")}
                onBlur={(e) =>
                  onPatch({
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="c-notes">Notes</Label>
            <Textarea
              id="c-notes"
              rows={3}
              defaultValue={contact.notes ?? ""}
              onBlur={(e) => onPatch({ notes: e.target.value || null })}
            />
          </div>

          <div className="space-y-2">
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
              Interactions
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (body.trim()) add.mutate();
              }}
              className="space-y-2"
            >
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="appel">Appel</SelectItem>
                  <SelectItem value="rendez_vous">Rendez-vous</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={2}
                placeholder="Résumé de l'échange…"
              />
              <Button type="submit" size="sm">
                Enregistrer l'interaction
              </Button>
            </form>
            <ul className="space-y-2">
              {(interactions ?? []).map((i) => (
                <li key={i.id} className="rounded-lg border border-border px-3 py-2">
                  <p className="text-sm whitespace-pre-wrap">{i.body}</p>
                  <p className={cn("mt-1 text-xs text-muted-foreground")}>
                    {i.kind} · {format(parseISO(i.occurred_on), "d MMM yyyy", { locale: fr })}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-4" /> Supprimer le contact
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
