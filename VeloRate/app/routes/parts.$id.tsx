import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { AddPriceDialog } from "@/components/parts/AddPriceDialog";
import { PriceHistoryTimeline } from "@/components/parts/PriceHistoryTimeline";
import { Button } from "@/components/ui/button";
import {
  ErrorState,
  LoadingRows,
  PriceDelta,
  SectionCard,
  StatCard,
  StatusBadge,
  TypeBadge,
} from "@/components/shared/Primitives";
import { getPartFn, setPartStatusFn } from "@/lib/pricing.functions";
import { formatDate, formatINR, todayISO } from "@/lib/pricing/types";

export const Route = createFileRoute("/parts/$id")({
  head: () => ({
    meta: [
      { title: "Part price history — VeloRate" },
      {
        name: "description",
        content:
          "Effective-dated price history for a VeloRate part, plus the configurations that use it.",
      },
      { property: "og:title", content: "Part price history — VeloRate" },
      {
        property: "og:description",
        content: "Full price timeline and usage for a single cycle part.",
      },
    ],
  }),
  component: PartDetailPage,
});

function PartDetailPage() {
  const { id } = Route.useParams();
  const asOf = todayISO();
  const getPart = useServerFn(getPartFn);
  const setStatus = useServerFn(setPartStatusFn);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["part", id, asOf],
    queryFn: () => getPart({ data: { id, asOf } }),
  });

  const toggle = useMutation({
    mutationFn: (status: "ACTIVE" | "INACTIVE") => setStatus({ data: { id, status } }),
    onSuccess: (_result, status) => {
      void queryClient.invalidateQueries();
      toast.success(status === "ACTIVE" ? "Part marked active" : "Part marked inactive");
    },
  });

  const part = query.data;
  const delta =
    part && part.currentPrice !== null && part.previousPrice !== null
      ? part.currentPrice - part.previousPrice
      : 0;

  return (
    <AppShell
      eyebrow={part?.category ?? "Part"}
      title={part?.name ?? "Part"}
      description={part?.description ?? "Effective-dated pricing history for this component."}
      actions={
        part ? (
          <>
            <Button
              variant="outline"
              disabled={toggle.isPending}
              onClick={() => toggle.mutate(part.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
            >
              {part.status === "ACTIVE" ? "Mark inactive" : "Mark active"}
            </Button>
            <AddPriceDialog
              partId={part.id}
              partName={part.name}
              currentPrice={part.currentPrice}
            />
          </>
        ) : null
      }
    >
      {query.isLoading ? <LoadingRows rows={4} height={90} /> : null}
      {query.isError ? <ErrorState message={(query.error as Error).message} /> : null}

      {part ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Current price" value={formatINR(part.currentPrice)} tone="teal" />
            <StatCard
              label="Previous price"
              value={formatINR(part.previousPrice)}
              {...(part.previousPrice === null ? { hint: "No earlier price" } : {})}
              tone="grape"
            />
            <StatCard
              label="Used in"
              value={part.usedInConfigurations}
              hint="configurations"
              tone="gold"
            />
            <StatCard
              label="Scheduled change"
              value={part.nextPrice ? formatINR(part.nextPrice.price) : "—"}
              hint={
                part.nextPrice ? `from ${formatDate(part.nextPrice.effectiveFrom)}` : "None planned"
              }
              tone="coral"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={part.status} />
            {delta !== 0 ? <PriceDelta delta={delta} /> : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <SectionCard
              title="Price history"
              subtitle="Each change is effective-dated; older prices stay intact for past quotes"
            >
              <PriceHistoryTimeline prices={part.prices} />
            </SectionCard>

            <SectionCard
              title="Used in configurations"
              subtitle="Where this part contributes to a cycle price"
            >
              {part.configurations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This part isn't part of any configuration yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {part.configurations.map((config) => (
                    <li key={config.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-2">
                        <TypeBadge type={config.type} />
                        <Link
                          to="/configurations/$id"
                          params={{ id: config.id }}
                          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {config.name}
                        </Link>
                      </div>
                      <span className="num text-xs text-muted-foreground">×{config.quantity}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
