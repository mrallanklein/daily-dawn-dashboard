import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  deleteCalendarEvent,
  listCalendars,
  saveCalendarEvent,
  type CalendarEvent,
} from "@/lib/agenda.functions";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type EventDraft = { date: Date; event?: CalendarEvent };

export function EventDialog({
  draft,
  onClose,
}: {
  draft: EventDraft | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const fetchCalendars = useServerFn(listCalendars);
  const save = useServerFn(saveCalendarEvent);
  const remove = useServerFn(deleteCalendarEvent);

  const { data: calendars } = useQuery({
    queryKey: ["calendar-sources"],
    staleTime: 30 * 60 * 1000,
    retry: false,
    queryFn: () => fetchCalendars(),
  });
  const writable = (calendars ?? []).filter((c) => c.writable);

  const [target, setTarget] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [day, setDay] = useState("");
  const [endDay, setEndDay] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  useEffect(() => {
    if (!draft) return;
    const ev = draft.event;
    setTitle(ev?.title ?? "");
    setLocation(ev?.location ?? "");
    setDescription(ev?.description ?? "");
    setAllDay(ev?.allDay ?? false);
    setDay(format(ev ? new Date(ev.start) : draft.date, "yyyy-MM-dd"));
    setEndDay(
      format(ev?.end ? new Date(ev.end) : ev ? new Date(ev.start) : draft.date, "yyyy-MM-dd"),
    );
    setStartTime(ev && !ev.allDay ? format(new Date(ev.start), "HH:mm") : "09:00");
    setEndTime(ev?.end && !ev.allDay ? format(new Date(ev.end), "HH:mm") : "10:00");
    setTarget(ev ? `${ev.accountKey}::${ev.calendarId}` : "");
  }, [draft]);

  useEffect(() => {
    if (!target && writable[0]) setTarget(`${writable[0].accountKey}::${writable[0].calendarId}`);
  }, [writable, target]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["calendar"] });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const [accountKey, calendarId] = target.split("::");
      if (!accountKey || !calendarId) throw new Error("Choisissez un agenda");
      const last = endDay && endDay >= day ? endDay : day;
      const start = allDay ? day : new Date(`${day}T${startTime}`).toISOString();
      // Google attend une date de fin exclusive pour les évènements « journée entière ».
      const end = allDay
        ? format(new Date(new Date(`${last}T00:00`).getTime() + 86400000), "yyyy-MM-dd")
        : new Date(`${last}T${endTime}`).toISOString();
      await save({
        data: {
          accountKey,
          calendarId,
          eventId: draft?.event?.id,
          title,
          description,
          location,
          allDay,
          start,
          end,
        },
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success(draft?.event ? "Évènement mis à jour" : "Évènement créé");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removal = useMutation({
    mutationFn: async () => {
      const ev = draft?.event;
      if (!ev) return;
      await remove({
        data: { accountKey: ev.accountKey, calendarId: ev.calendarId, eventId: ev.id },
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Évènement supprimé");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={Boolean(draft)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{draft?.event ? "Modifier l'évènement" : "Nouvel évènement"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ev-title">Titre</Label>
            <Input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tournage séquence 4"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label htmlFor="ev-allday" className="text-sm font-normal">
              Journée entière
            </Label>
            <Switch id="ev-allday" checked={allDay} onCheckedChange={setAllDay} />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="ev-day">Début</Label>
              <Input
                id="ev-day"
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-endday">Fin</Label>
              <Input
                id="ev-endday"
                type="date"
                min={day}
                value={endDay}
                onChange={(e) => setEndDay(e.target.value)}
              />
            </div>
            {!allDay ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="ev-start">Heure début</Label>
                  <Input
                    id="ev-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ev-end">Heure fin</Label>
                  <Input
                    id="ev-end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Agenda</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un agenda" />
              </SelectTrigger>
              <SelectContent>
                {writable.map((c) => (
                  <SelectItem
                    key={`${c.accountKey}::${c.calendarId}`}
                    value={`${c.accountKey}::${c.calendarId}`}
                  >
                    {c.name}
                    {c.accountEmail ? ` — ${c.accountEmail}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-loc">Lieu</Label>
            <Input id="ev-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-desc">Notes</Label>
            <Textarea
              id="ev-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {draft?.event ? (
            <Button
              variant="ghost"
              onClick={() => removal.mutate()}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1.5 size-4" /> Supprimer
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !title.trim()}>
              Enregistrer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
