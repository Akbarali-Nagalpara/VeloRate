import { Link } from "@tanstack/react-router";

import { PriceDelta, TypeBadge } from "@/components/shared/Primitives";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatINR } from "@/lib/pricing/types";
import type { PriceImpactResult } from "@/lib/pricing/types";

export function PriceImpactSummary({ result }: { result: PriceImpactResult }) {
  const { change } = result;
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-6 bg-brand px-6 py-6 text-brand-foreground">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-foreground/70">
            {change.isFuture ? "Scheduled change" : "Applied change"} ·{" "}
            {formatDate(change.effectiveFrom)}
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold">{change.partName}</h2>
          <p className="num mt-2 text-lg">
            <span className="text-brand-foreground/60 line-through">{formatINR(change.oldPrice)}</span>{" "}
            → <span className="font-semibold">{formatINR(change.newPrice)}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="num font-display text-3xl font-semibold text-gold">
            {change.delta > 0 ? "+" : change.delta < 0 ? "−" : ""}
            {formatINR(Math.abs(change.delta))}
          </p>
          <p className="num text-xs text-brand-foreground/70">
            {change.percent > 0 ? "+" : ""}
            {change.percent.toFixed(1)}% per unit
          </p>
          <p className="mt-2 text-sm text-brand-foreground/80">
            {result.configurations.length} configurations affected
          </p>
        </div>
      </div>
    </div>
  );
}

export function PriceImpactTable({ result }: { result: PriceImpactResult }) {
  return (
    <div className="surface-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-brand-soft/60">
            <TableHead className="text-brand">Configuration</TableHead>
            <TableHead className="text-brand">Type</TableHead>
            <TableHead className="text-right text-brand">Qty used</TableHead>
            <TableHead className="text-right text-brand">Before</TableHead>
            <TableHead className="text-right text-brand">After</TableHead>
            <TableHead className="text-right text-brand">Impact</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.configurations.map((config) => (
            <TableRow key={config.id}>
              <TableCell>
                <Link
                  to="/configurations/$id"
                  params={{ id: config.id }}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {config.name}
                </Link>
              </TableCell>
              <TableCell>
                <TypeBadge type={config.type} />
              </TableCell>
              <TableCell className="num text-right text-muted-foreground">
                × {config.quantity}
              </TableCell>
              <TableCell className="num text-right text-muted-foreground">
                {formatINR(config.oldTotal)}
              </TableCell>
              <TableCell className="num text-right font-semibold text-foreground">
                {formatINR(config.newTotal)}
              </TableCell>
              <TableCell className="text-right">
                <PriceDelta delta={config.delta} />
              </TableCell>
            </TableRow>
          ))}
          {result.configurations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                This part is not used in any configuration yet, so no cycle price changes.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
