import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { AppShell } from "@/components/layout/AppShell";
import { PriceImpactSummary, PriceImpactTable } from "@/components/impact/PriceImpactView";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingRows } from "@/components/shared/Primitives";
import { getPriceImpactFn } from "@/lib/pricing.functions";
import { todayISO } from "@/lib/pricing/types";

const searchSchema = z.object({
  partId: z.string().uuid().optional(),
  effectiveFrom: z.string().optional(),
});

export const Route = createFileRoute("/price-impact")({
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Price Impact — VeloRate Pricing Workspace" },
      {
        name: "description",
        content:
          "See exactly which cycle configurations a part price change affects, and how much each build's price moves.",
      },
      { property: "og:title", content: "Price Impact — VeloRate Pricing Workspace" },
      {
        property: "og:description",
        content: "Trace a single part price change to every affected cycle configuration.",
      },
    ],
  }),
  component: PriceImpactPage,
});

function PriceImpactPage() {
  const { partId, effectiveFrom } = Route.useSearch();
  const asOf = todayISO();
  const getPriceImpact = useServerFn(getPriceImpactFn);

  const query = useQuery({
    queryKey: ["price-impact", partId, effectiveFrom, asOf],
    queryFn: () =>
      getPriceImpact({
        data: {
          asOf,
          ...(partId ? { partId } : {}),
          ...(effectiveFrom ? { effectiveFrom } : {}),
        },
      }),
  });

  return (
    <AppShell
      eyebrow="Signature view"
      title="Price impact"
      description="One part price change, traced through the pricing engine to every cycle it touches."
      actions={
        <Button asChild variant="outline">
          <Link to="/price-history">Pick another change</Link>
        </Button>
      }
    >
      {query.isLoading ? <LoadingRows rows={4} height={96} /> : null}
      {query.isError ? <ErrorState message={(query.error as Error).message} /> : null}

      {query.data === null ? (
        <EmptyState
          title="No price change to analyse yet"
          description="Add a new effective-dated price to a part and the impact will show up here."
          action={
            <Button asChild variant="gold">
              <Link to="/parts">Open Parts Library</Link>
            </Button>
          }
        />
      ) : null}

      {query.data ? (
        <div className="space-y-6">
          <PriceImpactSummary result={query.data} />
          <PriceImpactTable result={query.data} />
        </div>
      ) : null}
    </AppShell>
  );
}
