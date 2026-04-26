import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useSignedUrl } from "@/lib/useSignedUrl";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [signaturePath, setSignaturePath] = useState<string | null>(null);

  const logoUrl = useSignedUrl("logos", logoPath);
  const sigUrl = useSignedUrl("signatures", signaturePath);

  const logoInput = useRef<HTMLInputElement>(null);
  const sigInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("company_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setCompanyName(data.company_name ?? "");
        setPhone(data.phone ?? "");
        setEmail(data.email ?? "");
        setWebsite(data.website ?? "");
        setBankName(data.bank_name ?? "");
        setBankAccountName(data.bank_account_name ?? "");
        setBankAccountNumber(data.bank_account_number ?? "");
        setLogoPath(data.logo_path);
        setSignaturePath(data.signature_path);
      }
      setLoading(false);
    })();
  }, [user]);

  async function uploadFile(bucket: "logos" | "signatures", file: File): Promise<string | null> {
    if (!user) return null;
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error(error.message); return null; }
    return path;
  }

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const path = await uploadFile("logos", f);
    if (path) setLogoPath(path);
  }
  async function onSig(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const path = await uploadFile("signatures", f);
    if (path) setSignaturePath(path);
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("company_settings").upsert({
      user_id: user.id,
      company_name: companyName,
      phone, email, website,
      bank_name: bankName,
      bank_account_name: bankAccountName,
      bank_account_number: bankAccountNumber,
      logo_path: logoPath,
      signature_path: signaturePath,
      currency: "ZAR",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
  }

  if (loading) return <AppShell eyebrow="Workspace" title="Settings"><div className="label-eyebrow">loading…</div></AppShell>;

  return (
    <AppShell
      eyebrow="Workspace"
      title="Settings"
      action={
        <Button onClick={save} disabled={saving} className="bg-ink text-paper hover:bg-ink/90 rounded-sm h-9">
          {saving ? "Saving…" : "Save"}
        </Button>
      }
    >
      <div className="max-w-3xl space-y-12">
        <p className="text-ink-soft text-[14px] max-w-prose">
          Set this once. Every new invoice will pull these details automatically. Currency is fixed to ZAR.
        </p>

        {/* Company */}
        <section>
          <div className="label-eyebrow mb-4">Company</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FieldR label="Company name" full><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="rounded-sm" /></FieldR>
            <FieldR label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-sm" /></FieldR>
            <FieldR label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-sm" /></FieldR>
            <FieldR label="Website" full><Input value={website} onChange={(e) => setWebsite(e.target.value)} className="rounded-sm" /></FieldR>
          </div>
        </section>

        {/* Branding */}
        <section>
          <div className="label-eyebrow mb-4">Branding</div>
          <div className="grid sm:grid-cols-2 gap-6">
            <UploadCard
              label="Logo"
              hint="Square works best · PNG/SVG · ≤ 2 MB"
              url={logoUrl}
              onPick={() => logoInput.current?.click()}
              onClear={() => setLogoPath(null)}
            />
            <input ref={logoInput} type="file" accept="image/*" hidden onChange={onLogo} />
            <UploadCard
              label="Signature"
              hint="Transparent PNG ideal · sits above ‘Signed’"
              url={sigUrl}
              onPick={() => sigInput.current?.click()}
              onClear={() => setSignaturePath(null)}
            />
            <input ref={sigInput} type="file" accept="image/*" hidden onChange={onSig} />
          </div>
        </section>

        {/* Bank */}
        <section>
          <div className="label-eyebrow mb-4">Bank account</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FieldR label="Account name"><Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className="rounded-sm" /></FieldR>
            <FieldR label="Bank"><Input value={bankName} onChange={(e) => setBankName(e.target.value)} className="rounded-sm" /></FieldR>
            <FieldR label="Account number" full><Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="rounded-sm font-mono" /></FieldR>
          </div>
        </section>

        <section>
          <div className="label-eyebrow mb-4">Currency</div>
          <div className="inline-flex items-center gap-2 border border-rule px-3 py-1.5 rounded-sm">
            <span className="font-mono text-[12px]">ZAR</span>
            <span className="label-eyebrow text-[9px]">South African Rand · R</span>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function FieldR({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="label-eyebrow">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function UploadCard({ label, hint, url, onPick, onClear }: {
  label: string; hint: string; url: string | null; onPick: () => void; onClear: () => void;
}) {
  return (
    <div>
      <Label className="label-eyebrow">{label}</Label>
      <div className="mt-1.5 border border-rule bg-surface p-4 flex items-center gap-4">
        <div className="h-16 w-16 border border-dashed border-rule grid place-items-center bg-paper shrink-0 overflow-hidden">
          {url ? <img src={url} alt="" className="max-h-16 max-w-16 object-contain" /> : <span className="label-eyebrow text-[9px]">empty</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] text-ink-soft mb-2">{hint}</div>
          <div className="flex gap-2">
            <button onClick={onPick} className="text-[11px] border border-rule px-2.5 py-1 rounded-sm hover:bg-surface-sunk flex items-center gap-1.5">
              <Upload className="h-3 w-3" /> Upload
            </button>
            {url && (
              <button onClick={onClear} className="text-[11px] border border-rule px-2.5 py-1 rounded-sm hover:bg-surface-sunk flex items-center gap-1.5">
                <X className="h-3 w-3" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
