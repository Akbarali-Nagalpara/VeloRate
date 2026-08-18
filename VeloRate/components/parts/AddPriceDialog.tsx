import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ErrorState } from "@/components/shared/Primitives";
import { addPartPriceFn } from "@/lib/pricing.functions";
import { formatINR, todayISO } from "@/lib/pricing/types";

export function AddPriceDialog({
  partId,
  partName,
  currentPrice,
}: {
  partId: string;
  partName: string;
  currentPrice: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(currentPrice ? String(currentPrice) : "");
  const [effectiveFrom, setEffectiveFrom] = useState(todayISO());
  const [note, setNote] = useState("");
  const addPrice = useServerFn(addPartPriceFn);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () =>
      addPrice({
        data: {
          partId,
          price: Number(price),
          effectiveFrom,
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries();
      setOpen(false);
      setNote("");
      toast.success(`Price updated · ${partName}`, {
        description: `${formatINR(result.oldPrice)} → ${formatINR(result.newPrice)} · ${
          result.affectedConfigurations
        } configurations affected`,
        action: {
          label: "View Price Impact",
          onClick: () =>
            void navigate({ to: "/price-impact", search: { partId, effectiveFrom } }),
        },
      });
    },
  });

  const valid = Number(price) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold">
          <CalendarPlus className="size-4" /> Add New Price
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-brand">Add a price for {partName}</DialogTitle>
          <DialogDescription>
            Existing prices are never overwritten. The new price applies only from its effective date,
            and overlapping periods are rejected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-price">New price (₹)</Label>
            <Input
              id="new-price"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value.replace(/[^\d.]/g, ""))}
              placeholder="1350"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="effective-from">Effective from</Label>
            <Input
              id="effective-from"
              type="date"
              value={effectiveFrom}
              onChange={(event) => setEffectiveFrom(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Pick a future date to schedule a price that only applies from that day.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price-note">Note (optional)</Label>
            <Input
              id="price-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Vendor revision, freight change…"
            />
          </div>

          {mutation.isError ? <ErrorState message={(mutation.error as Error).message} /> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="gold"
            disabled={!valid || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Save price
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
