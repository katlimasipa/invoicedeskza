import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, ArrowUpRight, Layers } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Tpl = { id: string; name: string; data: any; created_at: string };

export default function Templates() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [list, setList] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("templates").select("*").order("created_at", { ascending: false });
    setList((data as any) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function duplicate(t: Tpl) {
    if (!user) return;
    const { error } = await supabase.from("templates").insert({
      user_id: user.id, name: `${t.name} (copy)`, data: t.data,
    });
    if (error) return toast.error(error.message);
    load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this template?")) return;
    const { error } = await supabase.from("templates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <AppShell eyebrow="Reuse" title="Templates">
      <div className="max-w-4xl">
        <div className="mb-8">
          <p className="text-ink-soft text-[14px] max-w-prose">
            Save any invoice as a template (from the editor’s top bar), then start new invoices from it. Useful for retainers and recurring packages.
          </p>
        </div>

        {!loading && list.length === 0 && (
          <div className="border border-dashed border-rule p-12 text-center">
            <Layers className="h-5 w-5 mx-auto text-ink-mute mb-3" />
            <div className="label-eyebrow mb-2">no templates yet</div>
            <p className="text-ink-soft text-sm mb-4">Open an invoice and use “Template” in the top bar to save its line items.</p>
            <Button asChild variant="outline" className="rounded-sm">
              <Link to="/invoices/new">Create invoice</Link>
            </Button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-px bg-rule border border-rule">
          {list.map((t) => {
            const items = Array.isArray(t.data?.items) ? t.data.items.length : 0;
            return (
              <div key={t.id} className="bg-surface p-5 group flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="font-display text-lg text-ink truncate">{t.name}</div>
                    <div className="label-eyebrow text-[9px] mt-1">
                      {items} item{items === 1 ? "" : "s"} · saved {format(new Date(t.created_at), "dd MMM ’yy")}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => duplicate(t)} className="p-1.5 text-ink-mute hover:text-ink" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(t.id)} className="p-1.5 text-ink-mute hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  className="rounded-sm self-start gap-1.5 mt-2"
                  onClick={() => nav(`/invoices/new?template=${t.id}`)}
                >
                  Use template <ArrowUpRight className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
