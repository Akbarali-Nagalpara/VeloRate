import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { createPartFn } from "@/lib/pricing.functions";
import { todayISO } from "@/lib/pricing/types";

export function AddPartDialog({ categories }: { categories: string[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Frame");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayISO());

  const createPart = useServerFn(createPartFn);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      createPart({
        data: {
          name: name.trim(),
          category: category.trim(),
          price: Number(price),
          effectiveFrom,
          ...(description.trim() ? { description: description.trim() } : {}),
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries();
      setOpen(false);
      setName("");
      setDescription("");
      setPrice("");
      toast.success("Part added to the library");
    },
  });

  const valid = name.trim().length > 1 && category.trim().length > 1 && Number(price) >= 0 && price !== "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold">
          <Plus className="size-4" /> New part
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a part</DialogTitle>
          <DialogDescription>
            The part is created with its first effective-dated price. Later changes append to its
            history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="part-name">Part name</Label>
            <Input
              id="part-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Alloy Rim 26in"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="part-category">Category</Label>
              <Input
                id="part-category"
                list="part-category-options"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
              <datalist id="part-category-options">
                {categories.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="part-price">Unit price (₹)</Label>
              <Input
                id="part-price"
                type="number"
                min={0}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="1450"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="part-effective">Effective from</Label>
            <Input
              id="part-effective"
              type="date"
              value={effectiveFrom}
              onChange={(event) => setEffectiveFrom(event.target.value || todayISO())}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="part-description">Description</Label>
            <Textarea
              id="part-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional note for the sales team"
              rows={2}
            />
          </div>

          {mutation.isError ? <ErrorState message={(mutation.error as Error).message} /> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="teal"
            disabled={!valid || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Saving…" : "Add part"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
