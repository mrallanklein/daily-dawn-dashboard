import { RANGE_OPTIONS, type RangeDays } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function RangeToggle({
  value,
  onChange,
}: {
  value: RangeDays;
  onChange: (v: RangeDays) => void;
}) {
  return (
    <div className="flex rounded-full border border-border bg-muted/60 p-0.5">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs transition-colors",
            value === opt.value
              ? "bg-background font-medium text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
