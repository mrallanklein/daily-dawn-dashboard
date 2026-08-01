import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ModuleCard } from "@/components/module-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PROJECT_STATUSES } from "@/lib/project-status";

export function ProjectForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [family, setFamily] = useState("");
  const [status, setStatus] = useState<string>("pas_commence");
  const [deadline, setDeadline] = useState("");
  const [cover, setCover] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase.from("projects").insert({
        name,
        user_id: auth.user.id,
        status,
        category: family || null,
        deadline: deadline || null,
        cover_url: cover || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setName("");
      setFamily("");
      setDeadline("");
      setCover("");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <ModuleCard eyebrow="Nouvelle entrée" title="Créer un projet" className="mb-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) create.mutate();
        }}
        className="grid gap-3 md:grid-cols-3 lg:grid-cols-6"
      >
        <Input
          className="lg:col-span-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Film - Long Métrage 1939"
        />
        <Input
          value={family}
          onChange={(e) => setFamily(e.target.value)}
          placeholder="Famille (Film, Recherche…)"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        <Input
          value={cover}
          onChange={(e) => setCover(e.target.value)}
          placeholder="URL de couverture"
        />
        <Button type="submit" className="md:col-span-3 lg:col-span-6">
          <Plus className="mr-1 size-4" /> Créer le projet
        </Button>
      </form>
    </ModuleCard>
  );
}