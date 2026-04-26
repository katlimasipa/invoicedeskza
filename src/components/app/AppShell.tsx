import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export function AppShell({ children, title, eyebrow, action }: {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-paper">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b border-rule px-3 bg-paper/90 backdrop-blur sticky top-0 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="text-ink-mute hover:text-ink" />
              {(eyebrow || title) && (
                <div className="flex items-baseline gap-3 min-w-0">
                  {eyebrow && <span className="label-eyebrow hidden sm:inline">{eyebrow}</span>}
                  {title && <span className="font-display text-[15px] tracking-tight truncate">{title}</span>}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">{action}</div>
          </header>
          <main className="flex-1 px-4 sm:px-8 py-6 sm:py-10">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
