import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_STATUSES } from "@/lib/project-status";
import { useProjectMutations } from "@/components/projects/use-project-mutations";
import { useWorkspace } from "@/lib/workspace";

export function ProjectDialog() {
  const { workspace } = useWorkspace();
  const { create } = useProjectMutations(workspace);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    client: "",
    category: "",
    status: "pas_commence",
    priority: "moyenne",
    deadline: "",
    budget: "",
    description: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" /> Nouveau projet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau projet</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="p-name">Nom</Label>
            <Input
              id="p-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Film — Long métrage"
            />
          </div>
          <div>
            <Label htmlFor="p-client">Client</Label>
            <Input
              id="p-client"
              value={form.client}
              onChange={(e) => set("client", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="p-cat">Famille</Label>
            <Input
              id="p-cat"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            />
          </div>
          <div>
            <Label>État</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priorité</Label>
            <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basse">Basse</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="p-deadline">Échéance</Label>
            <Input
              id="p-deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="p-budget">Budget (€)</Label>
            <Input
              id="p-budget"
              type="number"
              value={form.budget}
              onChange={(e) => set("budget", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea
              id="p-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!form.name.trim()) return;
              create.mutate(
                {
                  name: form.name.trim(),
                  client: form.client || null,
                  category: form.category || null,
                  status: form.status,
                  priority: form.priority,
                  deadline: form.deadline || null,
                  budget: form.budget ? Number(form.budget) : null,
                  description: form.description || null,
                },
                { onSuccess: () => setOpen(false) },
              );
            }}
          >
            Créer le projet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
