import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { AppShell } from "@/components/layout/AppShell";
import { CycleBuilder } from "@/components/builder/CycleBuilder";
import { ErrorState, LoadingRows } from "@/components/shared/Primitives";
import { getConfigurationFn } from "@/lib/pricing.functions";
import { todayISO } from "@/lib/pricing/types";

const searchSchema = z.object({
  from: z.string().uuid().optional(),
  edit: z.string().uuid().optional(),
});

export const Route = createFileRoute("/cycle-builder")({
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Cycle Builder — VeloRate Pricing Workspace" },
      {
        name: "description",
        content:
          "Configure a VeloRate build component by component, change quantities and watch the component-wise price update live.",
      },
      { property: "og:title", content: "Cycle Builder — VeloRate Pricing Workspace" },
      {
        property: "og:description",
        content: "Build or customize a cycle configuration with live component-wise pricing.",
      },
    ],
  }),
  component: CycleBuilderPage,
});

function CycleBuilderPage() {
  const { from, edit } = Route.useSearch();
  const sourceId = edit ?? from;
  const getConfiguration = useServerFn(getConfigurationFn);
  const asOf = todayISO();

  const query = useQuery({
    queryKey: ["configuration", sourceId, asOf],
    queryFn: () => getConfiguration({ data: { id: sourceId!, asOf } }),
    enabled: Boolean(sourceId),
  });

  const source = query.data;

  return (
    <AppShell
      eyebrow="Primary workflow"
      title={
        edit
          ? `Edit ${source?.name ?? "custom configuration"}`
          : from
            ? `Customize ${source?.name ?? "configuration"}`
            : "Build your cycle"
      }
      description={
        from
          ? "Saving creates a separate custom configuration. The predefined original is never modified."
          : "Pick components, set quantities and watch the price build up live."
      }
    >
      {sourceId && query.isLoading ? <LoadingRows rows={5} height={80} /> : null}
      {query.isError ? <ErrorState message={(query.error as Error).message} /> : null}

      {(!sourceId || source) && !query.isLoading ? (
        <CycleBuilder
          {...(edit && source ? { configId: source.id } : {})}
          derivedFromId={
            edit ? (source?.derivedFromId ?? null) : from && source ? source.id : null
          }
          derivedFromName={
            edit ? (source?.derivedFromName ?? null) : from && source ? source.name : null
          }
          initialName={
            edit && source ? source.name : source ? `${source.name} Custom` : "New Custom Cycle"
          }
          initialDescription={source?.description ?? ""}
          initialItems={source?.items ?? []}
          configType={from ? "PREDEFINED" : "CUSTOM"}
        />
      ) : null}
    </AppShell>
  );
}
