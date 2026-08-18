import { cn } from "@/lib/utils";
import { formatDate, formatINR, todayISO } from "@/lib/pricing/types";
import type { PriceRecord } from "@/lib/pricing/types";

export function PriceHistoryTimeline({ prices }: { prices: PriceRecord[] }) {
  const today = todayISO();
  const ordered = prices.slice().sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));

  return (
    <ol className="relative space-y-5 border-l border-border pl-6">
      {ordered.map((price, index) => {
        const older = ordered[index + 1];
        const delta = older ? price.price - older.price : 0;
        const isCurrent =
          price.effectiveFrom <= today && (price.effectiveTo === null || price.effectiveTo > today);
        const isFuture = price.effectiveFrom > today;

        return (
          <li key={price.id} className="relative">
            <span
              className={cn(
                "absolute -left-[31px] top-1.5 size-3 rounded-full ring-4 ring-card",
                isCurrent ? "bg-teal" : isFuture ? "bg-gold" : "bg-border",
              )}
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="num font-display text-lg font-semibold text-brand">
                {formatINR(price.price)}
              </span>
              <span className="text-sm text-muted-foreground">
                from {formatDate(price.effectiveFrom)}
                {price.effectiveTo ? ` to ${formatDate(price.effectiveTo)}` : ""}
              </span>
              {isCurrent ? (
                <span className="rounded-md bg-teal-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">
                  Present
                </span>
              ) : null}
              {isFuture ? (
                <span className="rounded-md bg-gold-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-foreground">
                  Scheduled
                </span>
              ) : null}
            </div>
            {older ? (
              <p className="num mt-1 text-xs text-muted-foreground">
                {formatINR(older.price)} → {formatINR(price.price)}{" "}
                <span className={delta > 0 ? "text-coral" : delta < 0 ? "text-teal" : ""}>
                  ({delta > 0 ? "+" : delta < 0 ? "−" : ""}
                  {formatINR(Math.abs(delta))} ·{" "}
                  {older.price ? ((delta / older.price) * 100).toFixed(1) : "0.0"}%)
                </span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">First recorded price</p>
            )}
            {price.note ? <p className="mt-1 text-xs text-muted-foreground">{price.note}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
