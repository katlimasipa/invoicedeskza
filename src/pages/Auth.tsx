import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Auth() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account created. You're in.");
        nav("/", { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav("/", { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-paper">
      {/* Editorial side */}
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-rule">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-sm bg-ink text-paper grid place-items-center font-display text-base">Iₐ</div>
          <span className="font-display text-base tracking-tight">Invoice Desk</span>
        </div>

        <div className="max-w-md space-y-6">
          <div className="label-eyebrow">the desk · vol. i</div>
          <h1 className="display text-5xl leading-[1.05] text-ink">
            Send invoices<br/>that get<br/><em className="not-italic" style={{fontStyle:"italic"}}>paid faster.</em>
          </h1>
          <p className="text-ink-soft text-[15px] leading-relaxed max-w-sm">
            A quiet, precise tool for South African freelancers and agencies. Save your details once, generate print-ready PDFs in seconds.
          </p>
          <div className="grid grid-cols-3 gap-px bg-rule border border-rule mt-8 max-w-sm">
            {[
              { k: "currency", v: "ZAR" },
              { k: "format", v: "A4 · PDF" },
              { k: "math", v: "auto" },
            ].map((s) => (
              <div key={s.k} className="bg-paper p-3">
                <div className="label-eyebrow text-[9px]">{s.k}</div>
                <div className="font-mono text-[12px] mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="label-eyebrow text-[10px]">Designed for the rand</div>
          <a
            href="https://architeq.co.za"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-ink-mute hover:text-ink transition-colors"
          >
            Built by <span className="text-ink-soft font-medium">Architeq Web Agency</span> →
          </a>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="h-7 w-7 rounded-sm bg-ink text-paper grid place-items-center font-display text-sm">Iₐ</div>
            <span className="font-display text-base">Invoice Desk</span>
          </div>

          <div className="label-eyebrow mb-2">{mode === "signup" ? "create account" : "sign in"}</div>
          <h2 className="display text-3xl mb-8 text-ink">
            {mode === "signup" ? "Open your ledger." : "Welcome back."}
          </h2>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label className="label-eyebrow" htmlFor="email">email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 rounded-sm" />
            </div>
            <div>
              <Label className="label-eyebrow" htmlFor="pwd">password</Label>
              <Input id="pwd" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 rounded-sm" />
            </div>
            <Button type="submit" disabled={busy} className="w-full bg-ink hover:bg-ink/90 text-paper rounded-sm h-10">
              {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <button
            onClick={() => setMode((m) => (m === "signup" ? "signin" : "signup"))}
            className="mt-5 text-[12px] text-ink-mute hover:text-ink"
          >
            {mode === "signup" ? "Already have an account? Sign in →" : "New here? Create an account →"}
          </button>

          <div className="mt-10 lg:hidden text-center">
            <a
              href="https://architeq.co.za"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-ink-mute hover:text-ink transition-colors"
            >
              Built by <span className="text-ink-soft font-medium">Architeq Web Agency</span> →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
