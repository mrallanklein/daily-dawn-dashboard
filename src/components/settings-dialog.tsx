import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ImagePlus, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/data";
import { listMailAccounts } from "@/lib/mail.functions";
import { listCalendars } from "@/lib/agenda.functions";
import { WORKSPACES, useWorkspace } from "@/lib/workspace";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          <AvatarFallback>AK</AvatarFallback>
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
  const { workspace, setWorkspace } = useWorkspace();
  const { data: profile } = useQuery(profileQuery());
  const fetchAccounts = useServerFn(listMailAccounts);
  const fetchCalendars = useServerFn(listCalendars);

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
    display_name: "",
    avatar_url: "",
    alias_name: "",
    alias_avatar_url: "",
    banner_url: "",
    weather_city: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      display_name: profile.display_name ?? "",
      avatar_url: profile.avatar_url ?? "",
      alias_name: profile.alias_name ?? "ALIAS",
      alias_avatar_url: profile.alias_avatar_url ?? "",
      banner_url: profile.banner_url ?? "",
      weather_city: profile.weather_city ?? "",
    });
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: form.display_name,
          avatar_url: form.avatar_url || null,
          alias_name: form.alias_name || null,
          alias_avatar_url: form.alias_avatar_url || null,
          banner_url: form.banner_url || null,
          weather_city: form.weather_city,
        })
        .eq("id", auth.user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Paramètres enregistrés");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Paramètres</DialogTitle>
          <DialogDescription>Profils, images et comptes connectés.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profils">
          <TabsList className="w-full">
            <TabsTrigger value="profils" className="flex-1">
              Profils
            </TabsTrigger>
            <TabsTrigger value="comptes" className="flex-1">
              Comptes Google
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profils" className="space-y-5 pt-4">
            <div className="space-y-3">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                Allan Klein — Freelance
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="s-name">Nom affiché</Label>
                <Input
                  id="s-name"
                  value={form.display_name}
                  onChange={(e) => set({ display_name: e.target.value })}
                />
              </div>
              <ImageField
                label="Photo de profil"
                round
                folder="avatar"
                value={form.avatar_url || null}
                onUploaded={(url) => set({ avatar_url: url })}
              />
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                ALIAS — Entreprise
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="s-alias">Nom du profil</Label>
                <Input
                  id="s-alias"
                  value={form.alias_name}
                  onChange={(e) => set({ alias_name: e.target.value })}
                />
              </div>
              <ImageField
                label="Logo / photo ALIAS"
                round
                folder="alias"
                value={form.alias_avatar_url || null}
                onUploaded={(url) => set({ alias_avatar_url: url })}
              />
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <ImageField
                label="Bannière du tableau de bord"
                folder="banner"
                value={form.banner_url || null}
                onUploaded={(url) => set({ banner_url: url })}
              />
              <div className="space-y-1.5">
                <Label htmlFor="s-city">Ville pour la météo</Label>
                <Input
                  id="s-city"
                  value={form.weather_city}
                  onChange={(e) => set({ weather_city: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                {WORKSPACES.map((w) => (
                  <Button
                    key={w.id}
                    variant={workspace === w.id ? "default" : "secondary"}
                    size="sm"
                    className="press flex-1"
                    onClick={() => setWorkspace(w.id)}
                  >
                    {w.name}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comptes" className="space-y-4 pt-4">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                Boîtes mail connectées
              </p>
              <ul className="mt-2 space-y-1">
                {(mailAccounts ?? []).map((a) => (
                  <li key={a.id} className="flex items-center gap-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-sm">
                    <Mail className="size-3.5 text-muted-foreground" /> {a.email}
                  </li>
                ))}
                {(mailAccounts ?? []).length === 0 ? (
                  <li className="text-sm text-muted-foreground">Aucun compte détecté.</li>
                ) : null}
              </ul>
            </div>
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                Agendas Google
              </p>
              <ul className="mt-2 space-y-1">
                {(calendars ?? []).map((c) => (
                  <li
                    key={`${c.accountKey}::${c.calendarId}`}
                    className="flex items-center gap-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-sm"
                  >
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: c.color ?? "var(--brand)" }}
                    />
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    {c.writable ? null : (
                      <span className="pill text-muted-foreground">lecture</span>
                    )}
                  </li>
                ))}
                {(calendars ?? []).length === 0 ? (
                  <li className="text-sm text-muted-foreground">Aucun agenda détecté.</li>
                ) : null}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              Pour relier une boîte mail ou un agenda supplémentaire, demandez-le en chat : la
              connexion Google se fait via une autorisation sécurisée.
            </p>
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
