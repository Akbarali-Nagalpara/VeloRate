import { supabaseAdmin } from "@/integrations/supabase/client.server";

import type {
  Breakdown,
  BreakdownLine,
  ConfigurationDetail,
  ConfigurationSummary,
  ConfigurationType,
  DashboardData,
  ImpactedConfiguration,
  PartDetail,
  PartStatus,
  PartSummary,
  PriceChangeEvent,
  PriceImpactResult,
  PriceRecord,
} from "./types";

/* ------------------------------------------------------------------ */
/* Raw loading                                                         */
/* ------------------------------------------------------------------ */

interface RawPart {
  id: string;
  name: string;
  category: string;
  description: string | null;
  status: PartStatus;
}
interface RawConfig {
  id: string;
  name: string;
  description: string | null;
  type: ConfigurationType;
  derived_from_id: string | null;
  created_at: string;
}
interface RawItem {
  configuration_id: string;
  part_id: string;
  quantity: number;
}

interface Dataset {
  parts: RawPart[];
  partById: Map<string, RawPart>;
  pricesByPart: Map<string, PriceRecord[]>;
  configs: RawConfig[];
  itemsByConfig: Map<string, RawItem[]>;
}

function fail(message: string): never {
  throw new Error(message);
}

async function loadDataset(): Promise<Dataset> {
  const [partsRes, pricesRes, configsRes, itemsRes] = await Promise.all([
    supabaseAdmin.from("parts").select("id,name,category,description,status").order("name"),
    supabaseAdmin
      .from("part_prices")
      .select("id,part_id,price,effective_from,effective_to,note")
      .order("effective_from"),
    supabaseAdmin
      .from("configurations")
      .select("id,name,description,type,derived_from_id,created_at")
      .order("created_at"),
    supabaseAdmin.from("configuration_items").select("configuration_id,part_id,quantity"),
  ]);

  if (partsRes.error) fail(partsRes.error.message);
  if (pricesRes.error) fail(pricesRes.error.message);
  if (configsRes.error) fail(configsRes.error.message);
  if (itemsRes.error) fail(itemsRes.error.message);

  const parts = (partsRes.data ?? []) as RawPart[];
  const partById = new Map(parts.map((p) => [p.id, p]));

  const pricesByPart = new Map<string, PriceRecord[]>();
  for (const row of pricesRes.data ?? []) {
    const list = pricesByPart.get(row.part_id) ?? [];
    list.push({
      id: row.id,
      price: Number(row.price),
      effectiveFrom: row.effective_from,
      effectiveTo: row.effective_to,
      note: row.note,
    });
    pricesByPart.set(row.part_id, list);
  }
  for (const list of pricesByPart.values()) {
    list.sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  }

  const configs = (configsRes.data ?? []) as RawConfig[];
  const itemsByConfig = new Map<string, RawItem[]>();
  for (const row of (itemsRes.data ?? []) as RawItem[]) {
    const list = itemsByConfig.get(row.configuration_id) ?? [];
    list.push(row);
    itemsByConfig.set(row.configuration_id, list);
  }

  return { parts, partById, pricesByPart, configs, itemsByConfig };
}

/* ------------------------------------------------------------------ */
/* Effective-dated price resolution                                    */
/* ------------------------------------------------------------------ */

function priceAt(prices: PriceRecord[] | undefined, asOf: string): PriceRecord | null {
  if (!prices) return null;
  for (const p of prices) {
    if (p.effectiveFrom <= asOf && (p.effectiveTo === null || p.effectiveTo > asOf)) return p;
  }
  return null;
}

function nextPriceAfter(prices: PriceRecord[] | undefined, asOf: string) {
  if (!prices) return null;
  const future = prices.filter((p) => p.effectiveFrom > asOf);
  if (!future.length) return null;
  const first = future[0]!;
  return { price: first.price, effectiveFrom: first.effectiveFrom };
}

