import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-paper px-6">
      <div className="max-w-md text-center">
        <div className="label-eyebrow mb-4">404 · misplaced</div>
        <h1 className="display text-5xl text-ink mb-4">Page not found.</h1>
        <p className="text-ink-soft text-[14px] mb-6">The ledger doesn't have an entry for that.</p>
        <Link to="/" className="text-[13px] underline underline-offset-2 hover:text-ink">← back to overview</Link>
      </div>
    </div>
  );
}
