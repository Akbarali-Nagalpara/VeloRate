import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState, StatusBadge } from "@/components/shared/Primitives";
import { formatINR } from "@/lib/pricing/types";
import type { PartSummary } from "@/lib/pricing/types";

export function ComponentSelector({
  parts,
  selectedIds,
  onAdd,
}: {
  parts: PartSummary[];
  selectedIds: string[];
  onAdd: (partId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parts.filter((part) =>
      q ? part.name.toLowerCase().includes(q) || part.category.toLowerCase().includes(q) : true,
    );
  }, [parts, query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-dashed border-teal/50 text-teal">
          <Plus className="size-4" /> Add Component
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-brand">Add a component</DialogTitle>
          <DialogDescription>
            Prices shown are the ones applicable to the calculation date. Inactive parts cannot be
            added.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search parts e.g. mountain tyre"
            className="pl-9"
            aria-label="Search parts"
          />
        </div>

        <ScrollArea className="h-[340px] pr-3">
          <div className="space-y-2">
            {results.length === 0 ? (
              <EmptyState
                title="No parts match that search"
                description="Try a different part name or category, or add the part to the library first."
              />
            ) : null}

            {results.map((part) => {
              const alreadyAdded = selectedIds.includes(part.id);
              const blocked = part.status === "INACTIVE" || part.currentPrice === null;
              return (
                <div
                  key={part.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{part.name}</p>
                    <p className="text-xs text-muted-foreground">{part.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="num text-sm font-semibold text-brand">
                      {formatINR(part.currentPrice)}
                    </span>
                    <StatusBadge status={part.status} />
                    <Button
                      size="sm"
                      variant={blocked || alreadyAdded ? "outline" : "gold"}
                      disabled={blocked || alreadyAdded}
                      onClick={() => {
                        onAdd(part.id);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      {part.status === "INACTIVE"
                        ? "Inactive"
                        : part.currentPrice === null
                          ? "No price"
                          : alreadyAdded
                            ? "Added"
                            : "Add"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