function previousPriceOf(prices: PriceRecord[] | undefined, asOf: string): number | null {
  if (!prices) return null;
  const current = priceAt(prices, asOf);
  if (!current) return null;
  const index = prices.findIndex((p) => p.id === current.id);
  return index > 0 ? prices[index - 1]!.price : null;
}

function dayBefore(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Breakdown calculation                                               */
/* ------------------------------------------------------------------ */

function buildBreakdown(
  data: Dataset,
  items: { partId: string; quantity: number }[],
  asOf: string,
): Breakdown {
  const lines: BreakdownLine[] = [];
  const missing: string[] = [];
  let total = 0;

  for (const item of items) {
    const part = data.partById.get(item.partId);
    if (!part) continue;
    const price = priceAt(data.pricesByPart.get(item.partId), asOf);
    const unitPrice = price ? price.price : null;
    const lineTotal = unitPrice === null ? null : unitPrice * item.quantity;
    if (unitPrice === null) missing.push(part.name);
    else total += lineTotal!;

    lines.push({
      partId: part.id,
      name: part.name,
      category: part.category,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      missingPrice: unitPrice === null,
    });
  }

  return {
    asOf,
    lines,
    total,
    componentCount: lines.length,
    partCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    missing,
  };
}

function summarizeConfiguration(
  data: Dataset,
  config: RawConfig,
  asOf: string,
): ConfigurationSummary {
  const items = (data.itemsByConfig.get(config.id) ?? []).map((i) => ({
    partId: i.part_id,
    quantity: i.quantity,
  }));
  const breakdown = buildBreakdown(data, items, asOf);
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    type: config.type,
    derivedFromId: config.derived_from_id,
    derivedFromName: config.derived_from_id
      ? (data.configs.find((c) => c.id === config.derived_from_id)?.name ?? null)
      : null,
    createdAt: config.created_at,
    componentCount: breakdown.componentCount,
    partCount: breakdown.partCount,
    total: breakdown.total,
    missing: breakdown.missing,
  };
}

/* ------------------------------------------------------------------ */
/* Parts                                                              */
/* ------------------------------------------------------------------ */

function summarizePart(data: Dataset, part: RawPart, asOf: string): PartSummary {
  const prices = data.pricesByPart.get(part.id);
  const current = priceAt(prices, asOf);
  let usage = 0;
  for (const items of data.itemsByConfig.values()) {
    if (items.some((i) => i.part_id === part.id)) usage += 1;
  }
  return {
    id: part.id,
    name: part.name,
    category: part.category,
    description: part.description,
    status: part.status,
    currentPrice: current ? current.price : null,
    previousPrice: previousPriceOf(prices, asOf),
    usedInConfigurations: usage,
    nextPrice: nextPriceAfter(prices, asOf),
  };
}

export async function listParts(input: {
  asOf: string;
  search?: string | undefined;
  category?: string | undefined;
  status?: PartStatus | "ALL" | undefined;
}): Promise<{ parts: PartSummary[]; categories: string[] }> {
  const data = await loadDataset();
  const search = (input.search ?? "").trim().toLowerCase();
  const categories = Array.from(new Set(data.parts.map((p) => p.category))).sort();

  const parts = data.parts
    .filter((p) => (input.category && input.category !== "ALL" ? p.category === input.category : true))
    .filter((p) => (input.status && input.status !== "ALL" ? p.status === input.status : true))
    .filter((p) =>
      search ? p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search) : true,
    )
    .map((p) => summarizePart(data, p, input.asOf));

  return { parts, categories };
}

export async function getPart(input: { id: string; asOf: string }): Promise<PartDetail> {
  const data = await loadDataset();
  const part = data.partById.get(input.id);
  if (!part) fail("PART_NOT_FOUND: This part no longer exists.");

  const configurations: PartDetail["configurations"] = [];
  for (const config of data.configs) {
    const item = (data.itemsByConfig.get(config.id) ?? []).find((i) => i.part_id === part.id);
    if (item) {
      configurations.push({
        id: config.id,
        name: config.name,
        type: config.type,
        quantity: item.quantity,
      });
    }
  }

  return {
    ...summarizePart(data, part, input.asOf),
    prices: (data.pricesByPart.get(part.id) ?? []).slice().reverse(),
    configurations,
  };
}

