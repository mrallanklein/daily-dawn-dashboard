import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  OPTION_COLORS,
  PROPERTY_TYPES,
  type NumberFormat,
  type OptionColor,
  type PropertyDef,
  type PropertyType,
  type SelectOption,
} from "./types";
import { colorTokens } from "./engine";

const GROUPS = Array.from(new Set(PROPERTY_TYPES.map((t) => t.group)));

export function PropertyEditor({
  open,
  onOpenChange,
  property,
  properties,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  property: PropertyDef | null;
  properties: PropertyDef[];
  onSave: (input: {
    id?: string;
    name: string;
    type: PropertyType;
    config: Record<string, unknown>;
    hidden: boolean;
  }) => void;
  onDelete?: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<PropertyType>("text");
  const [format, setFormat] = useState<NumberFormat>("plain");
  const [formula, setFormula] = useState("");
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(property?.name ?? "");
    setType(property?.type ?? "text");
    setFormat(property?.format ?? "plain");
    setFormula(property?.formula ?? "");
    setOptions(property?.options ?? []);
    setHidden(Boolean(property?.hidden));
  }, [open, property]);

  const hasOptions = ["select", "multi_select", "status"].includes(type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {property ? "Modifier la propriété" : "Nouvelle propriété"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prop-name">Nom de la propriété</Label>
            <Input
              id="prop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Priorité, Budget, Ville…"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as PropertyType)}
              disabled={property?.type === "title"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUPS.map((group) => (
                  <div key={group}>
                    <p className="px-2 py-1.5 text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">
                      {group}
                    </p>
                    {PROPERTY_TYPES.filter((t) => t.group === group).map((t) => (
                      <SelectItem key={t.type} value={t.type}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {["number", "rollup"].includes(type) ? (
            <div className="space-y-1.5">
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as NumberFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain">Nombre</SelectItem>
                  <SelectItem value="eur">Devise €</SelectItem>
                  <SelectItem value="usd">Devise $</SelectItem>
                  <SelectItem value="gbp">Devise £</SelectItem>
                  <SelectItem value="percent">Pourcentage %</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {type === "formula" ? (
            <div className="space-y-1.5">
              <Label htmlFor="prop-formula">Formule</Label>
              <Input
                id="prop-formula"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="{budget} - {depense}"
              />
              <p className="text-[0.75rem] text-muted-foreground">
                Propriétés disponibles :{" "}
                {properties
                  .filter((p) => p.type !== "formula")
                  .map((p) => `{${p.id}}`)
                  .join(" · ")}
              </p>
            </div>
          ) : null}

          {hasOptions ? (
            <div className="space-y-2">
              <Label>Options</Label>
              {options.map((opt, index) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <Input
                    value={opt.label}
                    onChange={(e) =>
                      setOptions((prev) =>
                        prev.map((o, i) => (i === index ? { ...o, label: e.target.value } : o)),
                      )
                    }
                    className="flex-1"
                  />
                  <Select
                    value={opt.color}
                    onValueChange={(v) =>
                      setOptions((prev) =>
                        prev.map((o, i) => (i === index ? { ...o, color: v as OptionColor } : o)),
                      )
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPTION_COLORS.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="size-3 rounded-full"
                              style={{ backgroundColor: colorTokens(c.id).bg }}
                            />
                            {c.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    aria-label="Supprimer l'option"
                    onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                    className="press grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setOptions((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), label: "Option", color: "gray" },
                  ])
                }
              >
                <Plus size={15} strokeWidth={1.5} /> Ajouter une option
              </Button>
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-[12px] border border-border px-3 py-2">
            <Label htmlFor="prop-hidden" className="cursor-pointer">
              Masquer dans les vues
            </Label>
            <Switch id="prop-hidden" checked={hidden} onCheckedChange={setHidden} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {property && property.custom && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive"
              onClick={() => {
                onDelete(property.id);
                onOpenChange(false);
              }}
            >
              <Trash2 size={15} strokeWidth={1.5} /> Supprimer
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            onClick={() => {
              onSave({
                ...(property?.custom ? { id: property.id } : {}),
                name: name.trim() || "Propriété",
                type,
                config: {
                  ...(["number", "rollup"].includes(type) ? { format } : {}),
                  ...(type === "formula" ? { formula } : {}),
                  ...(hasOptions ? { options } : {}),
                },
                hidden,
              });
              onOpenChange(false);
            }}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
