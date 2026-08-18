import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { QuantityStepper } from "./QuantityStepper";
import { ComponentSelector } from "./ComponentSelector";
import { PriceBreakdown } from "./PriceBreakdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, LoadingRows, TypeBadge } from "@/components/shared/Primitives";
import { calculateBreakdownFn, listPartsFn, saveConfigurationFn } from "@/lib/pricing.functions";
import { formatINR, todayISO } from "@/lib/pricing/types";
import type { Breakdown, ConfigurationType } from "@/lib/pricing/types";

export interface BuilderItem {
  partId: string;
  quantity: number;
}

export function CycleBuilder({
  configId,
  derivedFromId,
  derivedFromName,
  initialName,
  initialDescription,
  initialItems,
  configType = "CUSTOM",
}: {
  configId?: string;
  derivedFromId?: string | null;
  derivedFromName?: string | null;
  initialName: string;
  initialDescription?: string;
  initialItems: BuilderItem[];
  configType?: ConfigurationType;
}) {
  const navigate = useNavigate();
  const listParts = useServerFn(listPartsFn);
  const calculate = useServerFn(calculateBreakdownFn);
  const saveConfiguration = useServerFn(saveConfigurationFn);

  const [asOf, setAsOf] = useState(todayISO());
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [items, setItems] = useState<BuilderItem[]>(initialItems);

  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription ?? "");
    setItems(initialItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configId, derivedFromId, initialName]);

  const partsQuery = useQuery({
    queryKey: ["parts", asOf, "builder"],
    queryFn: () => listParts({ data: { asOf, status: "ALL" } }),
  });

  const breakdownQuery = useQuery({
    queryKey: ["breakdown", asOf, items],
    queryFn: () => calculate({ data: { items, asOf } }),
    placeholderData: (previous) => previous,
  });

  const parts = partsQuery.data?.parts ?? [];
  const partById = useMemo(() => new Map(parts.map((part) => [part.id, part])), [parts]);

  const breakdown: Breakdown =
    breakdownQuery.data ??
    ({ asOf, lines: [], total: 0, componentCount: 0, partCount: 0, missing: [] } satisfies Breakdown);

  const save = useMutation({
    mutationFn: () =>
      saveConfiguration({
        data: {
          ...(configId ? { id: configId } : {}),
          name: name.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
          type: "CUSTOM" as ConfigurationType,
          derivedFromId: derivedFromId ?? null,
          items,
        },
      }),
    onSuccess: (result) => {
      toast.success("Configuration saved", {
        description: `${name.trim()} · ${formatINR(breakdown.total)}`,
      });
      navigate({ to: "/configurations/$id", params: { id: result.id } });
    },
    onError: (error: Error) => toast.error(error.message.replace(/^[A-Z_]+:\s*/, "")),
  });

  const canSave = name.trim().length >= 2 && items.length > 0 && breakdown.missing.length === 0;

  return (
    <div className="space-y-6 pb-28 lg:pb-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="surface-card p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">
                  Build your cycle
                </p>
                <h2 className="font-display text-lg font-semibold text-brand">
                  Configuration identity
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <TypeBadge type="CUSTOM" />
                {derivedFromName ? (
                  <span className="text-xs text-muted-foreground">
                    derived from <span className="font-medium text-foreground">{derivedFromName}</span>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="config-name">Configuration name</Label>
                <Input
                  id="config-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Mountain Pro Custom"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="config-date">Calculation date</Label>
                <Input
                  id="config-date"
                  type="date"
                  value={asOf}
                  onChange={(event) => setAsOf(event.target.value || todayISO())}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="config-notes">Notes for the customer (optional)</Label>
                <Textarea
                  id="config-notes"
                  rows={2}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What makes this build different"
                />
              </div>
            </div>
          </section>

          <section className="surface-card p-5 sm:p-6">
            <header className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-semibold text-brand">Components</h2>
              <span className="num text-xs text-muted-foreground">
                {breakdown.componentCount} components · {breakdown.partCount} parts
              </span>
            </header>

            {partsQuery.isLoading ? <LoadingRows rows={4} /> : null}
            {partsQuery.isError ? <ErrorState message={(partsQuery.error as Error).message} /> : null}

            {!partsQuery.isLoading && items.length === 0 ? (
              <EmptyState
                title="No components yet"
                description="Add a frame, gear set, tyres and brakes to see the live price build up."
              />
            ) : null}

            <div className="space-y-3">
              {items.map((item) => {
                const part = partById.get(item.partId);
                const line = breakdown.lines.find((entry) => entry.partId === item.partId);
                return (
                  <div
                    key={item.partId}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3"
                  >
                    <div className="min-w-[160px] flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {part?.category ?? line?.category ?? "Component"}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {part?.name ?? line?.name ?? "Unknown part"}
                      </p>
                    </div>

                    <QuantityStepper
                      label={part?.name ?? "component"}
                      value={item.quantity}
                      onChange={(quantity) =>
                        setItems((current) =>
                          current.map((entry) =>
                            entry.partId === item.partId ? { ...entry, quantity } : entry,
                          ),
                        )
                      }
                    />

                    <div className="num min-w-[150px] text-right text-sm">
                      <span className="text-muted-foreground">
                        {formatINR(line?.unitPrice ?? part?.currentPrice ?? null)} × {item.quantity} ={" "}
                      </span>
                      <span className="font-semibold text-brand">
                        {line?.missingPrice ? "—" : formatINR(line?.lineTotal ?? null)}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${part?.name ?? "component"}`}
                      className="text-muted-foreground hover:text-coral"
                      onClick={() =>
                        setItems((current) => current.filter((entry) => entry.partId !== item.partId))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              <ComponentSelector
                parts={parts}
                selectedIds={items.map((item) => item.partId)}
                onAdd={(partId) => setItems((current) => [...current, { partId, quantity: 1 }])}
              />
            </div>
          </section>
        </div>

        <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <PriceBreakdown breakdown={breakdown} />
          <Button
            variant="gold"
            size="lg"
            className="hidden w-full lg:inline-flex"
            disabled={!canSave || save.isPending}
            onClick={() => save.mutate()}
          >
            <Save className="size-4" /> Save Configuration
          </Button>
          {configType === "PREDEFINED" ? (
            <p className="text-xs text-muted-foreground">
              Saving creates a new custom configuration. The predefined original stays unchanged.
            </p>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-5 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="num text-xs text-muted-foreground">
              {breakdown.componentCount} components · {breakdown.partCount} parts
            </p>
            <p className="num font-display text-xl font-semibold text-brand">
              {formatINR(breakdown.total)}
            </p>
          </div>
          <Button variant="gold" disabled={!canSave || save.isPending} onClick={() => save.mutate()}>
            <Save className="size-4" /> Save
          </Button>
        </div>
      </div>
    </div>
  );
}
