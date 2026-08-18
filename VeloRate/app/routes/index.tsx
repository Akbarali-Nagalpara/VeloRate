import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Wand2 } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  AsOfLabel,
  EmptyState,
  ErrorState,
  LoadingRows,
  PriceDelta,
  SectionCard,
  StatCard,
  TypeBadge,
} from "@/components/shared/Primitives";
import { getDashboardFn } from "@/lib/pricing.functions";
import { formatDate, formatINR, todayISO } from "@/lib/pricing/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pricing Pulse — VeloRate Sales Pricing Workspace" },
      {
        name: "description",
        content:
          "Track part price changes, affected cycle configurations and live component-wise pricing for VeloRate sales teams.",
      },
      { property: "og:title", content: "Pricing Pulse — VeloRate Pricing Workspace" },
      {
        property: "og:description",
        content: "Parts, price history and live cycle pricing in one sales workspace.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const asOf = todayISO();
  const getDashboard = useServerFn(getDashboardFn);
  const query = useQuery({
    queryKey: ["dashboard", asOf],
    queryFn: () => getDashboard({ data: { asOf } }),
  });

  return (
    <AppShell
      eyebrow="Pricing pulse"
      title="Today's pricing position"
      description="Parts → price change → pricing engine → price impact → cycle price."
      actions={
        <Button asChild variant="gold">
          <Link to="/cycle-builder">
            <Wand2 className="size-4" /> Open Cycle Builder
          </Link>
        </Button>
      }
    >
      {query.isLoading ? <LoadingRows rows={4} height={96} /> : null}
      {query.isError ? <ErrorState message={(query.error as Error).message} /> : null}

      {query.data ? (
        <div className="space-y-6">
          <AsOfLabel asOf={asOf} />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total parts"
              value={query.data.totals.parts}
              hint={`${query.data.totals.activeParts} active`}
              tone="teal"
            />
            <StatCard
              label="Configurations"
              value={query.data.totals.configurations}
              hint={`${query.data.totals.predefined} predefined · ${query.data.totals.custom} custom`}
              tone="gold"
            />
            <StatCard
              label="Price changes"
              value={query.data.totals.priceChanges}
              hint="Recorded across all parts"
              tone="grape"
            />
            <StatCard
              label="Affected configs"
              value={query.data.totals.affectedConfigurations}
              hint="Impacted by recent changes"
              tone="coral"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <SectionCard
              title="Recent price changes"
              subtitle="Effective-dated part price movements, newest first"
              actions={
                <Button asChild variant="ghost" size="sm" className="text-teal">
                  <Link to="/price-history">Price history</Link>
                </Button>
              }
            >
              {query.data.recentChanges.length === 0 ? (
                <EmptyState
                  title="No price changes yet"
                  description="Add a new price to a part to start building its history."
                  action={
                    <Button asChild variant="gold">
                      <Link to="/parts">Open Parts Library</Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {query.data.recentChanges.map((change) => (
                    <li
                      key={`${change.partId}-${change.effectiveFrom}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <Link
                          to="/parts/$id"
                          params={{ id: change.partId }}
                          className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                        >
                          {change.partName}
                        </Link>
                        <p className="num text-xs text-muted-foreground">
                          {formatINR(change.oldPrice)} → {formatINR(change.newPrice)} ·{" "}
                          {formatDate(change.effectiveFrom)}
                          {change.isFuture ? " (scheduled)" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <PriceDelta delta={change.delta} />
                        <Link
                          to="/price-impact"
                          search={{ partId: change.partId, effectiveFrom: change.effectiveFrom }}
                          className="text-xs font-medium text-teal underline-offset-4 hover:underline"
                        >
                          Impact
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title="Top price increases"
              subtitle="Largest per-unit increases on record"
            >
              {query.data.topIncreases.length === 0 ? (
                <p className="text-sm text-muted-foreground">No increases recorded.</p>
              ) : (
                <ul className="space-y-3">
                  {query.data.topIncreases.map((change) => (
                    <li
                      key={`${change.partId}-${change.effectiveFrom}`}
                      className="flex items-center justify-between gap-3 rounded-lg bg-coral-soft/60 px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{change.partName}</p>
                        <p className="num text-xs text-muted-foreground">
                          {change.affectedConfigurations} configurations affected
                        </p>
                      </div>
                      <PriceDelta delta={change.delta} />
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Recent configurations"
            subtitle="Latest predefined and custom builds"
            actions={
              <Button asChild variant="ghost" size="sm" className="text-teal">
                <Link to="/configurations">
                  All configurations <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          >
            <ul className="divide-y divide-border">
              {query.data.recentConfigurations.map((config) => (
                <li key={config.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <TypeBadge type={config.type} />
                    <Link
                      to="/configurations/$id"
                      params={{ id: config.id }}
                      className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                    >
                      {config.name}
                    </Link>
                  </div>
                  <div className="num text-right text-sm">
                    <span className="font-semibold text-brand">{formatINR(config.total)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {config.componentCount} components
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      ) : null}
    </AppShell>
  );
}
