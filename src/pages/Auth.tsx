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

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) toast.error(error.message);
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
          <div className="label-eyebrow">№ 0001 · since today</div>
          <h1 className="display text-5xl leading-[1.05] text-ink">
            Invoices that<br/>look like you<br/><em className="not-italic" style={{fontStyle:"italic"}}>mean it.</em>
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
          <div className="label-eyebrow text-[10px]">Built in Cape Town · Designed for the rand</div>
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

          <button
            onClick={google}
            className="w-full border border-rule bg-surface hover:bg-surface-sunk transition-colors px-4 py-2.5 text-[13px] flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 13.9-5.5l-6.4-5.4C29.4 34.7 26.8 36 24 36c-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.4 5.4C40.9 36.6 44 30.8 44 24c0-1.2-.1-2.3-.4-3.5z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-rule flex-1" />
            <span className="label-eyebrow text-[9px]">or</span>
            <div className="h-px bg-rule flex-1" />
          </div>

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
