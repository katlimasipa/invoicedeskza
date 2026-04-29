import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Plus, FileText, Settings as SettingsIcon } from "lucide-react";
import { format } from "date-fns";
import { formatZAR } from "@/lib/format";

type Inv = {
  id: string;
  invoice_number: string;
  client_name: string;
  total_due: number;
  invoice_date: string;
  status: string;
  created_at: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Inv[]>([]);
  const [count, setCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: invs }, { count: c }, { data: settings }] = await Promise.all([
        supabase.from("invoices").select("id, invoice_number, client_name, total_due, invoice_date, status, created_at").order("created_at", { ascending: false }).limit(6),
        supabase.from("invoices").select("*", { count: "exact", head: true }),
        supabase.from("company_settings").select("company_name").eq("user_id", user.id).maybeSingle(),
      ]);
      setInvoices(invs ?? []);
      setCount(c ?? 0);
      setRevenue((invs ?? []).reduce((s, i: any) => s + Number(i.total_due ?? 0), 0));
      setCompanyName(settings?.company_name ?? "");
      setLoading(false);
    })();
  }, [user]);

  return (
    <AppShell eyebrow="Workspace" title="Overview">
      <div className="max-w-6xl">
        {/* Greeting */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <div className="label-eyebrow mb-2">{format(new Date(), "EEEE, d MMMM yyyy")}</div>
            <h1 className="display text-4xl sm:text-5xl text-ink leading-[1.05]">
              Good day{companyName ? <>,<br/><em className="not-italic" style={{fontStyle:"italic"}}>{companyName}</em></> : "."}
            </h1>
          </div>
          <Button asChild className="bg-ink text-paper hover:bg-ink/90 rounded-sm h-10 gap-2">
            <Link to="/invoices/new"><Plus className="h-3.5 w-3.5" /> New invoice</Link>
          </Button>
        </div>

        {/* Stat strip — single hairline grid, no card-spam */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border border-rule bg-surface mb-10 divide-y sm:divide-y-0 sm:divide-x divide-rule">
          <Stat label="invoices issued" value={count.toString().padStart(2, "0")} mono />
          <Stat label="recent value" value={formatZAR(revenue)} mono />
          <Stat label="status" value={loading ? "syncing" : "ready"} />
        </div>

        {/* Recent + actions */}
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-10">
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-xl tracking-tight">Recent invoices</h2>
              <Link to="/invoices" className="label-eyebrow hover:text-ink flex items-center gap-1">all <ArrowUpRight className="h-3 w-3" /></Link>
            </div>
            <div className="border-t border-rule">
              {invoices.length === 0 && !loading && (
                <div className="py-12 text-center">
                  <div className="label-eyebrow mb-3">empty ledger</div>
                  <p className="text-ink-soft text-[14px] mb-4">No invoices yet. Generate your first one.</p>
                  <Button asChild variant="outline" className="rounded-sm border-ink text-ink hover:bg-ink hover:text-paper">
                    <Link to="/invoices/new">Create invoice</Link>
                  </Button>
                </div>
              )}
              {invoices.map((inv) => (
                <Link
                  key={inv.id}
                  to={`/invoices/${inv.id}/edit`}
                  className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center py-3.5 border-b border-rule hover:bg-surface-sunk -mx-2 px-2 transition-colors"
                >
                  <span className="font-mono text-[11px] text-ink-mute w-20">{inv.invoice_number}</span>
                  <span className="text-[14px] text-ink truncate">{inv.client_name}</span>
                  <span className="font-mono text-[11px] text-ink-mute hidden sm:inline">{format(new Date(inv.invoice_date), "dd MMM ’yy")}</span>
                  <span className="font-mono text-[13px] text-ink tabular-nums">{formatZAR(inv.total_due)}</span>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl tracking-tight mb-4">Quick actions</h2>
            <div className="space-y-px bg-rule border border-rule">
              <ActionRow to="/invoices/new" icon={Plus} title="New invoice" hint="from blank" />
              <ActionRow to="/invoices" icon={FileText} title="All invoices" hint="search · edit · re-export" />
              <ActionRow to="/settings" icon={SettingsIcon} title="Settings" hint="logo · bank · signature" />
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-5 py-4">
      <div className="label-eyebrow mb-2">{label}</div>
      <div className={`text-2xl text-ink ${mono ? "font-mono tabular-nums" : "font-display"}`}>{value}</div>
    </div>
  );
}

function ActionRow({ to, icon: Icon, title, hint }: { to: string; icon: any; title: string; hint: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 bg-surface hover:bg-surface-sunk px-4 py-3 transition-colors group">
      <Icon className="h-3.5 w-3.5 text-ink-mute group-hover:text-ink" />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-ink">{title}</div>
        <div className="label-eyebrow text-[9px] mt-0.5">{hint}</div>
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 text-ink-faint group-hover:text-ink" />
    </Link>
  );
}
