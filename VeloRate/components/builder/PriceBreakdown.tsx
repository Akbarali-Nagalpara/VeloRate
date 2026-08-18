import { cn } from "@/lib/utils";
import { formatDate, formatINR } from "@/lib/pricing/types";
import type { Breakdown } from "@/lib/pricing/types";

export function PriceBreakdown({
  breakdown,
  className,
  compact = false,
}: {
  breakdown: Breakdown;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      <div className="border-b border-border bg-brand px-5 py-4 text-brand-foreground">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-foreground/70">
          Price breakdown
        </p>
        <p className="num mt-1 font-display text-2xl font-semibold">{formatINR(breakdown.total)}</p>
        <p className="mt-1 text-xs text-brand-foreground/70">
          Calculated as of {formatDate(breakdown.asOf)}
        </p>
      </div>

      <div className="px-5 py-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="pb-2 font-semibold">Component</th>
              <th className="pb-2 text-center font-semibold">Qty</th>
              {!compact ? <th className="pb-2 text-right font-semibold">Unit</th> : null}
              <th className="pb-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {breakdown.lines.map((line) => (
              <tr key={line.partId} className={line.missingPrice ? "bg-coral-soft/60" : undefined}>
                <td className="py-2.5 pr-2">
                  <span className="block font-medium text-foreground">{line.name}</span>
                  <span className="block text-xs text-muted-foreground">{line.category}</span>
                </td>
                <td className="num py-2.5 text-center text-muted-foreground">{line.quantity}</td>
                {!compact ? (
                  <td className="num py-2.5 text-right text-muted-foreground">
                    {formatINR(line.unitPrice)}
                  </td>
                ) : null}
                <td className="num py-2.5 text-right font-semibold text-foreground">
                  {line.missingPrice ? "Missing price" : formatINR(line.lineTotal)}
                </td>
              </tr>
            ))}
            {breakdown.lines.length === 0 ? (
              <tr>
                <td colSpan={compact ? 3 : 4} className="py-6 text-center text-muted-foreground">
                  No components selected yet.
                </td>
              </tr>
            ) : null}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-brand/20">
              <td className="pt-3 font-display font-semibold text-brand" colSpan={compact ? 2 : 3}>
                Total
              </td>
              <td className="num pt-3 text-right font-display text-lg font-semibold text-brand">
                {formatINR(breakdown.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        {breakdown.missing.length ? (
          <p className="mt-4 rounded-lg bg-coral-soft px-3 py-2 text-xs text-coral">
            No price is defined on {formatDate(breakdown.asOf)} for: {breakdown.missing.join(", ")}.
            Add a price effective on or before this date.
          </p>
        ) : null}
      </div>
    </div>
  );
}
