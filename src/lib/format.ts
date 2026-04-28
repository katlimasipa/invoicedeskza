// South African Rand formatting that matches the reference exactly:
// "R 3 000" — currency symbol, regular space, then thin-space thousand groups.
const THIN = "\u202F"; // narrow no-break space

export function formatZAR(value: number | string | null | undefined, opts?: { withSymbol?: boolean; decimals?: 0 | 2 | "auto" }) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (n == null || Number.isNaN(n)) return opts?.withSymbol === false ? "0" : `R${THIN}0`;

  const decimals = opts?.decimals ?? "auto";
  const useDecimals = decimals === "auto" ? Number.isInteger(n) ? 0 : 2 : decimals;

  const fixed = Math.abs(n).toFixed(useDecimals);
  const [int, frac] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
  const sign = n < 0 ? "-" : "";
  const body = frac ? `${grouped}.${frac}` : grouped;
  return opts?.withSymbol === false ? `${sign}${body}` : `R${THIN}${sign}${body}`;
}

export function calcRowTotal(qty: number | string, unit: number | string): number {
  const q = typeof qty === "string" ? parseFloat(qty) || 0 : qty || 0;
  const u = typeof unit === "string" ? parseFloat(unit) || 0 : unit || 0;
  return Math.round(q * u * 100) / 100;
}

export function calcGrandTotal(items: { qty: number | string; unit_price: number | string }[]): number {
  return items.reduce((s, i) => s + calcRowTotal(i.qty, i.unit_price), 0);
}

/**
 * Format a phone number into "+27 123 456 7890" style.
 * Accepts strings with any spacing/formatting; falls back to the raw string
 * when it can't confidently regroup it.
 */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";
  // strip everything except digits and a leading +
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return trimmed;

  // Normalise SA local "0xx..." → "+27 xx..."
  let cc = "";
  let rest = digits;
  if (hasPlus) {
    // assume first 1-3 digits are country code; default SA = 27
    if (digits.startsWith("27")) { cc = "27"; rest = digits.slice(2); }
    else { cc = digits.slice(0, 2); rest = digits.slice(2); }
  } else if (digits.startsWith("27") && digits.length >= 11) {
    cc = "27"; rest = digits.slice(2);
  } else if (digits.startsWith("0")) {
    cc = "27"; rest = digits.slice(1);
  } else {
    return trimmed;
  }

  // No spaces within the number → "+27123456789"
  return `+${cc}${rest}`;
}

/** Sanitise a client name into a filename-safe PascalCase token. */
export function clientToFilenameToken(name: string | null | undefined): string {
  if (!name) return "Client";
  const cleaned = String(name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .trim();
  if (!cleaned) return "Client";
  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}
