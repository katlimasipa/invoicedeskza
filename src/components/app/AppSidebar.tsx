import { NavLink, useLocation } from "react-router-dom";
import { LayoutGrid, FileText, Plus, Layers, Settings, LogOut } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const items = [
  { title: "Overview",   url: "/",           icon: LayoutGrid },
  { title: "Invoices",   url: "/invoices",   icon: FileText },
  { title: "New invoice",url: "/invoices/new", icon: Plus },
  { title: "Templates",  url: "/templates",  icon: Layers },
  { title: "Settings",   url: "/settings",   icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const isActive = (u: string) => u === "/" ? pathname === "/" : pathname.startsWith(u);

  return (
    <Sidebar collapsible="icon" className="border-r border-rule">
      <SidebarContent className="bg-sidebar">
        {/* Brand */}
        <div className={cn("flex items-center gap-2 px-3 pt-4 pb-3", collapsed && "justify-center px-0")}>
          <div className="h-7 w-7 rounded-sm bg-ink text-paper grid place-items-center font-display text-[15px] leading-none">
            Iₐ
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-[15px] tracking-tight">Invoice Desk</span>
              <span className="label-eyebrow text-[9px]">a ledger, but modern</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="label-eyebrow text-[10px] mt-2">Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-[13px] text-ink-soft transition-colors",
                        "hover:bg-sidebar-accent hover:text-ink",
                        isActive(item.url) && "bg-ink text-paper hover:bg-ink hover:text-paper",
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-rule bg-sidebar">
        <div className={cn("flex items-center gap-2 px-2 py-2", collapsed && "justify-center")}>
          <div className="h-7 w-7 rounded-full bg-surface-sunk grid place-items-center text-[11px] font-mono">
            {(user?.email ?? "?").slice(0, 1).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[12px] truncate text-ink">{user?.email}</div>
              <button onClick={signOut} className="label-eyebrow text-[9px] hover:text-ink flex items-center gap-1">
                <LogOut className="h-2.5 w-2.5" /> sign out
              </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
