import { Link } from "@tanstack/react-router";
import { ArrowRight, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TypeBadge } from "@/components/shared/Primitives";
import { formatINR } from "@/lib/pricing/types";
import type { ConfigurationSummary } from "@/lib/pricing/types";

export function ConfigurationCard({ config }: { config: ConfigurationSummary }) {
  return (
    <article className="surface-card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold text-brand">{config.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {config.description ?? "No description"}
          </p>
        </div>
        <TypeBadge type={config.type} />
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="num font-display text-2xl font-semibold text-foreground">
            {formatINR(config.total)}
          </p>
          <p className="num text-xs text-muted-foreground">
            {config.componentCount} components · {config.partCount} parts
          </p>
        </div>
        {config.derivedFromName ? (
          <p className="text-right text-[11px] text-muted-foreground">
            from
            <br />
            <span className="font-medium text-foreground">{config.derivedFromName}</span>
          </p>
        ) : null}
      </div>

      {config.missing.length ? (
        <p className="rounded-lg bg-coral-soft px-3 py-2 text-xs text-coral">
          Missing price for {config.missing.join(", ")}
        </p>
      ) : null}

      <div className="mt-auto flex gap-2">
        <Button asChild variant="soft" className="flex-1">
          <Link to="/configurations/$id" params={{ id: config.id }}>
            Open <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="gold">
          <Link to="/cycle-builder" search={{ from: config.id }}>
            <Wand2 className="size-4" /> Customize
          </Link>
        </Button>
      </div>
    </article>
  );
}
