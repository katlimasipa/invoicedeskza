import { forwardRef, type ReactNode } from "react";
import { format } from "date-fns";
import { formatZAR, calcRowTotal, calcGrandTotal, formatPhone } from "@/lib/format";

export type InvoiceItemData = {
  service: string;
  note?: string | null;
  qty: number | string;
  unit_price: number | string;
  original_unit_price?: number | string | null;
};

export type InvoiceData = {
  invoice_number: string;
  invoice_date: string | Date;
  client_name: string;

  company_name?: string | null;
  logo_url?: string | null;
  signature_url?: string | null;

  phone?: string | null;
  email?: string | null;
  website?: string | null;

  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;

  project_description?: string | null;

  items: InvoiceItemData[];
};

const ITEMS_BEFORE_SHRINK = 10;

export const InvoiceSheet = forwardRef<HTMLDivElement, { data: InvoiceData }>(({ data }, ref) => {
  const dateText =
    data.invoice_date instanceof Date
      ? format(data.invoice_date, "dd/MM/yyyy")
      : format(new Date(data.invoice_date), "dd/MM/yyyy");

  const items = data.items.length ? data.items : [{ service: "", qty: 0, unit_price: 0 }];
  const grand = calcGrandTotal(items);
  const dense = items.length > ITEMS_BEFORE_SHRINK;

  const ink = "hsl(220 18% 11%)";
  const soft = "hsl(220 10% 32%)";
  const mute = "hsl(220 8% 52%)";
  const faint = "hsl(220 12% 86%)";
  const paper = "hsl(0 0% 100%)";
  const quiet = "hsl(42 18% 97%)";

  const bodyFs = dense ? 12 : 13;
  const noteFs = dense ? 10 : 10.5;
  const rowPad = dense ? "8px 0" : "11px 0";
  const sectionGap = dense ? 18 : 26;
  const font = "Inter Tight, Arial, sans-serif";
  const mono = "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace";

  const showWordmark = !data.logo_url && !!(data.company_name && data.company_name.trim());

  return (
    <div
      ref={ref}
      className="a4-sheet"
      style={{
        boxSizing: "border-box",
        padding: "52px 56px 42px 56px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        lineHeight: 1.45,
        background: paper,
        color: ink,
        fontFamily: font,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginBottom: 22 }}>
        <tbody>
          <tr>
            <td style={{ width: "62%", verticalAlign: "middle", padding: 0 }}>
              <table style={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
                <tbody>
                  <tr>
                    <td style={{ width: data.logo_url ? 240 : 116, verticalAlign: "middle", padding: 0 }}>
                      {data.logo_url ? (
                        <img
                          src={data.logo_url}
                          alt=""
                          crossOrigin="anonymous"
                          style={{ maxWidth: 236, maxHeight: 96, objectFit: "contain", display: "block" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 96,
                            height: 58,
                            border: `1px solid ${faint}`,
                            background: quiet,
                            display: "table-cell",
                            verticalAlign: "middle",
                            textAlign: "center",
                            fontFamily: mono,
                            fontSize: 9,
                            color: mute,
                          }}
                        >
                          LOGO
                        </div>
                      )}
                    </td>
                    {showWordmark ? (
                      <td style={{ verticalAlign: "middle", paddingLeft: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 22, color: ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {data.company_name}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                </tbody>
              </table>
            </td>
            <td style={{ width: "38%", verticalAlign: "middle", textAlign: "right", padding: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 27, color: ink, lineHeight: 1 }}>INVOICE</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ height: 2, background: ink, width: "100%", marginBottom: sectionGap }} />

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginBottom: sectionGap }}>
        <tbody>
          <tr>
            <td style={{ width: "56%", padding: 0, verticalAlign: "top" }}>
              <div style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, color: mute, marginBottom: 8 }}>INVOICE TO</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: ink, overflowWrap: "break-word" }}>{data.client_name || "—"}</div>
            </td>
            <td style={{ width: "44%", padding: 0, verticalAlign: "top" }}>
              <MetaRow label="Invoice No" value={data.invoice_number || "—"} />
              <MetaRow label="Invoice Date" value={dateText} />
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginBottom: sectionGap }}>
        <colgroup>
          <col style={{ width: "49%" }} />
          <col style={{ width: "11%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "18%" }} />
        </colgroup>
        <thead>
          <tr>
            <th style={headCell}>SERVICE</th>
            <th style={{ ...headCell, textAlign: "center" }}>QTY</th>
            <th style={{ ...headCell, textAlign: "right" }}>UNIT PRICE</th>
            <th style={{ ...headCell, textAlign: "right" }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const rowTotal = calcRowTotal(it.qty, it.unit_price);
            const orig = it.original_unit_price != null && Number(it.original_unit_price) > 0 ? Number(it.original_unit_price) : null;

            return (
              <tr key={i}>
                <td style={{ ...bodyCell, padding: rowPad, paddingRight: 16, verticalAlign: "top" }}>
                  <div style={{ fontSize: bodyFs, fontWeight: 600, color: ink, overflowWrap: "break-word", wordBreak: "normal", lineHeight: 1.42 }}>
                    {it.service || "—"}
                  </div>
                  {it.note ? (
                    <div style={{ fontSize: noteFs, color: soft, marginTop: 4, lineHeight: 1.42, overflowWrap: "break-word" }}>
                      * {it.note}
                    </div>
                  ) : null}
                </td>
                <td style={{ ...bodyCell, padding: rowPad, textAlign: "center", fontSize: bodyFs, fontVariantNumeric: "tabular-nums", verticalAlign: "top" }}>{it.qty || 0}</td>
                <td style={{ ...bodyCell, padding: rowPad, textAlign: "right", fontSize: bodyFs, fontVariantNumeric: "tabular-nums", verticalAlign: "top", whiteSpace: "nowrap" }}>
                  {orig ? (
                    <>
                      <div style={{ color: mute, fontSize: bodyFs - 1, textDecoration: "line-through", lineHeight: 1.2 }}>{formatZAR(orig)}</div>
                      <div>{formatZAR(it.unit_price)}</div>
                    </>
                  ) : (
                    formatZAR(it.unit_price)
                  )}
                </td>
                <td style={{ ...bodyCell, padding: rowPad, textAlign: "right", fontSize: bodyFs, fontWeight: 700, fontVariantNumeric: "tabular-nums", verticalAlign: "top", whiteSpace: "nowrap" }}>
                  {formatZAR(rowTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ flex: 1, minHeight: dense ? 12 : 28 }} />

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginBottom: dense ? 20 : 30 }}>
        <tbody>
          <tr>
            <td style={{ width: "52%", padding: "0 26px 0 0", verticalAlign: "top" }}>
              <div style={{ borderTop: `1px solid ${ink}`, paddingTop: 12 }}>
                <div style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, color: mute, marginBottom: 8 }}>BANK ACCOUNT DETAILS</div>
                <DetailLine label="Name" value={data.bank_account_name || "—"} />
                <DetailLine label="Bank" value={data.bank_name || "—"} />
                <DetailLine label="Acc no" value={data.bank_account_number || "—"} mono />
              </div>
            </td>
            <td style={{ width: "48%", padding: 0, verticalAlign: "top" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", borderTop: `2px solid ${ink}`, borderBottom: `2px solid ${ink}` }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "15px 0", fontSize: 15, fontWeight: 800, color: ink }}>Total Due</td>
                    <td style={{ padding: "15px 0", fontSize: 15, fontWeight: 800, color: ink, textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {formatZAR(grand)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginBottom: dense ? 18 : 28 }}>
        <tbody>
          <tr>
            <td style={{ width: "50%", padding: 0, verticalAlign: "bottom" }}>
              <div style={{ height: 58 }}>
                {data.signature_url ? (
                  <img src={data.signature_url} alt="" crossOrigin="anonymous" style={{ maxHeight: 54, maxWidth: 210, objectFit: "contain", display: "block" }} />
                ) : null}
              </div>
              <div style={{ height: 1, background: ink, width: 210 }} />
              <div style={{ fontSize: 11, color: soft, marginTop: 7, marginLeft: 78 }}>Signed</div>
            </td>
            <td style={{ width: "50%", padding: 0, verticalAlign: "bottom", textAlign: "right" }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: ink }}>THANK YOU!</div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", borderTop: `1px solid ${faint}`, paddingTop: 10 }}>
        <tbody>
          <tr>
            <td style={{ width: "34%", padding: "11px 8px 0 0", verticalAlign: "top" }}>
              {data.phone ? <FooterLine icon={<PhoneGlyph />} text={formatPhone(data.phone)} mono /> : null}
            </td>
            <td style={{ width: "33%", padding: "11px 8px 0 8px", verticalAlign: "top" }}>
              {data.email ? <FooterLine icon={<MailGlyph />} text={data.email} /> : null}
            </td>
            <td style={{ width: "33%", padding: "11px 0 0 8px", verticalAlign: "top" }}>
              {data.website ? <FooterLine icon={<GlobeGlyph />} text={data.website} /> : null}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
});
InvoiceSheet.displayName = "InvoiceSheet";

