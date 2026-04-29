import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { formatZAR } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Inv = {
  id: string;
  invoice_number: string;
  client_name: string;
  total_due: number;
  invoice_date: string;
  status: string;
};

export default function Invoices() {
  const [list, setList] = useState<Inv[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("invoices")
      .select("id, invoice_number, client_name, total_due, invoice_date, status")
      .order("created_at", { ascending: false });
    setList(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Invoice deleted");
    load();
  }

  const filtered = list.filter((i) =>
    [i.invoice_number, i.client_name].some((s) => s?.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AppShell eyebrow="Ledger" title="Invoices" action={
      <Button asChild className="bg-ink text-paper hover:bg-ink/90 rounded-sm h-9 gap-2">
        <Link to="/invoices/new"><Plus className="h-3.5 w-3.5" /> New</Link>
      </Button>
    }>
      <div className="max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <Input
            placeholder="Search by client or invoice number…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-sm max-w-sm"
          />
          <span className="label-eyebrow">{filtered.length} of {list.length}</span>
        </div>

        <div className="border-t border-b border-rule">
          <div className="grid grid-cols-[80px_1fr_auto_auto] sm:grid-cols-[100px_1fr_auto_140px_auto] gap-2 sm:gap-4 items-center py-2 label-eyebrow text-[10px] border-b border-rule">
            <span>№</span><span>client</span><span className="hidden sm:inline">date</span><span className="text-right">total</span><span className="hidden sm:inline"></span>
          </div>
          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="label-eyebrow mb-2">no results</div>
              <p className="text-ink-soft text-sm">Try a different search, or <Link to="/invoices/new" className="underline underline-offset-2">create one</Link>.</p>
            </div>
          )}
          {filtered.map((inv) => (
            <div key={inv.id} className="grid grid-cols-[80px_1fr_auto_auto] sm:grid-cols-[100px_1fr_auto_140px_auto] gap-2 sm:gap-4 items-center py-3 border-b border-rule group hover:bg-surface-sunk -mx-2 px-2">
              <Link to={`/invoices/${inv.id}/edit`} className="font-mono text-[11px] text-ink-mute hover:text-ink truncate">{inv.invoice_number}</Link>
              <Link to={`/invoices/${inv.id}/edit`} className="text-[13px] sm:text-[14px] text-ink truncate hover:underline underline-offset-2 min-w-0">{inv.client_name}</Link>
              <span className="font-mono text-[11px] text-ink-mute hidden sm:inline">{format(new Date(inv.invoice_date), "dd MMM ’yy")}</span>
              <span className="font-mono text-[12px] sm:text-[13px] text-ink text-right tabular-nums whitespace-nowrap">{formatZAR(inv.total_due)}</span>
              <button onClick={() => remove(inv.id)} className="text-ink-faint hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
