import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AppShell } from "@/components/layout/AppShell";
import {
  AsOfLabel,
  EmptyState,
  ErrorState,
  LoadingRows,
  PriceDelta,
  SectionCard,
} from "@/components/shared/Primitives";
import { Button } from "@/components/ui/button";
import { listPriceChangesFn } from "@/lib/pricing.functions";
import { formatDate, formatINR, todayISO } from "@/lib/pricing/types";

export const Route = createFileRoute("/price-history")({
  head: () => ({
    meta: [
      { title: "Price History — VeloRate Pricing Workspace" },
      {
        name: "description",
        content:
          "Every effective-dated part price change across the VeloRate catalogue, newest first, with configuration impact.",
      },
      { property: "og:title", content: "Price History — VeloRate Pricing Workspace" },
      {
        property: "og:description",
        content: "A complete, auditable log of part price changes over time.",
      },
    ],
  }),
  component: PriceHistoryPage,
});

function PriceHistoryPage() {
  const asOf = todayISO();
  const listPriceChanges = useServerFn(listPriceChangesFn);
  const query = useQuery({
    queryKey: ["price-changes", asOf],
    queryFn: () => listPriceChanges({ data: { asOf } }),
  });

  return (
    <AppShell
      eyebrow="Audit trail"
      title="Price history"
      description="Historical prices are never overwritten — quotes from any date can always be reproduced."
    >
      <div className="space-y-6">
        <AsOfLabel asOf={asOf} />

        {query.isLoading ? <LoadingRows rows={6} height={56} /> : null}
        {query.isError ? <ErrorState message={(query.error as Error).message} /> : null}

        {query.data && query.data.length === 0 ? (
          <EmptyState
            title="No price changes recorded"
            description="Add a second price to any part to start its history."
            action={
              <Button asChild variant="gold">
                <Link to="/parts">Open Parts Library</Link>
              </Button>
            }
          />
        ) : null}

        {query.data && query.data.length > 0 ? (
          <SectionCard title="All price changes" subtitle={`${query.data.length} recorded changes`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Effective from</th>
                    <th className="py-2 pr-4 font-medium">Part</th>
                    <th className="py-2 pr-4 font-medium">Category</th>
                    <th className="py-2 pr-4 text-right font-medium">Old</th>
                    <th className="py-2 pr-4 text-right font-medium">New</th>
                    <th className="py-2 pr-4 text-right font-medium">Change</th>
                    <th className="py-2 pr-4 text-right font-medium">Configs</th>
                    <th className="py-2 text-right font-medium">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {query.data.map((change) => (
                    <tr key={`${change.partId}-${change.effectiveFrom}`} className="hover:bg-muted/50">
                      <td className="num py-3 pr-4 whitespace-nowrap text-muted-foreground">
                        {formatDate(change.effectiveFrom)}
                        {change.isFuture ? (
                          <span className="ml-2 rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-semibold text-gold-strong">
                            Scheduled
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          to="/parts/$id"
                          params={{ id: change.partId }}
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {change.partName}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{change.category}</td>
                      <td className="num py-3 pr-4 text-right text-muted-foreground">
                        {formatINR(change.oldPrice)}
                      </td>
                      <td className="num py-3 pr-4 text-right font-semibold text-foreground">
                        {formatINR(change.newPrice)}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <PriceDelta delta={change.delta} />
                      </td>
                      <td className="num py-3 pr-4 text-right text-muted-foreground">
                        {change.affectedConfigurations}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to="/price-impact"
                          search={{ partId: change.partId, effectiveFrom: change.effectiveFrom }}
                          className="text-xs font-medium text-teal underline-offset-4 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        ) : null}
      </div>
    </AppShell>
  );
}
