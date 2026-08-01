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
    <div className="flex rounded-full border border-border/80 bg-secondary/50 p-0.5">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-3 py-1 text-xs transition-colors",
            value === opt.value
              ? "bg-gold text-gold-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}