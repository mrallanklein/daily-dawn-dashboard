import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { cn } from "@/lib/utils";
import {
  OPTION_COLORS,
  PROPERTY_TYPES,
  type DateMode,
  type NumberFormat,
  type OptionColor,
  type PropertyDef,
  type PropertyType,
  type SelectOption,
} from "./types";
import { colorTokens } from "./engine";
import { PROPERTY_ICONS } from "./property-icons";

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
  const [dateMode, setDateMode] = useState<DateMode>("date");
  const [formula, setFormula] = useState("");
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [hidden, setHidden] = useState(false);
  const [typeQuery, setTypeQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const formulaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(property?.name ?? "");
    setType(property?.type ?? "text");
    setFormat(property?.format ?? "plain");
    setDateMode(property?.dateMode ?? "date");
    setFormula(property?.formula ?? "");
    setOptions(property?.options ?? []);
    setHidden(Boolean(property?.hidden));
    setTypeQuery("");
  }, [open, property]);

  const hasOptions = ["select", "multi_select", "status"].includes(type);

  const typeList = useMemo(() => {
    const q = typeQuery.trim().toLowerCase();
    return PROPERTY_TYPES.filter((t) => t.label.toLowerCase().includes(q));
  }, [typeQuery]);

  /** Auto-complétion de formule : dernier `{…` en cours de saisie. */
  const formulaToken = useMemo(() => {
    const at = formula.lastIndexOf("{");
    if (at < 0 || formula.slice(at).includes("}")) return null;
    return formula.slice(at + 1).toLowerCase();
  }, [formula]);

  const formulaSuggestions = useMemo(() => {
    if (formulaToken == null) return [];
    return properties
      .filter((p) => p.type !== "formula")
      .filter(
        (p) =>
          p.name.toLowerCase().includes(formulaToken) || p.id.toLowerCase().includes(formulaToken),
      )
      .slice(0, 6);
  }, [formulaToken, properties]);

  const insertToken = (id: string) => {
    const at = formula.lastIndexOf("{");
    setFormula(`${formula.slice(0, at < 0 ? formula.length : at)}{${id}} `);
    formulaRef.current?.focus();
  };

  const CurrentIcon = PROPERTY_ICONS[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {property ? "Modifier la propriété" : "Nouvelle propriété"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nom */}
          <div className="flex items-center gap-2 rounded-[12px] border border-border px-3">
            <CurrentIcon size={16} strokeWidth={1.6} className="text-muted-foreground" />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Saisir le nom de la propriété…"
              aria-label="Nom de la propriété"
              className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          {/* Type — grille façon Notion */}
          <div className="rounded-[12px] border border-border p-2">
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className="text-[0.8125rem] text-muted-foreground">Sélectionner le type</span>
              <Search size={13} strokeWidth={1.6} className="text-muted-foreground" />
              <Input
                value={typeQuery}
                onChange={(e) => setTypeQuery(e.target.value)}
                placeholder="Rechercher…"
                aria-label="Rechercher un type"
                className="ml-auto h-7 w-32 text-[0.78rem]"
              />
            </div>
            <div className="max-h-64 overflow-y-auto pr-1">
              {GROUPS.map((group) => {
                const items = typeList.filter((t) => t.group === group);
                if (items.length === 0) return null;
                return (
                  <div key={group} className="mb-2">
                    <p className="px-1 pb-1 text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">
                      {group}
                    </p>
                    <div className="grid grid-cols-2 gap-0.5">
                      {items.map((t) => {
                        const Icon = PROPERTY_ICONS[t.type];
                        return (
                          <button
                            key={t.type}
                            type="button"
                            disabled={property?.type === "title" && t.type !== "title"}
                            onClick={() => setType(t.type)}
                            className={cn(
                              "press flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-left text-[0.875rem] transition-colors disabled:opacity-40",
                              t.type === type
                                ? "bg-secondary font-medium text-foreground"
                                : "text-muted-foreground hover:bg-secondary/60",
                            )}
                          >
                            <Icon size={15} strokeWidth={1.6} />
                            <span className="truncate">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {["number", "rollup"].includes(type) ? (
            <div className="space-y-1.5">
              <Label>Format des nombres</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as NumberFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain">Nombre brut</SelectItem>
                  <SelectItem value="eur">Devise €</SelectItem>
                  <SelectItem value="usd">Devise $</SelectItem>
                  <SelectItem value="gbp">Devise £</SelectItem>
                  <SelectItem value="percent">Pourcentage %</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {type === "date" ? (
            <div className="space-y-1.5">
              <Label>Type de date</Label>
              <Select value={dateMode} onValueChange={(v) => setDateMode(v as DateMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date simple</SelectItem>
                  <SelectItem value="range">Période (début → fin)</SelectItem>
                  <SelectItem value="datetime">Date et heure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {type === "formula" ? (
            <div className="space-y-1.5">
              <Label htmlFor="prop-formula">Formule</Label>
              <Input
                id="prop-formula"
                ref={formulaRef}
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="{budget} - {depense}"
                className="font-mono text-[0.8125rem]"
              />
              {formulaSuggestions.length > 0 ? (
                <ul className="overflow-hidden rounded-[10px] border border-border">
                  {formulaSuggestions.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => insertToken(p.id)}
                        className="press flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-[0.8125rem] hover:bg-secondary"
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="font-mono text-[0.75rem] text-muted-foreground">
                          {`{${p.id}}`}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[0.75rem] text-muted-foreground">
                  Tapez <span className="font-mono">{"{"}</span> pour insérer une propriété.
                </p>
              )}
            </div>
          ) : null}

          {hasOptions ? (
            <div className="space-y-2">
              <Label>Options</Label>
              {options.map((opt, index) => (
                <div key={opt.id} className="space-y-1.5 rounded-[12px] border border-border p-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[0.75rem]"
                      style={{
                        backgroundColor: colorTokens(opt.color).bg,
                        color: colorTokens(opt.color).fg,
                      }}
                    >
                      {opt.label || "Option"}
                    </span>
                    <Input
                      value={opt.label}
                      onChange={(e) =>
                        setOptions((prev) =>
                          prev.map((o, i) => (i === index ? { ...o, label: e.target.value } : o)),
                        )
                      }
                      className="h-8 flex-1 text-[0.8125rem]"
                    />
                    <button
                      type="button"
                      aria-label="Supprimer l'option"
                      onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                      className="press grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
                    >
                      <X size={14} strokeWidth={1.6} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {OPTION_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        title={c.label}
                        aria-label={c.label}
                        onClick={() =>
                          setOptions((prev) =>
                            prev.map((o, i) =>
                              i === index ? { ...o, color: c.id as OptionColor } : o,
                            ),
                          )
                        }
                        style={{ backgroundColor: c.bg }}
                        className={cn(
                          "press size-5 rounded-full border transition-transform",
                          opt.color === c.id ? "scale-110 border-foreground" : "border-border/60",
                        )}
                      />
                    ))}
                  </div>
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
              onClick={() => setConfirmDelete(true)}
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
                  ...(type === "date" ? { dateMode } : {}),
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

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">
                Supprimer « {property?.name} » ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                La propriété et les valeurs qu'elle contient seront définitivement retirées de
                toutes les vues de cette base.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (property && onDelete) onDelete(property.id);
                  setConfirmDelete(false);
                  onOpenChange(false);
                }}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