export async function createPart(input: {
  name: string;
  category: string;
  description?: string | undefined;
  price: number;
  effectiveFrom: string;
}): Promise<{ id: string }> {
  const inserted = await supabaseAdmin
    .from("parts")
    .insert({
      name: input.name,
      category: input.category,
      description: input.description ?? null,
      status: "ACTIVE",
    })
    .select("id")
    .single();
  if (inserted.error) fail(inserted.error.message);

  const priced = await supabaseAdmin.from("part_prices").insert({
    part_id: inserted.data.id,
    price: input.price,
    effective_from: input.effectiveFrom,
  });
  if (priced.error) fail(priced.error.message);

  return { id: inserted.data.id };
}

export async function setPartStatus(input: { id: string; status: PartStatus }) {
  const res = await supabaseAdmin
    .from("parts")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.id);
  if (res.error) fail(res.error.message);
  return { ok: true };
}

/**
 * Adds a new effective-dated price. Historical prices are never overwritten:
 * an existing open-ended period is closed at the new effective date instead.
 * Overlapping periods are rejected by the database trigger.
 */
export async function addPartPrice(input: {
  partId: string;
  price: number;
  effectiveFrom: string;
  note?: string | undefined;
}): Promise<{ oldPrice: number | null; newPrice: number; affectedConfigurations: number }> {
  const data = await loadDataset();
  const part = data.partById.get(input.partId);
  if (!part) fail("PART_NOT_FOUND: This part no longer exists.");

  const prices = data.pricesByPart.get(input.partId) ?? [];

  const exactDuplicate = prices.find((p) => p.effectiveFrom === input.effectiveFrom);
  if (exactDuplicate) {
    fail(
      `OVERLAPPING_PRICE_PERIOD: ${part.name} already has a price of ₹${exactDuplicate.price} effective from ${exactDuplicate.effectiveFrom}. Choose a different effective date.`,
    );
  }

  const openPeriod = prices.find(
    (p) => p.effectiveTo === null && p.effectiveFrom < input.effectiveFrom,
  );
  const laterPeriod = prices
    .filter((p) => p.effectiveFrom > input.effectiveFrom)
    .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))[0];

  if (openPeriod) {
    const closed = await supabaseAdmin
      .from("part_prices")
      .update({ effective_to: input.effectiveFrom })
      .eq("id", openPeriod.id);
    if (closed.error) fail(closed.error.message);
  }

  const inserted = await supabaseAdmin.from("part_prices").insert({
    part_id: input.partId,
    price: input.price,
    effective_from: input.effectiveFrom,
    effective_to: laterPeriod ? laterPeriod.effectiveFrom : null,
    note: input.note ?? null,
  });

  if (inserted.error) {
    if (openPeriod) {
      await supabaseAdmin
        .from("part_prices")
        .update({ effective_to: null })
        .eq("id", openPeriod.id);
    }
    if (inserted.error.message.includes("OVERLAPPING_PRICE_PERIOD")) {
      fail(inserted.error.message);
    }
    fail(inserted.error.message);
  }

  const previous = priceAt(prices, dayBefore(input.effectiveFrom))?.price ?? null;
  let affected = 0;
  for (const items of data.itemsByConfig.values()) {
    if (items.some((i) => i.part_id === input.partId)) affected += 1;
  }

  return { oldPrice: previous, newPrice: input.price, affectedConfigurations: affected };
}

/* ------------------------------------------------------------------ */
/* Configurations                                                     */
/* ------------------------------------------------------------------ */

