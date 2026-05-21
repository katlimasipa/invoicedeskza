import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InvoiceSheet, InvoiceData, InvoiceItemData } from "@/components/invoice/InvoiceSheet";
import { useSignedUrl } from "@/lib/useSignedUrl";
import { formatZAR, calcGrandTotal, calcRowTotal, clientToFilenameToken } from "@/lib/format";
import { exportSheetToPDF } from "@/lib/pdf";
import { Plus, Trash2, Download, Save } from "lucide-react";
import { toast } from "sonner";

type ItemRow = InvoiceItemData & { id?: string; original_unit_price?: number | string | null };

export default function InvoiceEditor() {
  const { id } = useParams();
  const isNew = !id;
  const [sp] = useSearchParams();
  const templateId = sp.get("template");
  const nav = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clientName, setClientName] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ service: "", note: "", qty: 1, unit_price: 0 }]);
  const [projectDescription, setProjectDescription] = useState("");

  // Snapshot fields (from settings on new, from invoice row on edit)
  const [companyName, setCompanyName] = useState("");
  const [clientStreet, setClientStreet] = useState("");
  const [clientSuburb, setClientSuburb] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientPostalCode, setClientPostalCode] = useState("");
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [signaturePath, setSignaturePath] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  const sheetRef = useRef<HTMLDivElement>(null);

  const logoUrl = useSignedUrl("logos", logoPath);
  const signatureUrl = useSignedUrl("signatures", signaturePath);

  // Load existing invoice or seed from settings
  useEffect(() => {
    if (!user) return;
    (async () => {
      if (isNew) {
        const { data: settings } = await supabase
          .from("company_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (settings) {
          setCompanyName(settings.company_name ?? "");
          setLogoPath(settings.logo_path);
          setSignaturePath(settings.signature_path);
          setPhone(settings.phone ?? "");
          setEmail(settings.email ?? "");
          setWebsite(settings.website ?? "");
          setBankName(settings.bank_name ?? "");
          setBankAccountName(settings.bank_account_name ?? "");
          setBankAccountNumber(settings.bank_account_number ?? "");
        }
        // Provisional invoice number — finalised on save via RPC
        setInvoiceNumber(`${new Date().getFullYear()}····`);

        // Seed from a template if requested
        if (templateId) {
          const { data: tpl } = await supabase.from("templates").select("data").eq("id", templateId).maybeSingle();
          const d: any = tpl?.data;
          if (d) {
          if (d.client_name) setClientName(d.client_name);
            if (Array.isArray(d.items)) setItems(d.items);
            if (d.project_description) setProjectDescription(d.project_description);
          }
        }
        setLoading(false);
      } else {
        const [{ data: inv }, { data: its }] = await Promise.all([
          supabase.from("invoices").select("*").eq("id", id).maybeSingle(),
          supabase.from("invoice_items").select("*").eq("invoice_id", id).order("position"),
        ]);
        if (!inv) { toast.error("Invoice not found"); nav("/invoices"); return; }
        setInvoiceNumber(inv.invoice_number);
        setInvoiceDate(inv.invoice_date);
        setClientName(inv.client_name);
        setCompanyName(inv.company_name ?? "");
        setClientStreet(inv.client_street ?? "");
        setClientSuburb(inv.client_suburb ?? "");
        setClientCity(inv.client_city ?? "");
        setClientPostalCode(inv.client_postal_code ?? "");
        setLogoPath(inv.logo_path);
        setSignaturePath(inv.signature_path);
        setPhone(inv.phone ?? "");
        setEmail(inv.email ?? "");
        setWebsite(inv.website ?? "");
        setBankName(inv.bank_name ?? "");
        setBankAccountName(inv.bank_account_name ?? "");
        setBankAccountNumber(inv.bank_account_number ?? "");
        setProjectDescription((inv as any).project_description ?? "");
        setItems((its ?? []).map((r: any) => ({
          id: r.id,
          service: r.service,
          note: r.note,
          qty: Number(r.qty),
          unit_price: Number(r.unit_price),
          original_unit_price: r.original_unit_price != null ? Number(r.original_unit_price) : null,
        })));
        setLoading(false);
      }
    })();
  }, [user, id, isNew, templateId, nav]);

  const grand = useMemo(() => calcGrandTotal(items), [items]);

  const previewData: InvoiceData = {
    invoice_number: invoiceNumber || "····",
    invoice_date: invoiceDate || new Date(),
    client_name: clientName,
    company_name: companyName,
    client_street: clientStreet,
    client_suburb: clientSuburb,
    client_city: clientCity,
    client_postal_code: clientPostalCode,
    logo_url: logoUrl,
    signature_url: signatureUrl,
    phone, email, website,
    bank_name: bankName,
    bank_account_name: bankAccountName,
    bank_account_number: bankAccountNumber,
    project_description: projectDescription,
    items,
  };

  function setItem(idx: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function addItem() {
    setItems((p) => [...p, { service: "", note: "", qty: 1, unit_price: 0 }]);
  }
  function removeItem(idx: number) {
    setItems((p) => (p.length === 1 ? p : p.filter((_, i) => i !== idx)));
  }

  async function save(): Promise<string | null> {
    if (!user) return null;
    if (!clientName.trim()) { toast.error("Client name is required"); return null; }
    setSaving(true);
    try {
      let savedId = id;
      let number = invoiceNumber;

      if (isNew) {
        // Only auto-assign if user left it blank or kept the placeholder (e.g. "2026····")
        const typed = invoiceNumber.trim();
        const isPlaceholder = !typed || /^[·•]+$/.test(typed) || /····/.test(typed);
        if (isPlaceholder) {
          const { data: numData, error: numErr } = await supabase.rpc("next_invoice_number", { _user_id: user.id });
          if (numErr) throw numErr;
          number = numData as string;
        } else {
          number = typed;
        }

        const { data: inv, error } = await supabase.from("invoices").insert({
          user_id: user.id,
          invoice_number: number,
          invoice_date: invoiceDate,
          client_name: clientName,
          company_name: companyName,
          client_street: clientStreet || null,
          client_suburb: clientSuburb || null,
          client_city: clientCity || null,
          client_postal_code: clientPostalCode || null,
          logo_path: logoPath,
          signature_path: signaturePath,
          phone, email, website,
          bank_name: bankName,
          bank_account_name: bankAccountName,
          bank_account_number: bankAccountNumber,
          project_description: projectDescription || null,
          total_due: grand,
          status: "issued",
        }).select("id").single();
        if (error) throw error;
        savedId = inv.id;
      } else {
        const { error } = await supabase.from("invoices").update({
          invoice_number: invoiceNumber.trim() || undefined,
          invoice_date: invoiceDate,
          client_name: clientName,
          company_name: companyName,
          client_street: clientStreet || null,
          client_suburb: clientSuburb || null,
          client_city: clientCity || null,
          client_postal_code: clientPostalCode || null,
          logo_path: logoPath,
          signature_path: signaturePath,
          phone, email, website,
          bank_name: bankName,
          bank_account_name: bankAccountName,
          bank_account_number: bankAccountNumber,
          project_description: projectDescription || null,
          total_due: grand,
        }).eq("id", id!);
        number = invoiceNumber.trim() || number;
        if (error) throw error;
        // wipe & reinsert items
        await supabase.from("invoice_items").delete().eq("invoice_id", id!);
      }

      const itemsPayload = items.map((it, i) => ({
        invoice_id: savedId!,
        user_id: user.id,
        position: i,
        service: it.service,
        note: it.note || null,
        qty: Number(it.qty) || 0,
        unit_price: Number(it.unit_price) || 0,
        original_unit_price: it.original_unit_price ? Number(it.original_unit_price) : null,
        total: calcRowTotal(it.qty, it.unit_price),
      }));
      if (itemsPayload.length) {
        const { error: itErr } = await supabase.from("invoice_items").insert(itemsPayload);
        if (itErr) throw itErr;
      }

      setInvoiceNumber(number);
      toast.success(isNew ? `Invoice ${number} saved` : "Invoice updated");
      if (isNew && savedId) nav(`/invoices/${savedId}/edit`, { replace: true });
      return savedId ?? null;
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function downloadPDF() {
    if (!sheetRef.current) return;
    setExporting(true);
    try {
      // Wait one tick to ensure latest values are painted
      await new Promise((r) => requestAnimationFrame(r));
      const token = clientToFilenameToken(clientName);
      await exportSheetToPDF(sheetRef.current, `${token}ArchiteqInvoice.pdf`);
    } catch (e: any) {
      toast.error("PDF export failed");
      console.error(e);
    } finally {
      setExporting(false);
    }
  }

  async function saveAndExport() {
    const sid = await save();
    if (sid !== null) await downloadPDF();
  }

  if (loading) {
    return (
      <AppShell eyebrow="Editing" title="Invoice">
        <div className="label-eyebrow">loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow={isNew ? "New" : "Editing"}
      title={isNew ? "Draft invoice" : invoiceNumber}
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={save} disabled={saving} className="rounded-sm h-9 gap-1.5">
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
          </Button>
          <Button onClick={saveAndExport} disabled={saving || exporting} className="bg-ink text-paper hover:bg-ink/90 rounded-sm h-9 gap-1.5">
            <Download className="h-3.5 w-3.5" /> {exporting ? "Exporting…" : "Save & PDF"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,420px)_1fr] gap-6 lg:gap-8 max-w-[1400px]">
        {/* ============= FORM ============= */}
        <div className="space-y-6">
          <section>
            <div className="label-eyebrow mb-3">Issued to</div>
            <div className="space-y-3">
              <Field label="Client name">
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="rounded-sm" />
              </Field>
              <Field label="Street address">
                <Input value={clientStreet} onChange={(e) => setClientStreet(e.target.value)} placeholder="123 Main Street" className="rounded-sm" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Suburb">
                  <Input value={clientSuburb} onChange={(e) => setClientSuburb(e.target.value)} placeholder="Sandton" className="rounded-sm" />
                </Field>
                <Field label="City">
                  <Input value={clientCity} onChange={(e) => setClientCity(e.target.value)} placeholder="Johannesburg" className="rounded-sm" />
                </Field>
              </div>
              <Field label="Postal code">
                <Input value={clientPostalCode} onChange={(e) => setClientPostalCode(e.target.value)} placeholder="2196" className="rounded-sm" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Invoice date">
                  <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="rounded-sm" />
                </Field>
                <Field label="Invoice №">
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Auto on save"
                    className="rounded-sm font-mono text-[12px]"
                  />
                </Field>
              </div>
              <p className="text-[11px] text-ink-mute leading-snug">
                Leave blank to auto-assign the next sequential number on save.
              </p>
            </div>
          </section>

          <section>
            <div className="label-eyebrow mb-3">Project description <span className="normal-case text-ink-faint">— optional</span></div>
            <Textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="A short summary of the work — appears above the line items on the PDF."
              className="rounded-sm min-h-[88px] text-[13px]"
            />
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="label-eyebrow">Line items</div>
              <button onClick={addItem} className="label-eyebrow flex items-center gap-1 hover:text-ink">
                <Plus className="h-3 w-3" /> add row
              </button>
            </div>
            <div className="border border-rule">
              {items.map((it, i) => (
                <div key={i} className="border-b border-rule last:border-b-0 p-3 space-y-2 bg-surface">
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[10px] text-ink-faint pt-2 w-5">{String(i + 1).padStart(2, "0")}</span>
                    <div className="flex-1 space-y-2 min-w-0">
                      <Input
                        value={it.service}
                        onChange={(e) => setItem(i, { service: e.target.value })}
                        placeholder="Service description"
                        className="rounded-sm h-9 text-[13px]"
                      />
                      <Input
                        value={it.note ?? ""}
                        onChange={(e) => setItem(i, { note: e.target.value })}
                        placeholder="Optional note (italic on invoice)"
                        className="rounded-sm h-8 text-[11px] text-ink-soft italic"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <SmartNumberInput
                          value={it.qty}
                          onChange={(v) => setItem(i, { qty: v })}
                          placeholder="Qty"
                        />
                        <SmartNumberInput
                          value={it.unit_price}
                          onChange={(v) => setItem(i, { unit_price: v })}
                          placeholder="Price"
                        />
                        <SmartNumberInput
                          value={it.original_unit_price ?? ""}
                          onChange={(v) => setItem(i, { original_unit_price: v === "" ? null : v })}
                          placeholder="Was (opt.)"
                        />
                      </div>
                    </div>
                    <button onClick={() => removeItem(i)} disabled={items.length === 1} className="text-ink-faint hover:text-destructive disabled:opacity-30 p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex justify-between items-baseline pl-7">
                    <span className="label-eyebrow text-[9px]">row total</span>
                    <span className="font-mono text-[12px] tabular-nums">{formatZAR(calcRowTotal(it.qty, it.unit_price))}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t-2 border-ink mt-2">
              <span className="font-display text-lg">Total Due</span>
              <span className="font-mono text-xl tabular-nums">{formatZAR(grand)}</span>
            </div>
          </section>

          <section className="text-[11px] text-ink-mute leading-relaxed border-t border-rule pt-4">
            Company info, logo, bank details and signature come from{" "}
            <a href="/settings" className="underline underline-offset-2 hover:text-ink">Settings</a>. Saved invoices keep their snapshot, so editing settings later won't alter past invoices.
          </section>
        </div>

        {/* ============= LIVE PREVIEW ============= */}
        <div className="space-y-3 min-w-0">
          <div className="flex items-center justify-between">
            <div className="label-eyebrow">A4 · live preview</div>
            <div className="font-mono text-[10px] text-ink-mute hidden sm:block">794 × 1123 px</div>
          </div>
          <div className="overflow-auto border border-rule bg-surface-sunk p-3 sm:p-6 rounded-sm" style={{ maxHeight: "calc(100vh - 200px)" }}>
            {/* Scale-down on smaller widths so the A4 sheet remains readable on mobile */}
            <div className="mx-auto origin-top-left lg:origin-top" style={{ width: 794 }}>
              <div className="scale-[0.42] sm:scale-[0.6] md:scale-[0.78] lg:scale-100 origin-top-left" style={{ transformOrigin: "top left" }}>
                <InvoiceSheet ref={sheetRef} data={previewData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="label-eyebrow">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/**
 * Number input that:
 * - Shows placeholder when value is "" or 0 (so the placeholder is readable)
 * - Auto-clears the leading "0" the moment the user types a real digit
 * - Uses inputMode="decimal" for a numeric keypad on mobile
 */
function SmartNumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  // Display as empty string when value is 0 or nullish so the placeholder shows.
  const display =
    value === null || value === undefined || value === "" || value === 0 || value === "0"
      ? ""
      : String(value);

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d.]/g, "");
        onChange(raw);
      }}
      onFocus={(e) => {
        // If the displayed value is "0", clear it on focus
        if (e.target.value === "0") onChange("");
      }}
      placeholder={placeholder}
      className="rounded-sm h-9 font-mono text-[12px] px-2"
    />
  );
}

