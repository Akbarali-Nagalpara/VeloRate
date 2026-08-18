import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatINR } from "@/lib/pricing/types";
import type { ConfigurationType, PartStatus } from "@/lib/pricing/types";

export function SectionCard({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface-card p-5 sm:p-6", className)}>
      {title ? (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-brand">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "teal",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "teal" | "gold" | "coral" | "grape";
}) {
  const tones = {
    teal: "bg-teal-soft text-teal",
    gold: "bg-gold-soft text-gold-foreground",
    coral: "bg-coral-soft text-coral",
    grape: "bg-grape-soft text-grape",
  } as const;

  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", tones[tone])}>
          live
        </span>
      </div>
      <p className="num mt-3 font-display text-3xl font-semibold text-brand">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function PriceDelta({
  delta,
  showZero = true,
  className,
}: {
  delta: number;
  showZero?: boolean;
  className?: string;
}) {
  if (delta === 0 && !showZero) return null;
  const up = delta > 0;
  const down = delta < 0;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-semibold",
        up && "bg-coral-soft text-coral",
        down && "bg-teal-soft text-teal",
        !up && !down && "bg-muted text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {up ? "+" : down ? "−" : ""}
      {formatINR(Math.abs(delta)).replace("₹", "₹")}
    </span>
  );
}

export function PriceTransition({
  from,
  to,
  className,
}: {
  from: number | null;
  to: number;
  className?: string;
}) {
  return (
    <span className={cn("num inline-flex items-center gap-2 text-sm", className)}>
      <span className="text-muted-foreground line-through">{formatINR(from)}</span>
      <span aria-hidden>→</span>
      <span className="font-semibold text-brand">{formatINR(to)}</span>
    </span>
  );
}

export function TypeBadge({ type }: { type: ConfigurationType }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md border-0 text-[10px] font-semibold uppercase tracking-[0.14em]",
        type === "PREDEFINED" ? "bg-brand-soft text-brand" : "bg-grape-soft text-grape",
      )}
    >
      {type}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: PartStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md border-0 text-[10px] font-semibold uppercase tracking-[0.14em]",
        status === "ACTIVE" ? "bg-teal-soft text-teal" : "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </Badge>
  );
}

export function AsOfLabel({ asOf }: { asOf: string }) {
  return (
    <p className="text-xs text-muted-foreground">
      Prices calculated as of <span className="font-medium text-foreground">{formatDate(asOf)}</span>
    </p>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center">
      <h3 className="font-display text-base font-semibold text-brand">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  const clean = message.replace(/^[A-Z_]+:\s*/, "");
  return (
    <div className="rounded-xl border border-coral/40 bg-coral-soft px-5 py-4">
      <p className="font-display text-sm font-semibold text-coral">Something needs attention</p>
      <p className="mt-1 text-sm text-foreground/80">{clean}</p>
    </div>
  );
}

export function LoadingRows({ rows = 4, height = 64 }: { rows?: number; height?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="w-full rounded-xl" style={{ height }} />
      ))}
    </div>
  );
}