export async function listConfigurations(input: {
  asOf: string;
  type?: ConfigurationType | "ALL" | undefined;
  search?: string | undefined;
}): Promise<ConfigurationSummary[]> {
  const data = await loadDataset();
  const search = (input.search ?? "").trim().toLowerCase();
  return data.configs
    .filter((c) => (input.type && input.type !== "ALL" ? c.type === input.type : true))
    .filter((c) => (search ? c.name.toLowerCase().includes(search) : true))
    .map((c) => summarizeConfiguration(data, c, input.asOf))
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "PREDEFINED" ? -1 : 1));
}

export async function getConfiguration(input: {
  id: string;
  asOf: string;
}): Promise<ConfigurationDetail> {
  const data = await loadDataset();
  const config = data.configs.find((c) => c.id === input.id);
  if (!config) fail("CONFIGURATION_NOT_FOUND: This configuration no longer exists.");

  const items = (data.itemsByConfig.get(config.id) ?? []).map((i) => ({
    partId: i.part_id,
    quantity: i.quantity,
  }));

  return {
    ...summarizeConfiguration(data, config, input.asOf),
    items,
    breakdown: buildBreakdown(data, items, input.asOf),
  };
}

export async function calculateBreakdown(input: {
  items: { partId: string; quantity: number }[];
  asOf: string;
}): Promise<Breakdown> {
  const data = await loadDataset();
  return buildBreakdown(data, input.items, input.asOf);
}

