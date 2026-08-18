import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { LayoutGrid, List, Search } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { AddPartDialog } from "@/components/parts/AddPartDialog";
import { PartCard } from "@/components/parts/PartCard";
import { PartTable } from "@/components/parts/PartTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AsOfLabel, EmptyState, ErrorState, LoadingRows } from "@/components/shared/Primitives";
import { listPartsFn } from "@/lib/pricing.functions";
import { todayISO } from "@/lib/pricing/types";

export const Route = createFileRoute("/parts/")({
  head: () => ({
    meta: [
      { title: "Parts Library — VeloRate Pricing Workspace" },
      {
        name: "description",
        content:
          "Manage VeloRate parts, their categories, availability and current effective-dated unit prices.",
      },
      { property: "og:title", content: "Parts Library — VeloRate Pricing Workspace" },
      {
        property: "og:description",
        content: "Every cycle part with its live price and usage across configurations.",
      },
    ],
  }),
  component: PartsPage,
});

function PartsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ALL");
  const [category, setCategory] = useState("ALL");
  const [view, setView] = useState<"grid" | "table">("table");
  const asOf = todayISO();

  const listParts = useServerFn(listPartsFn);
  const query = useQuery({
    queryKey: ["parts", asOf, search, status, category],
    queryFn: () =>
      listParts({
        data: {
          asOf,
          status,
          ...(search ? { search } : {}),
          ...(category !== "ALL" ? { category } : {}),
        },
      }),
    placeholderData: (previous) => previous,
  });

  const parts = query.data?.parts ?? [];
  const categories = useMemo(() => query.data?.categories ?? [], [query.data]);

  return (
    <AppShell
      eyebrow="Master data"
      title="Parts library"
      description="Every part carries an effective-dated price history — the pricing engine never overwrites the past."
      actions={<AddPartDialog categories={categories} />}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search parts by name or category"
              className="pl-9"
              aria-label="Search parts"
            />
          </div>

          <Tabs value={status} onValueChange={(value) => setStatus(value as typeof status)}>
            <TabsList>
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="ACTIVE">Active</TabsTrigger>
              <TabsTrigger value="INACTIVE">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-1 rounded-lg border border-border p-1">
            <Button
              variant={view === "table" ? "soft" : "ghost"}
              size="sm"
              onClick={() => setView("table")}
              aria-label="Table view"
            >
              <List className="size-4" />
            </Button>
            <Button
              variant={view === "grid" ? "soft" : "ghost"}
              size="sm"
              onClick={() => setView("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategory("ALL")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              category === "ALL"
                ? "bg-brand text-brand-foreground"
                : "bg-muted text-muted-foreground hover:bg-teal-soft"
            }`}
          >
            All categories
          </button>
          {categories.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCategory(option)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                category === option
                  ? "bg-brand text-brand-foreground"
                  : "bg-muted text-muted-foreground hover:bg-teal-soft"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <AsOfLabel asOf={asOf} />

        {query.isLoading ? <LoadingRows rows={5} height={64} /> : null}
        {query.isError ? <ErrorState message={(query.error as Error).message} /> : null}

        {query.data && parts.length === 0 ? (
          <EmptyState
            title="No parts match your filters"
            description="Try a different category or search term."
          />
        ) : null}

        {parts.length > 0 ? (
          view === "table" ? (
            <PartTable parts={parts} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {parts.map((part) => (
                <PartCard key={part.id} part={part} />
              ))}
            </div>
          )
        ) : null}
      </div>
    </AppShell>
  );
}
