import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function QuantityStepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  label: string;
}) {
  const clamp = (next: number) => Math.min(99, Math.max(1, next));

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-md"
        aria-label={`Decrease quantity of ${label}`}
        disabled={value <= 1}
        onClick={() => onChange(clamp(value - 1))}
      >
        <Minus className="size-3.5" />
      </Button>
      <Input
        aria-label={`Quantity of ${label}`}
        className="num h-7 w-11 border-0 bg-transparent px-0 text-center text-sm font-semibold shadow-none focus-visible:ring-0"
        value={value}
        inputMode="numeric"
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value.replace(/\D/g, ""), 10);
          onChange(Number.isNaN(parsed) ? 1 : clamp(parsed));
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-md"
        aria-label={`Increase quantity of ${label}`}
        disabled={value >= 99}
        onClick={() => onChange(clamp(value + 1))}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