const headCell = {
  borderTop: "1px solid hsl(220 18% 11%)",
  borderBottom: "1px solid hsl(220 12% 86%)",
  padding: "12px 0 10px",
  textAlign: "left" as const,
  fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 10,
  fontWeight: 700,
  color: "hsl(220 8% 52%)",
};

const bodyCell = {
  borderBottom: "1px solid hsl(220 12% 86%)",
  color: "hsl(220 18% 11%)",
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginBottom: 7 }}>
      <tbody>
        <tr>
          <td style={{ width: "46%", padding: 0, textAlign: "right", fontSize: 12, color: "hsl(220 10% 32%)" }}>{label}</td>
          <td style={{ width: "54%", padding: 0, textAlign: "right", fontSize: 12.5, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "hsl(220 18% 11%)", whiteSpace: "nowrap" }}>{value}</td>
        </tr>
      </tbody>
    </table>
  );
}

function DetailLine({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginBottom: 5 }}>
      <tbody>
        <tr>
          <td style={{ width: 56, padding: 0, verticalAlign: "top", fontSize: 12, fontWeight: 700, color: "hsl(220 18% 11%)" }}>{label}</td>
          <td style={{ padding: 0, verticalAlign: "top", fontSize: 12, color: "hsl(220 18% 11%)", fontVariantNumeric: mono ? "tabular-nums" : undefined, overflowWrap: "break-word" }}>{value}</td>
        </tr>
      </tbody>
    </table>
  );
}

function FooterLine({ icon, text, mono = false }: { icon: ReactNode; text: string; mono?: boolean }) {
  return (
    <table style={{ borderCollapse: "collapse", tableLayout: "fixed", maxWidth: "100%" }}>
      <tbody>
        <tr>
          <td style={{ width: 17, padding: 0, verticalAlign: "middle" }}>{icon}</td>
          <td style={{ padding: "0 0 0 7px", verticalAlign: "middle", fontSize: 11, color: "hsl(220 18% 11%)", fontVariantNumeric: mono ? "tabular-nums" : undefined, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {text}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function PhoneGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="hsl(220 18% 11%)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function MailGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="hsl(220 18% 11%)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
function GlobeGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="hsl(220 18% 11%)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
