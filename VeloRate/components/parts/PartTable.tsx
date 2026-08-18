import { Link } from "@tanstack/react-router";

import { PriceDelta, StatusBadge } from "@/components/shared/Primitives";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR } from "@/lib/pricing/types";
import type { PartSummary } from "@/lib/pricing/types";

export function PartTable({ parts }: { parts: PartSummary[] }) {
  return (
    <div className="surface-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-brand-soft/60">
            <TableHead className="text-brand">Part</TableHead>
            <TableHead className="text-brand">Category</TableHead>
            <TableHead className="text-brand">Status</TableHead>
            <TableHead className="text-right text-brand">Current price</TableHead>
            <TableHead className="text-right text-brand">Change</TableHead>
            <TableHead className="text-right text-brand">Used in</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => {
            const delta =
              part.previousPrice !== null && part.currentPrice !== null
                ? part.currentPrice - part.previousPrice
                : 0;
            return (
              <TableRow key={part.id}>
                <TableCell className="font-medium text-foreground">{part.name}</TableCell>
                <TableCell className="text-muted-foreground">{part.category}</TableCell>
                <TableCell>
                  <StatusBadge status={part.status} />
                </TableCell>
                <TableCell className="num text-right font-semibold">
                  {formatINR(part.currentPrice)}
                </TableCell>
                <TableCell className="text-right">
                  {delta === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <PriceDelta delta={delta} />
                  )}
                </TableCell>
                <TableCell className="num text-right text-muted-foreground">
                  {part.usedInConfigurations}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    to="/parts/$id"
                    params={{ id: part.id }}
                    className="text-sm font-medium text-teal underline-offset-4 hover:underline"
                  >
                    Details
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
