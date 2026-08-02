import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, ImagePlus, Loader2, LocateFixed, Mail, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { locateCity, searchCities } from "@/lib/cities";
import { listMailAccounts } from "@/lib/mail.functions";
import { listCalendars } from "@/lib/agenda.functions";
import { createSpace, deleteSpace, spaceInitials, updateSpace, type Space } from "@/lib/spaces";
import { useWorkspace } from "@/lib/workspace";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

async function uploadImage(file: File, folder: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Session expirée");
  const path = `${auth.user.id}/${folder}-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const up = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (up.error) throw new Error(up.error.message);
  const signed = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signed.error) throw new Error(signed.error.message);
  return signed.data.signedUrl;
}

function ImageField({
  label,
  value,
  onUploaded,
  folder,
  round,
}: {
  label: string;
  value: string | null;
  onUploaded: (url: string) => void;
  folder: string;
  round?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      onUploaded(await uploadImage(file, folder));
      toast.success("Image mise à jour");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {round ? (
        <Avatar className="size-14">
          <AvatarImage src={value ?? undefined} className="object-cover" alt={label} />
          <AvatarFallback>··</AvatarFallback>
        </Avatar>
      ) : (
        <div
          className="h-14 w-24 shrink-0 rounded-lg border border-border bg-muted bg-cover bg-center"
          style={value ? { backgroundImage: `url(${value})` } : undefined}
        />
      )}
      <div className="min-w-0 flex-1">
        <Label className="text-sm">{label}</Label>
        <Button
          variant="secondary"
          size="sm"
          className="press mt-1.5 w-full"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <ImagePlus className="mr-1.5 size-4" />
          )}
          Choisir une image
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { workspace, setWorkspace, spaces, space } = useWorkspace();
  const [editing, setEditing] = useState<string | null>(null);
  const fetchAccounts = useServerFn(listMailAccounts);
  const fetchCalendars = useServerFn(listCalendars);

  const active = spaces.find((s) => s.id === editing) ?? space ?? spaces[0] ?? null;

  useEffect(() => {
    if (open) setEditing(space?.id ?? null);
  }, [open, space?.id]);

  const { data: mailAccounts } = useQuery({
    queryKey: ["mail-accounts"],
    retry: false,
    enabled: open,
    queryFn: () => fetchAccounts(),
  });
  const { data: calendars } = useQuery({
    queryKey: ["calendar-sources"],
    retry: false,
    enabled: open,
    queryFn: () => fetchCalendars(),
  });

  const [form, setForm] = useState({
    name: "",
    tag: "",
    avatar_url: "",
    banner_url: "",
    weather_city: "",
    weather_lat: 43.6047,
    weather_lon: 1.4442,
  });
  const [cityFocus, setCityFocus] = useState(false);
  const citySuggestions = searchCities(form.weather_city);

  useEffect(() => {
    if (!active) return;
    setForm({
      name: active.name,
      tag: active.tag ?? "",
      avatar_url: active.avatar_url ?? "",
      banner_url: active.banner_url ?? "",
      weather_city: active.weather_city ?? "",
      weather_lat: active.weather_lat ?? 43.6047,
      weather_lon: active.weather_lon ?? 1.4442,
    });
  }, [active?.id]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["spaces"] });

  const save = useMutation({
    mutationFn: async () => {
      if (!active) throw new Error("Aucun espace sélectionné");
      await updateSpace(active.id, {
        name: form.name.trim() || active.name,
        tag: form.tag,
        avatar_url: form.avatar_url || null,
        banner_url: form.banner_url || null,
        weather_city: form.weather_city || "Toulouse",
        weather_lat: form.weather_lat,
        weather_lon: form.weather_lon,
      });
    },
    onSuccess: () => {
      refresh();
      toast.success("Espace enregistré");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSpace = useMutation({
    mutationFn: () => createSpace("Nouvel espace", "Espace", spaces.length),
    onSuccess: async (slug) => {
      await refresh();
      setWorkspace(slug);
      toast.success("Espace créé");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSpace = useMutation({
    mutationFn: (id: string) => deleteSpace(id),
    onSuccess: async () => {
      await refresh();
      setEditing(null);
      toast.success("Espace supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patchGoogle = useMutation({
    mutationFn: (patch: Partial<Space>) => updateSpace(active!.id, patch),
    onSuccess: () => refresh(),
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  /** Boîtes mail Google → agendas de cette boîte. */
  const mailboxes = (mailAccounts ?? []).map((a) => {
    const cals = (calendars ?? []).filter(
      (c) => (c.accountEmail ?? "").toLowerCase() === a.email.toLowerCase(),
    );
    return { id: a.id, email: a.email, calendars: cals };
  });
  const orphanCalendars = (calendars ?? []).filter(
    (c) =>
      !mailboxes.some(
        (m) => (c.accountEmail ?? "").toLowerCase() === m.email.toLowerCase(),
      ),
  );
  const [mailbox, setMailbox] = useState<string | null>(null);
  const selectedMailbox = mailboxes.find((m) => m.id === mailbox) ?? mailboxes[0] ?? null;

  const enabledMails = active?.mail_accounts ?? [];
  const enabledCals = active?.calendar_ids ?? [];
  /** Toutes les clés d'agendas connues (utile quand aucun filtre n'est encore posé). */
  const allCalKeys = (calendars ?? []).map((c) => `${c.accountKey}::${c.calendarId}`);
  const allMailIds = mailboxes.map((m) => m.id);
  const toggleCal = (key: string) => {
    // Liste vide = « tout afficher » : on la matérialise avant de décocher,
    // sinon décocher revenait à ne garder que l'agenda cliqué.
    const current = enabledCals.length === 0 ? allCalKeys : enabledCals;
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : Array.from(new Set([...current, key]));
    patchGoogle.mutate({ calendar_ids: next });
  };
  const toggleMail = (id: string, on: boolean) => {
    const current = enabledMails.length === 0 ? allMailIds : enabledMails;
    const next = on
      ? Array.from(new Set([...current, id]))
      : current.filter((k) => k !== id);
    patchGoogle.mutate({ mail_accounts: next });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Paramètres</DialogTitle>
          <DialogDescription>
            Réglages propres à chaque espace : identité, images et comptes Google.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {spaces.map((s) => (
            <button
              key={s.id}
              onClick={() => setEditing(s.id)}
              className={cn(
                "press flex items-center gap-2 rounded-full border px-2.5 py-1 text-sm transition-colors",
                active?.id === s.id
                  ? "border-foreground/25 bg-muted font-semibold"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {s.avatar_url ? (
                <img src={s.avatar_url} alt={s.name} className="size-5 rounded-full object-cover" />
              ) : (
                <span className="grid size-5 place-items-center rounded-full bg-secondary text-[0.6rem] font-semibold">
                  {spaceInitials(s.name)}
                </span>
              )}
              <span className="max-w-[9rem] truncate">{s.name}</span>
            </button>
          ))}
          <Button
            variant="secondary"
            size="sm"
            className="press rounded-full"
            onClick={() => addSpace.mutate()}
            disabled={addSpace.isPending}
          >
            <Plus className="mr-1 size-3.5" /> Espace
          </Button>
        </div>

        <Tabs defaultValue="espace" className="mt-1">
          <TabsList className="w-full">
            <TabsTrigger value="espace" className="flex-1">
              Espace
            </TabsTrigger>
            <TabsTrigger value="comptes" className="flex-1">
              Comptes Google
            </TabsTrigger>
          </TabsList>

          <TabsContent value="espace" className="space-y-4 pt-4">
            {active ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="s-name">Nom de l'espace</Label>
                    <Input
                      id="s-name"
                      value={form.name}
                      onChange={(e) => set({ name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="s-tag">Étiquette</Label>
                    <Input
                      id="s-tag"
                      value={form.tag}
                      placeholder="Freelance, Entreprise…"
                      onChange={(e) => set({ tag: e.target.value })}
                    />
                  </div>
                </div>
                <ImageField
                  label="Photo / logo de l'espace"
                  round
                  folder={`space-${active.slug}`}
                  value={form.avatar_url || null}
                  onUploaded={(url) => set({ avatar_url: url })}
                />
                <ImageField
                  label="Bannière du tableau de bord"
                  folder={`banner-${active.slug}`}
                  value={form.banner_url || null}
                  onUploaded={(url) => set({ banner_url: url })}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="s-city">Ville pour la météo</Label>
                  <div className="flex gap-1.5">
                    <div className="relative min-w-0 flex-1">
                      <Input
                        id="s-city"
                        autoComplete="off"
                        placeholder="Toulouse"
                        value={form.weather_city}
                        onFocus={() => setCityFocus(true)}
                        onBlur={() => window.setTimeout(() => setCityFocus(false), 120)}
                        onChange={(e) => set({ weather_city: e.target.value })}
                      />
                      {cityFocus && citySuggestions.length > 0 ? (
                        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-[var(--shadow-pop)]">
                          {citySuggestions.map((c) => (
                            <li key={c.name}>
                              <button
                                type="button"
                                className="w-full px-2.5 py-1.5 text-left text-sm hover:bg-muted"
                                onClick={() => {
                                  set({ weather_city: c.name, weather_lat: c.lat, weather_lon: c.lon });
                                  setCityFocus(false);
                                }}
                              >
                                {c.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="press shrink-0"
                      onClick={async () => {
                        try {
                          const c = await locateCity();
                          set({ weather_city: c.name, weather_lat: c.lat, weather_lon: c.lon });
                          toast.success(`Position détectée : ${c.name}`);
                        } catch (e) {
                          toast.error((e as Error).message);
                        }
                      }}
                    >
                      <LocateFixed size={16} strokeWidth={1.5} className="mr-1.5" />
                      Géolocalisation
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="press"
                    onClick={() => setWorkspace(active.slug)}
                    disabled={workspace === active.slug}
                  >
                    {workspace === active.slug ? "Espace actif" : "Basculer sur cet espace"}
                  </Button>
                  {spaces.length > 1 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="press text-destructive"
                      onClick={() => removeSpace.mutate(active.id)}
                    >
                      <Trash2 className="mr-1.5 size-4" /> Supprimer
                    </Button>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Créez un premier espace.</p>
            )}
          </TabsContent>

          <TabsContent value="comptes" className="space-y-4 pt-4">
            <p className="text-xs text-muted-foreground">
              Ces réglages s'appliquent uniquement à l'espace{" "}
              <span className="font-semibold text-foreground">{active?.name}</span>.
            </p>

            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                1 · Boîte mail Google
              </p>
              <ul className="mt-2 space-y-1">
                {mailboxes.map((m) => (
                  <li
                    key={m.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition-colors",
                      selectedMailbox?.id === m.id
                        ? "border-foreground/20 bg-muted"
                        : "border-transparent bg-muted/50",
                    )}
                  >
                    <button
                      onClick={() => setMailbox(m.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate font-medium">{m.email}</span>
                      <span className="pill shrink-0 text-muted-foreground">
                        {m.calendars.length} agenda(s)
                      </span>
                    </button>
                    <Switch
                      checked={enabledMails.length === 0 || enabledMails.includes(m.id)}
                      onCheckedChange={(v) => toggleMail(m.id, v)}
                      aria-label={`Activer ${m.email} dans cet espace`}
                    />
                  </li>
                ))}
                {mailboxes.length === 0 ? (
                  <li className="text-sm text-muted-foreground">Aucune boîte mail détectée.</li>
                ) : null}
              </ul>
              <Button
                variant="secondary"
                size="sm"
                className="press mt-2 w-full"
                onClick={() =>
                  toast.info(
                    "Demandez en chat « connecte la boîte mail … » : l'autorisation Google sécurisée s'ouvrira.",
                  )
                }
              >
                <Plus className="mr-1.5 size-4" /> Connecter une autre boîte mail
              </Button>
            </div>

            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                2 · Agendas de {selectedMailbox?.email ?? "cette boîte"}
              </p>
              <ul className="mt-2 space-y-1">
                {(selectedMailbox?.calendars ?? []).map((c) => {
                  const key = `${c.accountKey}::${c.calendarId}`;
                  const on = enabledCals.length === 0 || enabledCals.includes(key);
                  return (
                    <li key={key}>
                      <button
                        onClick={() => toggleCal(key)}
                        className="press flex w-full items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-left text-sm"
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: c.color ?? "var(--brand)" }}
                        />
                        <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                        {c.writable ? null : (
                          <span className="pill shrink-0 text-muted-foreground">lecture</span>
                        )}
                        <span
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded border",
                            on ? "border-foreground bg-foreground text-background" : "border-border",
                          )}
                        >
                          {on ? <Check className="size-3" /> : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {(selectedMailbox?.calendars ?? []).length === 0 ? (
                  <li className="text-sm text-muted-foreground">Aucun agenda pour cette boîte.</li>
                ) : null}
              </ul>
              {orphanCalendars.length > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {orphanCalendars.length} agenda(s) non rattaché(s) à une boîte mail connue.
                </p>
              ) : null}
              {enabledCals.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Aucun filtre : tous les agendas sont affichés.
                </p>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button className="press" onClick={() => save.mutate()} disabled={save.isPending}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
