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
    <div className="flex rounded-full border border-border bg-muted/70 p-0.5 dark:bg-white/10">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs transition-colors",
            value === opt.value
              ? "bg-card font-medium text-foreground shadow-sm dark:bg-white/22"
              : "text-muted-foreground hover:text-foreground dark:hover:bg-white/8",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
