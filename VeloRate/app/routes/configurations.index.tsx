import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Search } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { ConfigurationCard } from "@/components/configurations/ConfigurationCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AsOfLabel, EmptyState, ErrorState, LoadingRows } from "@/components/shared/Primitives";
import { listConfigurationsFn } from "@/lib/pricing.functions";
import { todayISO } from "@/lib/pricing/types";
import type { ConfigurationType } from "@/lib/pricing/types";

export const Route = createFileRoute("/configurations/")({
  head: () => ({
    meta: [
      { title: "Configurations — VeloRate Pricing Workspace" },
      {
        name: "description",
        content:
          "Browse predefined VeloRate configurations and custom builds with their current component-wise price.",
      },
      { property: "og:title", content: "Configurations — VeloRate Pricing Workspace" },
      {
        property: "og:description",
        content: "Predefined and custom cycle configurations with live pricing.",
      },
    ],
  }),
  component: ConfigurationsPage,
});

function ConfigurationsPage() {
  const [type, setType] = useState<ConfigurationType | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [asOf, setAsOf] = useState(todayISO());
  const listConfigurations = useServerFn(listConfigurationsFn);

  const query = useQuery({
    queryKey: ["configurations", asOf, type, search],
    queryFn: () => listConfigurations({ data: { asOf, type, search } }),
    placeholderData: (previous) => previous,
  });

  return (
    <AppShell
      eyebrow="Catalogue"
      title="Configurations"
      description="Predefined VeloRate builds stay immutable. Customizing one always creates a separate custom configuration."
      actions={
        <Button asChild variant="gold">
          <Link to="/cycle-builder">
            <Plus className="size-4" /> New configuration
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search configurations"
              className="pl-9"
              aria-label="Search configurations"
            />
          </div>
          <Tabs value={type} onValueChange={(value) => setType(value as ConfigurationType | "ALL")}>
            <TabsList>
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="PREDEFINED">Predefined</TabsTrigger>
              <TabsTrigger value="CUSTOM">Custom</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="w-[168px]">
            <Input
              type="date"
              value={asOf}
              aria-label="Price as of date"
              onChange={(event) => setAsOf(event.target.value || todayISO())}
            />
          </div>
        </div>

        <AsOfLabel asOf={asOf} />

        {query.isLoading ? <LoadingRows rows={3} height={180} /> : null}
        {query.isError ? <ErrorState message={(query.error as Error).message} /> : null}

        {query.data && query.data.length === 0 ? (
          <EmptyState
            title="No configurations match"
            description="Adjust the filters, or start a fresh build in the Cycle Builder."
            action={
              <Button asChild variant="gold">
                <Link to="/cycle-builder">Open Cycle Builder</Link>
              </Button>
            }
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(query.data ?? []).map((config) => (
            <ConfigurationCard key={config.id} config={config} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