export async function saveConfiguration(input: {
  id?: string | undefined;
  name: string;
  description?: string | undefined;
  type: ConfigurationType;
  derivedFromId?: string | null | undefined;
  items: { partId: string; quantity: number }[];
}): Promise<{ id: string }> {
  const data = await loadDataset();

  if (!input.items.length) fail("EMPTY_CONFIGURATION: Add at least one component before saving.");

  for (const item of input.items) {
    const part = data.partById.get(item.partId);
    if (!part) fail("PART_NOT_FOUND: One of the selected components no longer exists.");
    const existing = input.id
      ? (data.itemsByConfig.get(input.id) ?? []).some((i) => i.part_id === item.partId)
      : false;
    if (part.status === "INACTIVE" && !existing) {
      fail(`INACTIVE_PART: ${part.name} is inactive and cannot be added to a configuration.`);
    }
  }

  if (input.id) {
    const existing = data.configs.find((c) => c.id === input.id);
    if (!existing) fail("CONFIGURATION_NOT_FOUND: This configuration no longer exists.");
    if (existing.type === "PREDEFINED") {
      fail(
        "PREDEFINED_IMMUTABLE: Predefined configurations cannot be edited. Use Customize to create a custom configuration.",
      );
    }
    const updated = await supabaseAdmin
      .from("configurations")
      .update({
        name: input.name,
        description: input.description ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);
    if (updated.error) fail(updated.error.message);

    const cleared = await supabaseAdmin
      .from("configuration_items")
      .delete()
      .eq("configuration_id", input.id);
    if (cleared.error) fail(cleared.error.message);

    const items = await supabaseAdmin.from("configuration_items").insert(
      input.items.map((i) => ({
        configuration_id: input.id!,
        part_id: i.partId,
        quantity: i.quantity,
      })),
    );
    if (items.error) fail(items.error.message);
    return { id: input.id };
  }

  const created = await supabaseAdmin
    .from("configurations")
    .insert({
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      derived_from_id: input.derivedFromId ?? null,
    })
    .select("id")
    .single();
  if (created.error) fail(created.error.message);

  const items = await supabaseAdmin.from("configuration_items").insert(
    input.items.map((i) => ({
      configuration_id: created.data.id,
      part_id: i.partId,
      quantity: i.quantity,
    })),
  );
  if (items.error) fail(items.error.message);

  return { id: created.data.id };
}

export async function deleteConfiguration(input: { id: string }) {
  const data = await loadDataset();
  const config = data.configs.find((c) => c.id === input.id);
  if (!config) fail("CONFIGURATION_NOT_FOUND: This configuration no longer exists.");
  if (config.type === "PREDEFINED") {
    fail("PREDEFINED_IMMUTABLE: Predefined configurations cannot be deleted.");
  }
  const res = await supabaseAdmin.from("configurations").delete().eq("id", input.id);
  if (res.error) fail(res.error.message);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Price changes and impact                                           */
/* ------------------------------------------------------------------ */

function collectChanges(data: Dataset, today: string): PriceChangeEvent[] {
  const changes: PriceChangeEvent[] = [];

  for (const part of data.parts) {
    const prices = data.pricesByPart.get(part.id) ?? [];
    let affected = 0;
    for (const items of data.itemsByConfig.values()) {
      if (items.some((i) => i.part_id === part.id)) affected += 1;
    }

    for (let i = 1; i < prices.length; i += 1) {
      const previous = prices[i - 1]!;
      const current = prices[i]!;
      changes.push({
        partId: part.id,
        partName: part.name,
        category: part.category,
        oldPrice: previous.price,
        newPrice: current.price,
        delta: current.price - previous.price,
        percent: previous.price ? ((current.price - previous.price) / previous.price) * 100 : 0,
        effectiveFrom: current.effectiveFrom,
        isFuture: current.effectiveFrom > today,
        affectedConfigurations: affected,
      });
    }
  }

  return changes.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
}

export async function listPriceChanges(input: { asOf: string }): Promise<PriceChangeEvent[]> {
  const data = await loadDataset();
  return collectChanges(data, input.asOf);
}

export async function getPriceImpact(input: {
  partId?: string | undefined;
  effectiveFrom?: string | undefined;
  asOf: string;
}): Promise<PriceImpactResult | null> {
  const data = await loadDataset();
  const changes = collectChanges(data, input.asOf);
  if (!changes.length) return null;

  const change =
    changes.find(
      (c) =>
        (!input.partId || c.partId === input.partId) &&
        (!input.effectiveFrom || c.effectiveFrom === input.effectiveFrom),
    ) ?? changes[0]!;

  const before = dayBefore(change.effectiveFrom);
  const configurations: ImpactedConfiguration[] = [];

  for (const config of data.configs) {
    const items = data.itemsByConfig.get(config.id) ?? [];
    const item = items.find((i) => i.part_id === change.partId);
    if (!item) continue;

    const oldBreakdown = buildBreakdown(
      data,
      items.map((i) => ({ partId: i.part_id, quantity: i.quantity })),
      before,
    );
    const delta = change.delta * item.quantity;
    configurations.push({
      id: config.id,
      name: config.name,
      type: config.type,
      quantity: item.quantity,
      oldTotal: oldBreakdown.total,
      newTotal: oldBreakdown.total + delta,
      delta,
    });
  }

  configurations.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return { change, configurations };
}

export async function getDashboard(input: { asOf: string }): Promise<DashboardData> {
  const data = await loadDataset();
  const changes = collectChanges(data, input.asOf);
  const recent = changes.filter((c) => !c.isFuture);
  const affectedIds = new Set<string>();

  for (const change of recent.slice(0, 20)) {
    for (const config of data.configs) {
      const items = data.itemsByConfig.get(config.id) ?? [];
      if (items.some((i) => i.part_id === change.partId)) affectedIds.add(config.id);
    }
  }

  const summaries = data.configs.map((c) => summarizeConfiguration(data, c, input.asOf));

  return {
    totals: {
      parts: data.parts.length,
      activeParts: data.parts.filter((p) => p.status === "ACTIVE").length,
      configurations: data.configs.length,
      predefined: data.configs.filter((c) => c.type === "PREDEFINED").length,
      custom: data.configs.filter((c) => c.type === "CUSTOM").length,
      priceChanges: changes.length,
      affectedConfigurations: affectedIds.size,
    },
    recentChanges: changes.slice(0, 6),
    topIncreases: changes
      .filter((c) => c.delta > 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 5),
    recentConfigurations: summaries
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
  };
}
