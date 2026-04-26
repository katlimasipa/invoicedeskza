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
