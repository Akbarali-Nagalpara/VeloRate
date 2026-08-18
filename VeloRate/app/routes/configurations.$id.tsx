import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Pencil, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PriceBreakdown } from "@/components/builder/PriceBreakdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ErrorState,
  LoadingRows,
  SectionCard,
  TypeBadge,
} from "@/components/shared/Primitives";
import { deleteConfigurationFn, getConfigurationFn } from "@/lib/pricing.functions";
import { formatINR, todayISO } from "@/lib/pricing/types";

export const Route = createFileRoute("/configurations/$id")({
  head: () => ({
    meta: [
      { title: "Configuration price breakdown — VeloRate" },
      {
        name: "description",
        content:
          "See the component-wise price breakdown of a VeloRate configuration for any calculation date.",
      },
      { property: "og:title", content: "Configuration price breakdown — VeloRate" },
      {
        property: "og:description",
        content: "Component-wise pricing for a VeloRate configuration.",
      },
    ],
  }),
  component: ConfigurationDetailPage,
});

function ConfigurationDetailPage() {
  const { id } = Route.useParams();
  const [asOf, setAsOf] = useState(todayISO());
  const getConfiguration = useServerFn(getConfigurationFn);
  const deleteConfiguration = useServerFn(deleteConfigurationFn);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["configuration", id, asOf],
    queryFn: () => getConfiguration({ data: { id, asOf } }),
    placeholderData: (previous) => previous,
  });

  const remove = useMutation({
    mutationFn: () => deleteConfiguration({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries();
      toast.success("Custom configuration deleted");
      void navigate({ to: "/configurations" });
    },
    onError: (error: Error) => toast.error(error.message.replace(/^[A-Z_]+:\s*/, "")),
  });

  const config = query.data;

  return (
    <AppShell
      eyebrow={config ? config.type : "Configuration"}
      title={config?.name ?? "Configuration"}
      description={config?.description ?? "Component-wise price breakdown for this build."}
      actions={
        config ? (
          <>
            {config.type === "CUSTOM" ? (
              <>
                <Button asChild variant="outline">
                  <Link to="/cycle-builder" search={{ edit: config.id }}>
                    <Pencil className="size-4" /> Edit
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="text-coral"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate()}
                >
                  <Trash2 className="size-4" /> Delete
                </Button>
              </>
            ) : null}
            <Button asChild variant="gold">
              <Link to="/cycle-builder" search={{ from: config.id }}>
                <Wand2 className="size-4" /> Customize
              </Link>
            </Button>
          </>
        ) : null
      }
    >
      {query.isLoading ? <LoadingRows rows={4} height={90} /> : null}
      {query.isError ? <ErrorState message={(query.error as Error).message} /> : null}

      {config ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <SectionCard title="Configuration" subtitle="Definition is stored separately from prices">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Type</dt>
                  <dd className="mt-1">
                    <TypeBadge type={config.type} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Components
                  </dt>
                  <dd className="num mt-1 text-sm font-semibold text-foreground">
                    {config.componentCount} components · {config.partCount} parts
                  </dd>
                </div>
                {config.derivedFromName ? (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Derived from
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground">
                      {config.derivedFromId ? (
                        <Link
                          to="/configurations/$id"
                          params={{ id: config.derivedFromId }}
                          className="text-teal underline-offset-4 hover:underline"
                        >
                          {config.derivedFromName}
                        </Link>
                      ) : (
                        config.derivedFromName
                      )}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Price on {config.breakdown.asOf}
                  </dt>
                  <dd className="num mt-1 font-display text-lg font-semibold text-brand">
                    {formatINR(config.total)}
                  </dd>
                </div>
              </dl>

              {config.type === "PREDEFINED" ? (
                <p className="mt-5 rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand">
                  Predefined configurations are immutable. Choose Customize to create a separate custom
                  configuration from this build.
                </p>
              ) : null}
            </SectionCard>

            <SectionCard title="Price as of" subtitle="The engine resolves the applicable historical prices">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-[180px] space-y-1.5">
                  <Label htmlFor="as-of">Calculation date</Label>
                  <Input
                    id="as-of"
                    type="date"
                    value={asOf}
                    onChange={(event) => setAsOf(event.target.value || todayISO())}
                  />
                </div>
                <Button variant="soft" onClick={() => setAsOf(todayISO())}>
                  Reset to today
                </Button>
              </div>
            </SectionCard>
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <PriceBreakdown breakdown={config.breakdown} />
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
