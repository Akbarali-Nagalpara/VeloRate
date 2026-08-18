import { Link } from "@tanstack/react-router";
import { Bike, GaugeCircle, History, Layers, PackageSearch, TrendingUp, Wrench } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", hint: "Pricing pulse", icon: GaugeCircle },
  { to: "/cycle-builder", label: "Cycle Builder", hint: "Build & customize", icon: Wrench },
  { to: "/configurations", label: "Configurations", hint: "Predefined & custom", icon: Layers },
  { to: "/parts", label: "Parts", hint: "Reusable library", icon: PackageSearch },
  { to: "/price-history", label: "Price History", hint: "Effective dates", icon: History },
  { to: "/price-impact", label: "Price Impact", hint: "What changed", icon: TrendingUp },
] as const;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-7">
        <span className="grid size-10 place-items-center rounded-xl bg-gold text-gold-foreground">
          <Bike className="size-5" />
        </span>
        <span className="leading-tight">
          <span className="block font-display text-base font-semibold text-sidebar-accent-foreground">
            Hero Cycles
          </span>
          <span className="block text-xs text-sidebar-foreground/70">Sales Pricing Workspace</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, hint, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            activeOptions={{ exact: to === "/" }}
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent"
            activeProps={{
              className: "bg-sidebar-accent text-sidebar-accent-foreground shadow-card",
            }}
          >
            <Icon className="size-4 shrink-0 opacity-80" />
            <span className="leading-tight">
              <span className="block font-medium">{label}</span>
              <span className="block text-[11px] text-sidebar-foreground/60">{hint}</span>
            </span>
          </Link>
        ))}
      </nav>

      <div className="m-3 rounded-xl bg-sidebar-accent/70 p-4 text-xs leading-relaxed text-sidebar-foreground/80">
        Parts → Price change → Pricing engine → Price impact → Cycle price
      </div>
    </div>
  );
}
