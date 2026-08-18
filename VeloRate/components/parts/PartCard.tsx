import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { PriceDelta, StatusBadge } from "@/components/shared/Primitives";
import { formatDate, formatINR } from "@/lib/pricing/types";
import type { PartSummary } from "@/lib/pricing/types";

export function PartCard({ part }: { part: PartSummary }) {
  const delta =
    part.previousPrice !== null && part.currentPrice !== null
      ? part.currentPrice - part.previousPrice
      : 0;

  return (
    <article className="surface-card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">
            {part.category}
          </p>
          <h3 className="truncate font-display text-base font-semibold text-brand">{part.name}</h3>
        </div>
        <StatusBadge status={part.status} />
      </div>

      <div>
        <p className="num font-display text-2xl font-semibold text-foreground">
          {formatINR(part.currentPrice)}
        </p>
        {delta !== 0 ? (
          <div className="mt-2">
            <PriceDelta delta={delta} />
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">No recent change</p>
        )}
      </div>

      {part.nextPrice ? (
        <p className="rounded-lg bg-gold-soft px-3 py-2 text-xs text-gold-foreground">
          Scheduled: {formatINR(part.nextPrice.price)} from {formatDate(part.nextPrice.effectiveFrom)}
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Used in <span className="font-semibold text-foreground">{part.usedInConfigurations}</span>{" "}
        configurations
      </p>

      <Button asChild variant="soft" className="mt-auto w-full">
        <Link to="/parts/$id" params={{ id: part.id }}>
          View Details
        </Link>
      </Button>
    </article>
  );
}
