export type PartStatus = "ACTIVE" | "INACTIVE";
export type ConfigurationType = "PREDEFINED" | "CUSTOM";

export interface PriceRecord {
  id: string;
  price: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  note: string | null;
}

export interface PartSummary {
  id: string;
  name: string;
  category: string;
  description: string | null;
  status: PartStatus;
  currentPrice: number | null;
  previousPrice: number | null;
  usedInConfigurations: number;
  nextPrice: { price: number; effectiveFrom: string } | null;
}

export interface PartDetail extends PartSummary {
  prices: PriceRecord[];
  configurations: { id: string; name: string; type: ConfigurationType; quantity: number }[];
}

export interface BreakdownLine {
  partId: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number | null;
  lineTotal: number | null;
  missingPrice: boolean;
}

export interface Breakdown {
  asOf: string;
  lines: BreakdownLine[];
  total: number;
  componentCount: number;
  partCount: number;
  missing: string[];
}

export interface ConfigurationSummary {
  id: string;
  name: string;
  description: string | null;
  type: ConfigurationType;
  derivedFromId: string | null;
  derivedFromName: string | null;
  createdAt: string;
  componentCount: number;
  partCount: number;
  total: number;
  missing: string[];
}

export interface ConfigurationDetail extends ConfigurationSummary {
  items: { partId: string; quantity: number }[];
  breakdown: Breakdown;
}

export interface PriceChangeEvent {
  partId: string;
  partName: string;
  category: string;
  oldPrice: number;
  newPrice: number;
  delta: number;
  percent: number;
  effectiveFrom: string;
  isFuture: boolean;
  affectedConfigurations: number;
}

export interface ImpactedConfiguration {
  id: string;
  name: string;
  type: ConfigurationType;
  quantity: number;
  oldTotal: number;
  newTotal: number;
  delta: number;
}

export interface PriceImpactResult {
  change: PriceChangeEvent;
  configurations: ImpactedConfiguration[];
}

export interface DashboardData {
  totals: {
    parts: number;
    activeParts: number;
    configurations: number;
    predefined: number;
    custom: number;
    priceChanges: number;
    affectedConfigurations: number;
  };
  recentChanges: PriceChangeEvent[];
  topIncreases: PriceChangeEvent[];
  recentConfigurations: ConfigurationSummary[];
}

export function formatINR(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return "₹" + Math.round(value).toLocaleString("en-IN");
}

export function formatDate(value: string): string {
  const d = new Date(value + (value.length === 10 ? "T00:00:00Z" : ""));
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
