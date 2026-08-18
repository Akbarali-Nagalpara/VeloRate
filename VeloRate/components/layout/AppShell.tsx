import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";

import { SidebarNav } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AppShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ eyebrow, title, description, actions, children }: AppShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[268px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex items-start gap-4 px-5 py-5 sm:px-8">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[268px] border-0 p-0">
                <SidebarNav onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              {eyebrow ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="truncate text-xl font-semibold text-brand sm:text-2xl">{title}</h1>
              {description ? (
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>

            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        </header>

        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
